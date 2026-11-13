// Herramienta para calibrar el umbral de "fuera de tema".
// Uso:
//   npm run similarity -- "¿Cuánto cuesta una copia certificada?"
//     → los 5 fragmentos más parecidos a una pregunta y su puntaje.
//   npm run similarity -- --file evals/short-questions.json
//     → el mejor puntaje de cada pregunta del archivo, con UNA sola llamada a Voyage.

import { readFileSync } from 'node:fs';
import { embedQueries } from '../src/rag/embeddings.js';
import { search } from '../src/rag/retrieve.js';

const THRESHOLD = Number(process.env.SIMILARITY_THRESHOLD) || 0.5;
const args = process.argv.slice(2);

if (args[0] === '--file') {
  await checkFile(args[1]);
} else {
  await showOne(args.join(' ').trim());
}

async function showOne(question) {
  if (!question) {
    console.error('Escribe una pregunta: npm run similarity -- "tu pregunta"');
    process.exit(1);
  }
  const [vector] = await embedQueries([question]);
  console.log(`\nPregunta: ${question}\n`);
  for (const r of search(vector, 5)) {
    console.log(`${r.score.toFixed(3)}  ${r.id}  ·  ${r.heading}`);
  }
}

// El archivo es una lista de { "question": "...", "expected": "in" | "out" }. "in" = el corpus sí habla de eso (debe pasar el umbral); "out" = fuera de tema.
async function checkFile(path) {
  if (!path) {
    console.error('Escribe la ruta: npm run similarity -- --file evals/short-questions.json');
    process.exit(1);
  }
  const items = JSON.parse(readFileSync(path, 'utf8'));
  const vectors = await embedQueries(items.map((item) => item.question));

  console.log(`\nUmbral: ${THRESHOLD}   (✓ = la app haría lo correcto)\n`);
  let wrongIn = 0;
  let wrongOut = 0;

  items.forEach((item, i) => {
    const [best] = search(vectors[i], 1);
    const passes = best.score >= THRESHOLD;
    const ok = item.expected === 'in' ? passes : !passes;
    if (!ok && item.expected === 'in') wrongIn++;
    if (!ok && item.expected === 'out') wrongOut++;
    console.log(`${ok ? '✓' : '✗'} ${best.score.toFixed(3)}  [${item.expected}]  ${item.question}  →  ${best.heading}`);
  });

  const totalIn = items.filter((item) => item.expected === 'in').length;
  const totalOut = items.length - totalIn;
  console.log(`\nDel tema rechazadas como "fuera de tema": ${wrongIn} de ${totalIn}`);
  console.log(`Fuera de tema que sí pasarían el umbral: ${wrongOut} de ${totalOut}\n`);
}