// Genera data/index.json a partir de data/sources/*.md.
// Correr de nuevo cada vez que cambien las fuentes.
// --dry-run muestra los fragmentos sin llamar a Voyage.

import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCES_DIR = path.join(ROOT, 'data', 'sources');
const INDEX_PATH = path.join(ROOT, 'data', 'index.json');

const MAX_WORDS = 250; // una sección más larga se parte en varios fragmentos
const MIN_WORDS = 30; // una sección más corta se une con la siguiente
const BATCH_SIZE = 64; // fragmentos por petición a Voyage

const env = process.env;
const DRY_RUN = process.argv.includes('--dry-run');
const VOYAGE_BASE_URL = env.VOYAGE_BASE_URL || 'https://ai.mongodb.com/v1';
const VOYAGE_MODEL = env.VOYAGE_MODEL || 'voyage-4';

const REQUIRED_FIELDS = ['id', 'titulo', 'url', 'consultado'];

function fail(msg) {
  console.error(`\n✗ ${msg}`);
  process.exit(1);
}

const countWords = (text) => text.split(/\s+/).filter(Boolean).length;

// Se corta cada línea en el primer ":" porque las notas y las URL
// también pueden llevar ":".
function parseSource(fileName, raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) fail(`${fileName}: no tiene frontmatter entre "---".`);

  const [, frontmatterText, body] = match;
  const meta = {};
  for (const line of frontmatterText.split('\n')) {
    const i = line.indexOf(':');
    if (i === -1) continue;
    meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }

  for (const field of REQUIRED_FIELDS) {
    if (!meta[field]) fail(`${fileName}: falta el campo "${field}" en el frontmatter.`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.consultado)) {
    fail(`${fileName}: "consultado" debe ser AAAA-MM-DD (tiene "${meta.consultado}").`);
  }

  const source = {
    id: meta.id,
    title: meta.titulo,
    url: meta.url,
    domain: new URL(meta.url).hostname.replace(/^www\./, ''),
    consultedAt: meta.consultado,
  };

  return { source, body };
}

