// Manda cada pregunta de evals/questions.json a POST /ask y revisa el status, la fuente citada y el dato clave.
// Además mide la calidad: pasos de más en preguntas de un solo dato y marcas como [3] dentro del texto.

import { readFile, writeFile, mkdir } from 'node:fs/promises';

const API_URL = process.env.EVAL_API_URL || 'http://localhost:3000';
// 6.5 s entre preguntas para no pasar el límite de 10 por minuto.
const DELAY_MS = Number(process.env.EVAL_DELAY_MS) || 6500;

const ROOT = new URL('../', import.meta.url);
const questions = JSON.parse(await readFile(new URL('evals/questions.json', ROOT), 'utf8'));
const index = JSON.parse(await readFile(new URL('data/index.json', ROOT), 'utf8'));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const normalize = (text) =>
  text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

async function ask(question) {
  const start = Date.now();
  try {
    const res = await fetch(`${API_URL}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    const body = await res.json();
    const status = res.ok ? body.status : `error:${body.error?.code ?? res.status}`;
    return { status, body, ms: Date.now() - start };
  } catch (err) {
    return { status: 'error:NETWORK', body: null, ms: Date.now() - start, detail: err.message };
  }
}

function grade(item, { status, body }) {
  const result = { statusOk: status === item.expected, sourceOk: null, contentOk: null };
  const refused = status === 'no_info' || status === 'off_topic';

  if (item.expected === 'answered') {
    if (status === 'answered') {
      const expectedUrls = item.sources.map((id) => index.sources[id]?.url);
      result.sourceOk = body.sources.some((s) => expectedUrls.includes(s.url));

      const text = normalize(
        [body.summary.text, ...body.steps.map((step) => step.text)].join(' '),
      );
      result.contentOk = (item.mustInclude ?? []).every((group) =>
        group.split('|').some((option) => text.includes(normalize(option))),
      );
    } else {
      result.sourceOk = false;
      result.contentOk = false;
    }
    
    if (status === 'answered') {
      const texts = [body.summary.text, ...body.steps.map((step) => step.text)];
      result.noMarkers = !texts.some((t) => /\[\d+\]/.test(t));
      if (item.steps === false) result.noExtraSteps = body.steps.length === 0;
    }
    result.pass = result.statusOk && result.sourceOk && result.contentOk;
  } else {
    result.refused = refused;
    result.pass = result.statusOk;
  }
  return result;
}

console.log(`Evals contra ${API_URL} · ${questions.length} preguntas · pausa de ${DELAY_MS} ms\n`);

const rows = [];
for (const [i, item] of questions.entries()) {
  if (i > 0) await sleep(DELAY_MS);
  const response = await ask(item.question);
  const result = grade(item, response);
  rows.push({ ...item, got: response.status, ms: response.ms, ...result, response: response.body });

  const mark = result.pass ? '✓' : '✗';
  console.log(`${mark} ${item.id}  esperado: ${item.expected.padEnd(9)}  obtuvo: ${response.status.padEnd(9)}  ${response.ms} ms  ${item.question}`);
}

const pct = (n, d) => (d ? `${Math.round((n / d) * 100)}% (${n}/${d})` : '—');
const answerable = rows.filter((r) => r.expected === 'answered');
const unanswerable = rows.filter((r) => r.expected !== 'answered');
const oneFact = answerable.filter((r) => r.steps === false && r.got === 'answered');
const answered = rows.filter((r) => r.got === 'answered');
const errors = rows.filter((r) => r.got.startsWith('error'));
const avgMs = Math.round(rows.reduce((sum, r) => sum + r.ms, 0) / rows.length);

const summary = {
  date: new Date().toISOString(),
  total: rows.length,
  pass: rows.filter((r) => r.pass).length,
  statusCorrect: rows.filter((r) => r.statusOk).length,
  answerable: answerable.length,
  sourceCorrect: answerable.filter((r) => r.sourceOk).length,
  contentCorrect: answerable.filter((r) => r.contentOk).length,
  unanswerable: unanswerable.length,
  refused: unanswerable.filter((r) => r.refused).length,
  oneFact: oneFact.length,
  noExtraSteps: oneFact.filter((r) => r.noExtraSteps).length,
  answered: answered.length,
  noMarkers: answered.filter((r) => r.noMarkers).length,
  errors: errors.length,
  avgMs,
};

const table = `| Métrica | Resultado |
|---|---|
| Preguntas que pasan todo | ${pct(summary.pass, summary.total)} |
| Status correcto | ${pct(summary.statusCorrect, summary.total)} |
| Cita una fuente correcta (preguntas con respuesta) | ${pct(summary.sourceCorrect, summary.answerable)} |
| Trae el dato clave (preguntas con respuesta) | ${pct(summary.contentCorrect, summary.answerable)} |
| Se niega cuando debe (sin información + fuera de tema) | ${pct(summary.refused, summary.unanswerable)} |
| Calidad: sin pasos de más (preguntas de un solo dato) | ${pct(summary.noExtraSteps, summary.oneFact)} |
| Calidad: sin marcas [n] dentro del texto | ${pct(summary.noMarkers, summary.answered)} |
| Errores (502/500/red) | ${summary.errors} |
| Tiempo promedio por pregunta | ${(avgMs / 1000).toFixed(1)} s |`;

console.log(`\n${table}\n`);

const failed = rows.filter((r) => !r.pass);
if (failed.length) {
  console.log('Fallas para revisar:');
  for (const r of failed) {
    const why = !r.statusOk ? `status ${r.got}` : !r.sourceOk ? 'fuente' : 'dato clave';
    console.log(`  ${r.id} (${why}): ${r.question}`);
  }
}

// Se guardan las respuestas completas para comparar entre corridas.
const stamp = summary.date.slice(0, 16).replace(/[:T]/g, '-');
const outDir = new URL('evals/results/', ROOT);
await mkdir(outDir, { recursive: true });
await writeFile(new URL(`${stamp}.json`, outDir), JSON.stringify({ summary, rows }, null, 2));
console.log(`\nResultados guardados en evals/results/${stamp}.json`);