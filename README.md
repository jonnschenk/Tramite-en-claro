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

## REGISTRO DE DECISIONES

### Producto y arquitectura
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

### Diseño UX

| Decisión | Alternativa descartada | Razón |
| --- | --- | --- |
| Una sola pantalla de pregunta y respuesta | Chat de varios turnos | Cada pregunta es independiente, igual que en los evals; reduce el alcance del MVP |
| Respuesta estructurada: resumen → pasos → enlace oficial → fuentes | Texto libre | Es más fácil de verificar y coincide con el JSON que devuelve `/ask` |
| Preguntas de ejemplo en el inicio | Campo vacío | Evitan la página en blanco y llevan al usuario al tema que sí cubro |
| Aviso "no es un sitio oficial" fijo arriba | Aviso en el footer | Honestidad: el usuario lo ve antes de preguntar |
| Aviso de no escribir CURP junto al campo | Sin aviso | La herramienta no pide ni guarda datos personales |
| "Sin información" con estilo neutro | Mostrarlo como error rojo | No responder es el comportamiento correcto, no una falla |
| Botones de 44–48 px, `aria-live` en la respuesta, contraste AA | Tamaños y comportamiento por defecto | Accesibilidad para pantallas táctiles, lectores de pantalla y baja visión |
| Mobile-first | Diseño de escritorio primero | La mayoría de la gente busca trámites desde el celular |
| Sistema del Portafolio adaptado, con un color propio (petróleo `#1F5F7A`) | Copiar el sistema tal cual / un estilo nuevo desde cero | Mantiene mi identidad visual, pero el acento pizarra era muy tenue para enlaces y citas en una herramienta |
| Estados con color propio: ámbar (aviso), gris azulado (sin información), arcilla (error) | Rojo para todo lo que no es una respuesta | "Sin información" es el comportamiento correcto, no un error |
| Barra de pregunta abajo en móvil y arriba en web | La misma posición en los dos | En móvil queda al alcance del pulgar; en web funciona como un buscador |
| Respuesta y fuentes en dos columnas en web | Una sola columna | Se leen los pasos y se revisan las fuentes al mismo tiempo; en pantallas angostas las fuentes bajan solas |
| Sección "Cómo funciona" en el inicio web | Solo el campo de pregunta | Explica de dónde sale la información y da confianza antes de preguntar |
| Logo: lupa + punto, con el nombre en minúsculas | Documento con palomita / líneas de pasos | Une "buscar en fuentes" con una respuesta final, retoma el punto de mi marca personal y se lee bien a 16 px |
| Contador visible (0/500) + error al enviar | `maxlength` / botón desactivado | `maxlength` corta en silencio un texto pegado; un botón gris no explica qué falta y es menos accesible |
| Validar en frontend y backend | Validar solo en el frontend | El frontend da respuesta inmediata; el backend protege el API de llamadas directas (400) |
| "Fuera de tema" como 7.º estado | Unirlo a "Sin información" | Es otro status del API (`off_topic`) y los evals miden por separado que se niegue |


## Fuentes oficiales del corpus

Cada fuente vive en `backend/data/sources/` con su URL y fecha de consulta.

| # | Fuente | Consultada |
| --- | --- | --- |
| 01 | Plataforma Nacional del Registro Civil: acta de nacimiento en línea | 2026-11-10 |
| 02 | Portal CDMX: expedición de copias certificadas de actas | 2026-11-10 |
| 03 | Portal CDMX: búsqueda de antecedentes registrales | 2026-11-10 |
| 04 | Registro Civil CDMX: guía de trámites y horarios | 2026-11-10 |
| 05 | Portal CDMX: oficinas del Registro Civil (48, por alcaldía) | 2026-11-10 |
| 06 | Portal CDMX: corrección de extractos (errores de captura) | 2026-11-10 |
| 07 | Portal CDMX: aclaración de actas por enmienda | 2026-11-10 |
| 08 | Llave CDMX: preguntas frecuentes | 2026-11-10 |
| 09 | Llave MX: preguntas frecuentes | 2026-11-10 |
| 10 | Portal CDMX: procedimiento administrativo de corrección | 2026-11-10 |

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
