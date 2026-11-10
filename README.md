# Trámite en claro

Asistente que responde dudas sobre cómo sacar un acta de nacimiento en la Ciudad de México usando solo información oficial. Responde en español sencillo, con pasos numerados, cita la fuente de cada dato y manda siempre al canal oficial. Si la respuesta no está en sus fuentes, lo dice en lugar de inventar.

> **Herramienta independiente. No es un sitio oficial. Verifica siempre en el canal oficial.**

## Cómo funciona

Es un sistema RAG (generación aumentada por recuperación):

1. **Preparación (una vez):** páginas oficiales → fragmentos → embeddings (Voyage AI) → `index.json`.
2. **Cada pregunta:** frontend → `POST /ask` (Express) → embedding de la pregunta → similitud coseno contra el índice → si pasa el umbral, el modelo redacta la respuesta solo con los fragmentos → JSON con respuesta, pasos y fuentes.
3. **Evals:** preguntas de prueba que pasan por el mismo `POST /ask` y miden respuesta correcta, fuente correcta y rechazo de preguntas fuera de tema.

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | React + Vite, Sass (BEM) |
| API | Node.js + Express |
| Embeddings | Voyage AI (`voyage-4`) |
| Modelo | DeepSeek `deepseek-v4.1-flash` vía OpenRouter (Claude `claude-haiku-5-5` como alternativa) |
| Índice | Archivo JSON + similitud coseno |
| Deploy | Render o Railway (API), Firebase Hosting (frontend) |

## Registro de decisiones

| Decisión | Alternativa descartada | Razón |
| --- | --- | --- |
| Un solo trámite | Varios trámites | Alcance que se puede terminar y medir antes de la entrevista |
| RAG con índice JSON | Base de datos vectorial | Unos cientos de fragmentos caben en memoria; menos piezas que explicar |
| Voyage `voyage-4` para embeddings | OpenAI embeddings | Recomendado por la documentación de Anthropic; la capa gratuita cubre todo el corpus |
| DeepSeek flash vía OpenRouter para redactar | Claude Haiku | Ya tengo una llave con crédito de $50 del AI Hackathon por México × Clara; la tarea es redactar con texto dado. Claude queda como alternativa y se cambia con `LLM_PROVIDER` |
| Llamada al modelo detrás de una sola función | Llamar al proveedor en varios lugares | Permite cambiar de modelo y comparar ambos con las mismas evals |
| Umbral de similitud antes de llamar al modelo | Llamar siempre al modelo | Evita respuestas inventadas y ahorra costo |
| Salida en JSON | Texto libre | El frontend muestra pasos y fuentes sin adivinar el formato |
| Contrato de API antes del backend | Hacer todo junto | Permite diseñar y construir el frontend con datos mock |
| API propia en Express | Llamar a las APIs desde el navegador | Las llaves no pueden vivir en el frontend; la lógica del RAG y el límite de uso viven en el servidor |
| Sin datos personales | Guardar historial | Menos riesgo legal y de privacidad |

## Fuentes oficiales del corpus

Cada fuente vive en `backend/data/sources/` con su URL y fecha de consulta.

| # | Fuente | Consultada |
| --- | --- | --- |
| 01 | Plataforma Nacional del Registro Civil: acta de nacimiento en línea | 2026-11-10 |
| 02 | Portal CDMX: expedición de copias certificadas de actas | 2026-11-10 |
| 03 | Portal CDMX: búsqueda de antecedentes registrales | 2026-11-10 |

## Correr el proyecto

```bash
cd backend
cp .env.example .env   # pon tus llaves aquí; nunca subas .env
npm install
npm run smoke          # prueba Voyage y el modelo elegido en LLM_PROVIDER
```

## Resultados de evals

Pendiente (fase 4, 16 y 17 de noviembre de 2026).

## Créditos

Pendiente de completar al cierre. Debe decir con honestidad qué escribí yo, qué generé con ayuda de Claude y Claude Code, y qué librerías usé.
