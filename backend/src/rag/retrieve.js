// Búsqueda: compara el embedding de la pregunta contra todos los fragmentos
// de data/index.json y regresa los más parecidos.

import { readFileSync } from 'node:fs';

const INDEX_URL = new URL('../../data/index.json', import.meta.url);

function loadIndex() {
  let index;
  try {
    index = JSON.parse(readFileSync(INDEX_URL, 'utf8'));
  } catch {
    throw new Error('No pude leer data/index.json. Corre primero: npm run ingest');
  }
  if (!index.chunks?.length) throw new Error('data/index.json no tiene fragmentos.');

  const queryModel = process.env.VOYAGE_MODEL || 'voyage-4';
  if (index.model !== queryModel) {
    // Vectores de modelos distintos no se pueden comparar entre sí.
    throw new Error(`El índice se hizo con ${index.model}, pero VOYAGE_MODEL es ${queryModel}.`);
  }
  return index;
}

export const index = loadIndex();

// Similitud coseno: qué tan parecida es la dirección de dos vectores. 1 = mismo significado, 0 = nada que ver.
export function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Calcula el puntaje de los 53 fragmentos, los ordena de mayor a menor y regresa los k mejores, cada uno con su fuente.
export function search(queryVector, k = 5) {
  return index.chunks
    .map((chunk) => ({
      id: chunk.id,
      heading: chunk.heading,
      text: chunk.text,
      source: index.sources[chunk.sourceId],
      score: cosineSimilarity(queryVector, chunk.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}