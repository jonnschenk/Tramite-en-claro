// Servidor del API de Trámite en claro (ver docs/api-contract.md).
//
// Orden de cada petición a POST /ask:
//   CORS → límite de uso (429) → leer JSON → validar pregunta (400) → responder
//
// Uso:
//   npm run dev     → en tu computadora, con .env y reinicio automático al guardar
//   npm start       → en producción (Render/Railway ponen las variables de entorno)

import express from 'express';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';

// ---------- Configuración ----------

const env = process.env;
const PORT = Number(env.PORT) || 3000;
const MAX_LENGTH = 500;

// Dominios que pueden llamar al API desde el navegador, separados por coma.
// En tu computadora: el frontend de Vite. En producción: el dominio de Firebase.
const ALLOWED_ORIGINS = (env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());

// Preguntas permitidas por persona (por IP) en cada ventana de tiempo.
const RATE_LIMIT_WINDOW_SECONDS = Number(env.RATE_LIMIT_WINDOW_SECONDS) || 60;
const RATE_LIMIT_MAX = Number(env.RATE_LIMIT_MAX) || 10;

// Atajo para responder errores siempre con la forma del contrato.
function sendError(res, httpStatus, code, message, extra = {}) {
  return res.status(httpStatus).json({ error: { code, message, ...extra } });
}

// ---------- App ----------

const app = express();

// Render y Railway ponen un proxy delante del servidor. Sin esto, todas las
// peticiones parecerían venir de la misma IP (la del proxy) y el límite de uso
// bloquearía a todos a la vez.
app.set('trust proxy', 1);

// 1. CORS: el navegador solo deja que el frontend lea la respuesta
//    si el dominio está en la lista.
app.use(cors({ origin: ALLOWED_ORIGINS, methods: ['GET', 'POST'] }));

// 2. Salud: sirve para revisar que el servidor desplegado está vivo.
//    Va antes del límite de uso para que revisarlo no gaste preguntas.
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// 3. Límite de uso: solo para /ask, que es la ruta que gasta APIs de pago.
const askLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_SECONDS * 1000,
  limit: RATE_LIMIT_MAX,
  standardHeaders: 'draft-8', // manda el encabezado RateLimit con el tiempo restante
  legacyHeaders: false,
  handler: (req, res) =>
    sendError(res, 429, 'RATE_LIMITED', 'Llegaste al límite de preguntas por ahora.', {
      retryAfterSeconds: RATE_LIMIT_WINDOW_SECONDS,
    }),
});

// 4. Leer el cuerpo JSON. El límite de 10 kb evita que alguien mande
//    un texto gigante; una pregunta de 500 caracteres pesa mucho menos.
const readJson = express.json({ limit: '10kb' });

// 5. Validar la pregunta: la misma regla que el frontend.
function validateQuestion(req, res, next) {
  const { question } = req.body ?? {};

  if (typeof question !== 'string' || question.trim().length === 0) {
    return sendError(res, 400, 'EMPTY_QUESTION', 'Escribe tu pregunta antes de enviar.');
  }

  const clean = question.trim();
  if (clean.length > MAX_LENGTH) {
    return sendError(
      res,
      400,
      'QUESTION_TOO_LONG',
      `La pregunta tiene más de ${MAX_LENGTH} caracteres.`,
      { maxLength: MAX_LENGTH },
    );
  }

  req.question = clean; // la siguiente función ya recibe la pregunta limpia
  next();
}

// 6. POST /ask
app.post('/ask', askLimiter, readJson, validateQuestion, async (req, res) => {
  // TEMPORAL: aquí va el RAG (embedding → similitud → modelo) en el siguiente paso.
  // Por ahora responde "no_info" para probar la conexión con el frontend.
  res.json({
    status: 'no_info',
    message: `(Temporal) Recibí tu pregunta: "${req.question}". El RAG todavía no está conectado.`,
    officialUrl: 'https://www.cdmx.gob.mx/',
  });
});

// 7. Ruta que no existe → 404 con la forma del contrato.
app.use((req, res) => {
  sendError(res, 404, 'NOT_FOUND', 'Esa ruta no existe.');
});

// 8. Manejador de errores: atrapa todo lo que falle arriba.
//    Express lo reconoce porque recibe 4 parámetros (err, req, res, next).
app.use((err, req, res, next) => {
  // JSON mal escrito o vacío: es culpa de la petición, no del servidor.
  if (err.type === 'entity.parse.failed') {
    return sendError(res, 400, 'EMPTY_QUESTION', 'Manda tu pregunta en el campo "question".');
  }
  if (err.type === 'entity.too.large') {
    return sendError(res, 400, 'QUESTION_TOO_LONG', `La pregunta tiene más de ${MAX_LENGTH} caracteres.`, {
      maxLength: MAX_LENGTH,
    });
  }

  console.error(err); // el detalle se queda en el servidor, nunca se manda al usuario
  sendError(res, 500, 'INTERNAL_ERROR', 'Ocurrió un error inesperado.');
});

app.listen(PORT, () => {
  console.log(`API lista en http://localhost:${PORT}`);
  console.log(`CORS permitido para: ${ALLOWED_ORIGINS.join(', ')}`);
});