// API de Trámite en claro. Contrato en docs/api-contract.md.

import express from 'express';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import { answerQuestion } from './rag/answer.js';
import { UpstreamError } from './errors.js';

const env = process.env;
const PORT = Number(env.PORT) || 3000;
const MAX_LENGTH = 500; // mismo límite que el frontend

const ALLOWED_ORIGINS = (env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());

const RATE_LIMIT_WINDOW_SECONDS = Number(env.RATE_LIMIT_WINDOW_SECONDS) || 60;
const RATE_LIMIT_MAX = Number(env.RATE_LIMIT_MAX) || 10;

function sendError(res, httpStatus, code, message, extra = {}) {
  return res.status(httpStatus).json({ error: { code, message, ...extra } });
}

const app = express();

// Render y Railway ponen un proxy delante. Sin esto todas las peticiones
// llegan con la IP del proxy y el límite de uso bloquea a todos a la vez.
app.set('trust proxy', 1);

app.use(cors({ origin: ALLOWED_ORIGINS, methods: ['GET', 'POST'] }));

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// Solo /ask tiene límite: es la única ruta que gasta APIs de pago.
const askLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_SECONDS * 1000,
  limit: RATE_LIMIT_MAX,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res) =>
    sendError(res, 429, 'RATE_LIMITED', 'Llegaste al límite de preguntas por ahora.', {
      retryAfterSeconds: RATE_LIMIT_WINDOW_SECONDS,
    }),
});

const readJson = express.json({ limit: '10kb' });

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

  req.question = clean;
  next();
}

app.post('/ask', askLimiter, readJson, validateQuestion, async (req, res) => {
  const answer = await answerQuestion(req.question);
  res.json(answer);
});

app.use((req, res) => {
  sendError(res, 404, 'NOT_FOUND', 'Esa ruta no existe.');
});

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return sendError(res, 400, 'EMPTY_QUESTION', 'Manda tu pregunta en el campo "question".');
  }
  if (err.type === 'entity.too.large') {
    return sendError(res, 400, 'QUESTION_TOO_LONG', `La pregunta tiene más de ${MAX_LENGTH} caracteres.`, {
      maxLength: MAX_LENGTH,
    });
  }

  if (err instanceof UpstreamError) {
    console.error(err.message);
    return sendError(res, 502, 'UPSTREAM_ERROR', 'No pudimos consultar el servicio. Intenta de nuevo.');
  }
  console.error(err);
  sendError(res, 500, 'INTERNAL_ERROR', 'Ocurrió un error inesperado.');
});

app.listen(PORT, () => {
  console.log(`API lista en http://localhost:${PORT}`);
  console.log(`CORS permitido para: ${ALLOWED_ORIGINS.join(', ')}`);
});
