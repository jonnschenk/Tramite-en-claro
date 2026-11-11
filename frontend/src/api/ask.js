// Única puerta del frontend hacia POST /ask (ver docs/api-contract.md).
// Convierte cualquier respuesta (o falla) en uno de los estados de la pantalla.

import { mockResponses, mockErrors } from '../mocks/ask-responses.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export const MAX_LENGTH = 500;
const TIMEOUT_MS = 30_000;

// 1. Validación en el frontend: misma regla que el backend, pero sin gastar una llamada.
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

// 2. Pide la respuesta y devuelve siempre un objeto { state, ... }.
//    state: 'answered' | 'no_info' | 'off_topic' | 'invalid' | 'error'
export async function askQuestion(question) {
  const invalid = validateQuestion(question);
  if (invalid) return { state: 'invalid', ...invalid };

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
    // Sin red, servidor apagado o pasaron los 30 s.
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

  // 3. Primero el código HTTP: ¿el sistema funcionó?
  if (res.ok && body?.status) {
    return { state: body.status, data: body };
  }

  const code = body?.error?.code || 'INTERNAL_ERROR';

  if (res.status === 400) {
    // El backend también rechazó la pregunta: mismo estado que la validación del frontend.
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

// --- Modo mock -------------------------------------------------------------
// Escenario con ?mock=... en la URL (answered, noInfo, offTopic, rateLimited,
// upstream, internal, network) y espera con ?delay=ms (default 1200).
// Devuelve un Response real para que mocks y API pasen por el mismo código.
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