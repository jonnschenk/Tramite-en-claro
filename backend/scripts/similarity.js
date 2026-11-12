// Herramienta para calibrar el umbral de "fuera de tema".
// Muestra los 5 fragmentos más parecidos a una pregunta y su puntaje.
// Uso: npm run similarity -- "¿Cuánto cuesta una copia certificada?"

import { embedQuery } from '../src/rag/embeddings.js';
import { search } from '../src/rag/retrieve.js';

const question = process.argv.slice(2).join(' ').trim();
if (!question) {
  console.error('Escribe una pregunta: npm run similarity -- "tu pregunta"');
  process.exit(1);
}

const vector = await embedQuery(question);
const results = search(vector, 5);

console.log(`\nPregunta: ${question}\n`);
for (const r of results) {
  console.log(`${r.score.toFixed(3)}  ${r.id}  ·  ${r.heading}`);
}