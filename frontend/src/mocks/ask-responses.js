// Respuestas falsas (mocks) que siguen docs/api-contract.md.
// Sirven para construir y probar la pantalla antes de que exista el backend.
// Los textos son ilustrativos: los reales saldrán del corpus.

// Respuestas 200: el sistema funcionó y "status" dice qué estado mostrar.
export const mockResponses = {
  answered: {
    status: 'answered',
    summary: {
      text: 'Puedes sacarla en línea con Llave CDMX. El costo es de $98.00.',
      sourceIds: [1],
    },
    steps: [
      { text: 'Inicia sesión en Llave CDMX Expediente.', sourceIds: [1] },
      { text: 'Elige "Tramita una copia de tu acta" y después "Acta de Nacimiento".', sourceIds: [1] },
      { text: 'Paga los derechos y descarga tu acta digital.', sourceIds: [1] },
    ],
    sources: [
      {
        id: 1,
        title: 'Expedición de copias certificadas de actas — Portal CDMX',
        url: 'https://www.cdmx.gob.mx/public/InformacionTramite.xhtml?idTramite=598',
        domain: 'cdmx.gob.mx',
        consultedAt: '2026-11-10',
      },
    ],
    officialUrl: 'https://www.cdmx.gob.mx/public/InformacionTramite.xhtml?idTramite=598',
  },

  noInfo: {
    status: 'no_info',
    message: 'No tengo esa información en las fuentes oficiales que reviso.',
    officialUrl: 'https://www.cdmx.gob.mx/',
  },

  offTopic: {
    status: 'off_topic',
    message: 'Por ahora solo respondo sobre el acta de nacimiento en la Ciudad de México.',
    suggestions: ['¿Cómo saco mi acta en línea?', '¿Cuánto cuesta una copia certificada?'],
  },
};

// Errores: código HTTP + cuerpo { error: { code, message } }.
export const mockErrors = {
  emptyQuestion: {
    httpStatus: 400,
    body: { error: { code: 'EMPTY_QUESTION', message: 'Escribe tu pregunta antes de enviar.' } },
  },
  questionTooLong: {
    httpStatus: 400,
    body: {
      error: { code: 'QUESTION_TOO_LONG', message: 'La pregunta tiene más de 500 caracteres.', maxLength: 500 },
    },
  },
  rateLimited: {
    httpStatus: 429,
    body: {
      error: { code: 'RATE_LIMITED', message: 'Llegaste al límite de preguntas por ahora.', retryAfterSeconds: 60 },
    },
  },
  upstream: {
    httpStatus: 502,
    body: { error: { code: 'UPSTREAM_ERROR', message: 'El servicio no respondió.' } },
  },
  internal: {
    httpStatus: 500,
    body: { error: { code: 'INTERNAL_ERROR', message: 'Ocurrió un error inesperado.' } },
  },
};