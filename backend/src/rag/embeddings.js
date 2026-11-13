// Igual que en ingest.js, pero con input_type "query": Voyage optimiza distinto las preguntas y los fragmentos (que se guardaron como "document").

import { UpstreamError } from '../errors.js';

const TIMEOUT_MS = 10_000; // deja tiempo al modelo dentro de los 30 s del frontend

// Convierte varias preguntas en embeddings con UNA sola petición a Voyage.
// Así similarity.js puede medir muchas preguntas sin chocar con el límite por minuto.
export async function embedQueries(questions) {
  const env = process.env;
  const baseUrl = env.VOYAGE_BASE_URL || 'https://ai.mongodb.com/v1';

  let res;
  try {
    res = await fetch(`${baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.VOYAGE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: questions,
        model: env.VOYAGE_MODEL || 'voyage-4',
        input_type: 'query',
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    throw new UpstreamError('Voyage', err.message);
  }

  if (!res.ok) throw new UpstreamError('Voyage', `${res.status} ${await res.text()}`);

  const data = await res.json();
  // Voyage marca cada resultado con su "index"; lo ordenamos para que coincida con questions.
  return data.data.sort((a, b) => a.index - b.index).map((item) => item.embedding);
}

// /ask usa una sola pregunta.
export async function embedQuery(question) {
  const [embedding] = await embedQueries([question]);
  return embedding;
}