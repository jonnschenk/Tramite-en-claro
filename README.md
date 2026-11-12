# Trámite en claro

Asistente que responde dudas sobre cómo sacar un acta de nacimiento en la Ciudad de México usando solo información oficial. Responde en español sencillo, con pasos numerados, cita la fuente de cada dato y manda siempre al canal oficial. Si la respuesta no está en sus fuentes, lo dice en lugar de inventar.

> **Herramienta independiente. No es un sitio oficial. Verifica siempre en el canal oficial.**

## Cómo funciona

Es un sistema RAG (generación aumentada por recuperación):

1. **Preparación (una vez):** páginas oficiales → fragmentos → embeddings (Voyage AI) → `index.json`.
2. **Cada pregunta:** frontend → `POST /ask` (Express) → embedding de la pregunta → similitud coseno contra el índice → si pasa el umbral, el modelo redacta la respuesta solo con los fragmentos → JSON con respuesta, pasos y fuentes.
3. **Evals:** preguntas de prueba que pasan por el mismo `POST /ask` y miden respuesta correcta, fuente correcta y rechazo de preguntas fuera de tema.

El contrato completo de `POST /ask` (petición, respuestas y errores) está en [docs/api-contract.md](docs/api-contract.md).

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

### Diseño UX

| Decisión | Alternativa descartada | Razón |
|---|---|---|
| Una sola pantalla de pregunta y respuesta | Chat de varios turnos | Cada pregunta es independiente, igual que en los evals; reduce el alcance del MVP |
| Respuesta estructurada: resumen → pasos → enlace oficial → fuentes | Texto libre | Es más fácil de verificar y coincide con el JSON que devuelve /ask |
| Preguntas de ejemplo en el inicio | Campo vacío | Evitan la página en blanco y llevan al usuario al tema que sí cubro |
| Aviso "no es un sitio oficial" fijo arriba | Aviso en el footer | Honestidad: el usuario lo ve antes de preguntar |
| Aviso de no escribir CURP junto al campo | Sin aviso | La herramienta no pide ni guarda datos personales |
| "Sin información" con estilo neutro | Mostrarlo como error rojo | No responder es el comportamiento correcto, no una falla |
| Botones ≥44–48 px, aria-live en la respuesta, contraste AA | Tamaños y comportamiento por defecto | Accesibilidad para pantallas táctiles, lectores de pantalla y baja visión |
| Mobile-first | Diseño de escritorio primero | La mayoría de la gente busca trámites desde el celular |
| Sistema del Portafolio adaptado, con un color propio para el proyecto (petróleo #1F5F7A) | Copiar el sistema tal cual / un estilo nuevo desde cero | Mantiene mi identidad visual, pero el acento pizarra era muy tenue para enlaces y citas en una herramienta |
| Estados con color propio: ámbar (aviso), gris azulado (sin información), arcilla (error) | Rojo para todo lo que no es una respuesta | "Sin información" es el comportamiento correcto, no un error |
| Barra de pregunta abajo en móvil y arriba en web | La misma posición en los dos | En móvil queda al alcance del pulgar; en web funciona como un buscador |
| Respuesta y fuentes en dos columnas en web | Una sola columna | Puedes leer los pasos y revisar las fuentes al mismo tiempo; en pantallas angostas las fuentes bajan solas |
| Sección "Cómo funciona" en el inicio web | Solo el campo de pregunta | Explica de dónde sale la información y da confianza antes de preguntar |
| Logo: lupa + punto, con el nombre en minúsculas | Opciones A (documento con palomita) y C (pasos) | Une "buscar en fuentes" con una respuesta final, retoma el punto de mi marca personal y se sigue leyendo bien a 16 px |
| Contador visible (0/500) + error al enviar | maxlength (cortar en 500) / botón desactivado | maxlength corta en silencio un texto pegado; un botón gris no explica qué falta y es menos accesible |
| Validar en frontend y backend | Validar solo en el frontend | El frontend da respuesta inmediata; el backend protege el API de llamadas directas (400) |
| "Fuera de tema" como 7.º estado | Unirlo a "Sin información" | Es otro status del API (off_topic) y los evals miden por separado que se niegue |

### Contrato de API

| Decisión | Alternativa descartada | Razón |
|---|---|---|
| `no_info` y `off_topic` responden 200 con un campo `status` | Responderlos como errores 404/422 | El sistema funcionó bien al no responder; los errores HTTP quedan para fallas reales |
| Citas por id (`sourceIds` → `sources[].id`) | Repetir la URL en cada paso | Cada dato apunta a su fuente sin duplicar información, y la pantalla muestra [1], [2] |
| Errores con un `code` fijo (`EMPTY_QUESTION`, `RATE_LIMITED`…) | Solo el texto del mensaje | El frontend decide qué estado mostrar sin leer textos que pueden cambiar |
| `off_topic` se decide por umbral de similitud, sin llamar al modelo | Preguntarle siempre al modelo | Más rápido, más barato y no puede inventar una respuesta |
| Tiempo máximo de 30 s en el frontend | Esperar sin límite | El usuario nunca se queda en "Cargando" para siempre |

### Frontend

| Decisión | Alternativa descartada | Razón |
|---|---|---|
| Vite con plantilla React en JavaScript | Create React App / TypeScript / Next.js | CRA ya no se mantiene; JavaScript es lo que domino; Next.js está pensado para apps con servidor propio y mi servidor ya es Express |
| Mocks en un archivo que copia el contrato | Esperar a que exista el backend | Puedo construir y probar los 7 estados desde el primer día; cuando exista `/ask`, solo cambia de dónde vienen los datos |
| Una sola función `askQuestion` que devuelve `{ state }` | Llamar a `fetch` desde cada componente | Los componentes solo leen el estado; la lógica de HTTP, errores y timeout vive en un lugar y se prueba aparte |
| Mock que devuelve un `Response` real | Devolver el objeto JSON directo | Mocks y API pasan por el mismo código; cambiar al backend real es solo una variable (`VITE_USE_MOCKS`) |
| Escenario del mock por URL (`?mock=`, `?delay=`) | Editar el código para cada prueba | Reviso los 7 estados en segundos y los puedo enseñar en la entrevista |
| Solo la URL del API en variables `VITE_` | Poner llaves en el frontend | Todo lo que lleva `VITE_` termina en el código que descarga el navegador |
| Tokens con nombre por función (`$color-accent`) | Nombre por color (`$color-petroleo`) | Puedo cambiar el color sin renombrar nada en los componentes |
| Hover y relleno suave calculados con `color.mix` a partir del acento | Escribir cada tono a mano | Cambiar el color del proyecto es una sola línea |
| Un archivo `.scss` por bloque BEM, unidos con `@use` en `main.scss` | Una sola hoja de estilos global | Cada componente tiene sus estilos en un lugar; `@use` carga los tokens sin duplicarlos |
| Inter instalada con `@fontsource-variable/inter` | Google Fonts por enlace | La fuente se sirve desde mi propio sitio, sin peticiones a terceros |
| Vidrio con `@supports` y fondo de respaldo | Solo `backdrop-filter` | El texto se lee aunque el navegador no soporte el desenfoque |
| La pregunta vive en `App` y `QuestionForm` es un componente controlado | Estado dentro del formulario | `App` valida, envía y muestra el error del backend (400) en el mismo lugar que el del frontend |
| `textarea` con Enter para enviar y Shift + Enter para salto de línea | `input` de una línea | Una pregunta de hasta 500 caracteres se lee completa; Enter se siente como un buscador |
| El contador no se anuncia; solo el error usa `role="alert"` y el foco regresa al campo | Anunciar el contador en cada tecla | Anunciar cada tecla sería ruido para el lector de pantalla |
| Botón desactivado solo mientras carga | Desactivarlo también si la pregunta no es válida | Un botón gris no explica qué falta; al tocarlo, el mensaje sí lo explica |
| Una píldora llena el campo y envía la pregunta | Solo llenar el campo | Un toque menos; la persona prueba la herramienta de inmediato |
| Preguntas sugeridas que el corpus sí responde | Preguntas genéricas | La primera prueba de alguien no termina en "No tengo esa información" |
| Resultados en una región `aria-live="polite"`; esqueleto con `aria-hidden` | Sin anuncio / anunciar el esqueleto | El lector de pantalla dice "Buscando…" y luego la respuesta, sin mover el foco |
| "Sigue buscando…" a los 10 s, con `useEffect` y limpieza del temporizador | Solo un spinner | La persona sabe que no se trabó; si la respuesta llega antes, el temporizador se cancela |
| Siempre hay un `h1` (oculto con `visually-hidden` después de preguntar) | Quitar el título al responder | Quien navega por encabezados siempre encuentra el título principal |
| Fecha de consulta armada con año, mes y día locales | `new Date("2026-11-10")` | Ese formato se lee en UTC y en CDMX (UTC−6) mostraría el día anterior |
| Citas como enlaces a `#fuente-n` con `aria-label="Fuente n"` | Texto "[1]" sin enlace | Se puede saltar del dato a su fuente; el lector dice "Fuente 1" y no "corchete uno" |
| Respuesta y fuentes con `flex-wrap` (560 px / 320 px) | Media query para las dos columnas | Las fuentes bajan solas cuando no caben, en cualquier ancho |
| Enlaces externos en otra pestaña con `rel="noopener noreferrer"` y aviso oculto | Abrir en la misma pestaña | La persona no pierde su respuesta; la otra página no puede controlar la mía |
| Un bloque `.status` con modificadores (`--no-info`, `--off-topic`, `--error`) | Estilos sueltos por estado | Misma estructura, solo cambian colores; cada estado tiene además título e icono propios, no solo color |
| "Reintentar" usa la última pregunta enviada (`useRef`) | Reenviar lo que haya en el campo | Reintenta exactamente lo que falló, aunque la persona ya esté escribiendo otra cosa |
| Barra de pregunta `fixed` abajo en móvil y `sticky` arriba en web después de preguntar | `sticky` en los dos | En el HTML la barra va antes de los resultados (orden lógico para teclado y lector); solo `fixed` la deja siempre abajo en móvil |
| `viewport-fit=cover` + `env(safe-area-inset-bottom)` | Ignorar el área segura | En iPhone la barra no queda debajo de la barra de inicio del sistema |
| "Cómo funciona" solo en el inicio de web | Mostrarlo también en móvil | En móvil la pantalla es para preguntar; en web hay espacio para explicar de dónde sale la información |

### Errores y aprendizajes (frontend)

| Qué falló | Por qué | Cómo lo arreglé |
|---|---|---|
| `npm create vite` se canceló solo | Pegué varios comandos juntos y las líneas siguientes le llegaron como respuestas al asistente interactivo | Borré la carpeta a medias y corrí los comandos uno por uno |
| `npm install` en la raíz creó un `package.json` que no debía existir | npm usa el `package.json` de la carpeta donde está la terminal; el repo tiene dos proyectos (`frontend` y `backend`) | Borré los archivos creados por error; ahora reviso la carpeta con `pwd` antes de cada comando de npm |
| `git add fronted` → "did not match any files" | Error de dedo, y después un `cd ..` de más me sacó del repo | Uso Tab para completar nombres y `pwd` para saber dónde estoy |
| Vite marcaba `Empty parenthesized expression` en `Header.jsx` | El código que copié había perdido sus etiquetas JSX y el `return ( )` quedó vacío | Reemplacé el archivo completo y aprendí a leer el error: archivo, línea y columna |
| El texto de ejemplo del campo se cortaba en móvil | Era demasiado largo para 390 px | Lo acorté a "Escribe tu duda sobre el acta…"; las píldoras ya dan los ejemplos |




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
