import { mockResponses, mockErrors } from '../mocks/ask-responses.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export const MAX_LENGTH = 500; // mismo límite que el backend
const TIMEOUT_MS = 30_000;
// Render gratis se duerme tras 15 min sin visitas y tarda ~1 min en despertar.
const WAKE_TIMEOUT_MS = 90_000;

let wakeUp = null; // la llamada a /health; se hace una sola vez por visita

// Despierta al servidor al abrir la página. Nunca lanza: si falla, ask mostrará su propio error.
export function wakeUpServer() {
  if (USE_MOCKS) return Promise.resolve();
  wakeUp ??= fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(WAKE_TIMEOUT_MS) })
    .then(() => {})
    .catch(() => {});
  return wakeUp;
}

export function validateQuestion(question) {
  const clean = question.trim();
  if (clean.length === 0) {
    return { code: 'EMPTY_QUESTION', message: 'Escribe tu pregunta antes de enviar.' };
  }
  if (clean.length > MAX_LENGTH) {
    return {
      code: 'QUESTION_TOO_LONG',
      message: `Tu pregunta tiene ${clean.length} caracteres. Resúmela a ${MAX_LENGTH} o menos.`,
    };
  }
  return null;
}

// Nunca lanza: siempre regresa { state } con 'answered' | 'no_info' | 'off_topic' | 'invalid' | 'error'.
export async function askQuestion(question) {
  const invalid = validateQuestion(question);
  if (invalid) return { state: 'invalid', ...invalid };

  // Si el servidor sigue despertando, esperamos antes de contar los 30 s de /ask.
  await wakeUpServer();

  let res;
  try {
    res = USE_MOCKS
      ? await fakeFetch()
      : await fetch(`${API_URL}/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: question.trim() }),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
  } catch (err) {
    const timedOut = err.name === 'TimeoutError';
    return {
      state: 'error',
      code: timedOut ? 'TIMEOUT' : 'NETWORK_ERROR',
      message: timedOut
        ? 'La búsqueda tardó demasiado. Intenta de nuevo.'
        : 'No pudimos conectar con el servicio. Revisa tu conexión e intenta de nuevo.',
    };
  }

  const body = await res.json().catch(() => null);

  if (res.ok && body?.status) {
    return { state: body.status, data: body };
  }

  const code = body?.error?.code || 'INTERNAL_ERROR';

  if (res.status === 400) {
    return { state: 'invalid', code, message: body?.error?.message || 'Revisa tu pregunta.' };
  }
  if (res.status === 429) {
    return {
      state: 'error',
      code,
      message: 'Llegaste al límite de preguntas por ahora. Intenta en unos minutos.',
    };
  }
  return {
    state: 'error',
    code,
    message: 'El servicio no respondió. Intenta de nuevo.',
  };
}

// Modo mock: ?mock=answered|noInfo|offTopic|rateLimited|upstream|internal|network y ?delay=ms (1200 por defecto).
// Regresa un Response real para que los mocks pasen por el mismo manejo que la API.
async function fakeFetch() {
  const params = new URLSearchParams(window.location.search);
  const scenario = params.get('mock') || 'answered';
  const delay = Number(params.get('delay') ?? 1200);

  await new Promise((resolve) => setTimeout(resolve, delay));

  if (scenario === 'network') throw new TypeError('Failed to fetch');

  if (mockResponses[scenario]) {
    return new Response(JSON.stringify(mockResponses[scenario]), { status: 200 });
  }
  const error = mockErrors[scenario] || mockErrors.internal;
  return new Response(JSON.stringify(error.body), { status: error.httpStatus });
}