// El texto antes del primer "##" también cuenta como sección.
function splitSections(body) {
  const docTitle = body.match(/^# (.+)$/m)?.[1].trim() ?? '';
  const withoutTitle = body.replace(/^# .+$/m, '');

  const sections = [];
  let current = { heading: 'Introducción', lines: [] };
  for (const line of withoutTitle.split('\n')) {
    if (line.startsWith('## ')) {
      sections.push(current);
      current = { heading: line.slice(3).trim(), lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  sections.push(current);

  const clean = sections
    .map((s) => ({ heading: s.heading, text: s.lines.join('\n').trim() }))
    .filter((s) => s.text.length > 0);

  return { docTitle, sections: clean };
}

// Las tablas se parten por filas y cada pedazo repite el encabezado,
// para que cada fragmento se entienda solo.
function splitLongText(text) {
  const blocks = [];
  for (const block of text.split(/\n\s*\n/)) {
    const lines = block.split('\n');
    const isTable = lines.length > 2 && lines.every((l) => l.trim().startsWith('|'));
    if (isTable && countWords(block) > MAX_WORDS) {
      const header = lines.slice(0, 2).join('\n');
      for (const row of lines.slice(2)) blocks.push({ text: row, tableHeader: header });
    } else {
      blocks.push({ text: block });
    }
  }

  const pieces = [];
  let current = [];
  let words = 0;
  let header = null;
  const flush = () => {
    if (!current.length) return;
    pieces.push((header ? `${header}\n` : '') + current.join(header ? '\n' : '\n\n'));
    current = [];
    words = 0;
    header = null;
  };
  for (const block of blocks) {
    const blockWords = countWords(block.text);
    const sameKind = (block.tableHeader ?? null) === header;
    if (current.length && (words + blockWords > MAX_WORDS || !sameKind)) flush();
    header = block.tableHeader ?? null;
    current.push(block.text);
    words += blockWords;
  }
  flush();
  return pieces;
}

// Cada fragmento empieza con "Título del documento — Sección" para que
// el embedding sepa de qué trámite habla aunque el texto sea corto
// (por ejemplo, una sección "Costo" que solo dice "Gratuito").
function chunkSource(source, body) {
  const { docTitle, sections } = splitSections(body);

  // Une secciones muy cortas con la siguiente.
  const merged = [];
  for (const s of sections) {
    const prev = merged.at(-1);
    if (prev && countWords(prev.text) < MIN_WORDS) {
      prev.heading = `${prev.heading} · ${s.heading}`;
      prev.text = `${prev.text}\n\n## ${s.heading}\n${s.text}`;
    } else {
      merged.push({ ...s });
    }
  }

  const chunks = [];
  for (const s of merged) {
    const pieces = countWords(s.text) > MAX_WORDS ? splitLongText(s.text) : [s.text];
    pieces.forEach((piece, i) => {
      const heading = pieces.length > 1 ? `${s.heading} (parte ${i + 1})` : s.heading;
      const text = `${docTitle} — ${heading}\n\n${piece}`;
      chunks.push({
        id: `${source.id}#${chunks.length + 1}`,
        sourceId: source.id,
        heading,
        text,
        words: countWords(text),
      });
    });
  }
  return chunks;
}

// Los fragmentos van como "document"; las preguntas, como "query" (en /ask).
async function embedDocuments(texts) {
  if (!env.VOYAGE_API_KEY) fail('Falta VOYAGE_API_KEY en .env');

  const vectors = [];
  let totalTokens = 0;

  for (let start = 0; start < texts.length; start += BATCH_SIZE) {
    const batch = texts.slice(start, start + BATCH_SIZE);
    const res = await fetch(`${VOYAGE_BASE_URL}/embeddings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.VOYAGE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: batch, model: VOYAGE_MODEL, input_type: 'document' }),
    });

    if (!res.ok) fail(`Voyage falló: ${res.status} ${await res.text()}`);

    const data = await res.json();
    // Voyage regresa cada vector con su "index"; se ordenan para no mezclarlos.
    data.data.sort((a, b) => a.index - b.index);
    if (data.data.length !== batch.length) fail('Voyage regresó un número distinto de vectores.');

    vectors.push(...data.data.map((d) => d.embedding));
    totalTokens += data.usage?.total_tokens ?? 0;
    console.log(`  Voyage: ${vectors.length}/${texts.length} fragmentos`);
  }

  return { vectors, totalTokens };
}

const files = (await readdir(SOURCES_DIR)).filter((f) => f.endsWith('.md')).sort();
if (!files.length) fail(`No hay archivos .md en ${SOURCES_DIR}`);

const sources = {};
const chunks = [];

for (const file of files) {
  const raw = (await readFile(path.join(SOURCES_DIR, file), 'utf8')).replace(/\r\n/g, '\n');
  const { source, body } = parseSource(file, raw);
  if (sources[source.id]) fail(`${file}: el id "${source.id}" está repetido.`);

  sources[source.id] = source;
  const sourceChunks = chunkSource(source, body);
  chunks.push(...sourceChunks);

  const sizes = sourceChunks.map((c) => c.words).join(', ');
  console.log(`${file}: ${sourceChunks.length} fragmentos (palabras: ${sizes})`);
}

const words = chunks.map((c) => c.words);
console.log(
  `\nTotal: ${files.length} fuentes, ${chunks.length} fragmentos, ` +
    `de ${Math.min(...words)} a ${Math.max(...words)} palabras.`,
);

if (DRY_RUN) {
  for (const c of chunks) console.log(`\n----- ${c.id} (${c.words} palabras)\n${c.text}`);
  console.log('\nModo --dry-run: no se llamó a Voyage ni se escribió index.json.');
  process.exit(0);
}

console.log(`\nPidiendo embeddings a Voyage (${VOYAGE_MODEL})…`);
const { vectors, totalTokens } = await embedDocuments(chunks.map((c) => c.text));

const index = {
  createdAt: new Date().toISOString(),
  model: VOYAGE_MODEL,
  inputType: 'document',
  dimensions: vectors[0].length,
  settings: { maxWords: MAX_WORDS, minWords: MIN_WORDS },
  sources,
  chunks: chunks.map((c, i) => ({ ...c, embedding: vectors[i] })),
};

// Sin sangría: con ~1000 números por fragmento, el archivo con sangría
// sería enorme y cada cambio llenaría el diff de Git.
await writeFile(INDEX_PATH, JSON.stringify(index));

console.log(
  `\n✓ data/index.json listo: ${chunks.length} fragmentos, ` +
    `${index.dimensions} dimensiones, ${totalTokens} tokens usados.`,
);