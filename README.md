# Trámite en claro

Asistente que responde dudas sobre cómo sacar un acta de nacimiento en la Ciudad de México, usando solo información oficial. Contesta en español sencillo, con pasos, cita de dónde sale cada dato y siempre manda al canal oficial. Si no encuentra la respuesta en sus fuentes, lo dice en vez de inventar.

> **Herramienta independiente. No es un sitio oficial. Verifica siempre en el canal oficial.**

## Cómo funciona

Es un RAG (generación aumentada por recuperación):

1. **Preparación:** las páginas oficiales se cortan en fragmentos, cada fragmento se convierte en un embedding con Voyage AI y todo se guarda en `index.json`.
2. **Cada pregunta:** el backend convierte la pregunta en embedding y busca los fragmentos más parecidos. Si ninguno se parece lo suficiente, responde "fuera de tema" sin llamar al modelo. Si sí, el modelo redacta la respuesta usando solo esos fragmentos y citándolos.
3. **Evals:** un set de preguntas de prueba que mide si la respuesta y la fuente son correctas y si rechaza lo que está fuera de tema.

El contrato de `POST /ask` está en [docs/api-contract.md](docs/api-contract.md).

## Stack

- **Frontend:** React + Vite, Sass (BEM)
- **API:** Node.js + Express
- **Embeddings:** Voyage AI (`voyage-4`)
- **Modelo:** DeepSeek `deepseek-v4.1-flash` vía OpenRouter, con Claude `claude-haiku-5-5` como alternativa
- **Índice:** archivo JSON + similitud coseno
- **Deploy:** Render o Railway (API) y Firebase Hosting (frontend)

## Decisiones

### Diseño

- **Una sola pantalla de pregunta y respuesta, no un chat.** Cada pregunta es independiente (igual que en los evals) y así el MVP es más chico.
- **Respuesta con estructura fija:** resumen, pasos, enlace oficial y fuentes. Es más fácil de verificar que un texto libre y es justo lo que regresa el API.
- **Mobile-first.** La mayoría busca trámites desde el celular. En móvil la barra de pregunta va abajo, al alcance del pulgar; en web va arriba, como un buscador.
- **Avisos visibles desde el inicio:** "no es un sitio oficial" fijo arriba y "no escribas tu CURP" junto al campo.
- **Preguntas sugeridas que el corpus sí responde.** Evitan la página en blanco y que la primera prueba termine en "no tengo esa información".
- **"Sin información" no se ve como error.** No responder es lo correcto, así que cada estado tiene su color: ámbar para el aviso, gris azulado para "sin información" y arcilla para errores reales.
- **Color propio (petróleo `#1F5F7A`) sobre el sistema de mi portafolio.** El acento pizarra original era muy tenue para enlaces y citas.
- **Logo de lupa con punto.** Junta "buscar en fuentes" con una respuesta final y retoma el punto de mi marca personal. Se sigue leyendo a 16 px.
- **En web, respuesta y fuentes van lado a lado,** y hay una sección "Cómo funciona" en el inicio. En móvil no, porque la pantalla es para preguntar.
- **Accesibilidad:** botones de 44 px o más, contraste AA y la respuesta en una región `aria-live`.

### Contrato de API

- **`no_info` y `off_topic` responden 200,** con un campo `status`. El sistema funcionó bien al no responder; los códigos de error quedan para fallas reales.
- **Errores con un `code` fijo** (`EMPTY_QUESTION`, `RATE_LIMITED`…). El frontend decide qué mostrar sin depender de textos que pueden cambiar.
- **Citas por id:** cada paso trae `sourceIds` que apuntan a `sources[]`. No se repiten URLs y en pantalla se ven como [1], [2].
- **Se valida en los dos lados.** El frontend da respuesta inmediata y el backend protege el API de llamadas directas.

### Frontend

- **Vite + React en JavaScript.** CRA ya no se mantiene, JavaScript es lo que domino y Next.js no hacía falta porque mi servidor ya es Express.
- **Mocks que copian el contrato.** Construí y probé los 7 estados de la pantalla antes de tener backend. El mock regresa un `Response` real, así que cambiar al API de verdad es solo poner `VITE_USE_MOCKS=false`. Con `?mock=` y `?delay=` en la URL reviso cada estado en segundos.
- **Una sola función (`askQuestion`) habla con el API** y siempre regresa `{ state }`. Los componentes solo leen el estado; HTTP, errores y el timeout de 30 s viven en un solo lugar.
- **Contador visible (0/500) y error al enviar,** en lugar de `maxlength` o un botón desactivado. `maxlength` corta en silencio un texto pegado y un botón gris no explica qué falta.
- **Tokens por función** (`$color-accent`, no `$color-petroleo`) y tonos calculados con `color.mix`. Cambiar el color del proyecto es una línea.
- **Detalles de lector de pantalla:** las citas son enlaces que se leen "Fuente 1", siempre hay un `h1` aunque esté oculto y el foco regresa al campo cuando hay error.
- **Detalles de uso:** "Sigue buscando…" aparece a los 10 s; "Reintentar" reenvía la última pregunta aunque ya estés escribiendo otra; en iPhone la barra respeta el área segura de abajo.
- **La fecha de consulta se arma con año, mes y día locales.** `new Date("2026-11-10")` se lee en UTC y en CDMX mostraba el día anterior.

### Backend

- **Índice en un archivo JSON, sin base de datos vectorial.** Son 10 fuentes y unos 50 fragmentos: compararlos todos en memoria es instantáneo y no necesito otro servicio.
- **Un fragmento por sección `##`,** y cada uno empieza con el título del documento. Así una sección corta como "Costo: gratuito" sigue sabiendo de qué trámite habla.
- **"Fuera de tema" se decide con un umbral de similitud, sin llamar al modelo.** Es más rápido, más barato y no puede inventar nada. Lo calibré con preguntas de prueba: las del tema dan 0.56 o más y las de fuera 0.48 o menos, así que dejé 0.50.
- **El modelo responde en JSON y cita fragmentos por número.** El backend traduce esas citas a fuentes y descarta los pasos que no tienen una cita válida.
- **Proveedor del modelo intercambiable** con `LLM_PROVIDER` (OpenRouter o Anthropic), sin tocar código.
- **Límite de 10 preguntas por minuto por IP, solo en `/ask`,** porque es la única ruta que gasta APIs de pago.

## Errores y aprendizajes

- **`npm create vite` se canceló solo:** pegué varios comandos juntos y los siguientes le llegaron como respuestas al asistente. Ahora los corro uno por uno.
- **`npm install` en la raíz creó un `package.json` que no debía existir:** el repo tiene dos proyectos y npm usa la carpeta donde está la terminal. Ahora reviso con `pwd` antes.
- **`git add fronted` no encontraba nada:** error de dedo, más un `cd ..` de más. Ahora uso Tab para completar.
- **Vite marcaba `Empty parenthesized expression`:** el código que copié había perdido sus etiquetas JSX. Aprendí a leer el error por archivo, línea y columna.
- **El placeholder se cortaba en móvil:** era muy largo para 390 px y lo acorté.
- **El error 502 nunca llegaba al frontend:** el manejador de errores mandaba el 500 antes de revisar si era un `UpstreamError`. Lo encontré en una revisión de código con Claude Code.

## Fuentes oficiales del corpus

Cada fuente está en `backend/data/sources/` con su URL y fecha de consulta (todas consultadas el 2026-11-10).

1. Plataforma Nacional del Registro Civil: acta de nacimiento en línea
2. Portal CDMX: expedición de copias certificadas de actas
3. Portal CDMX: búsqueda de antecedentes registrales
4. Registro Civil CDMX: guía de trámites y horarios
5. Portal CDMX: oficinas del Registro Civil (48, por alcaldía)
6. Portal CDMX: corrección de extractos (errores de captura)
7. Portal CDMX: aclaración de actas por enmienda
8. Llave CDMX: preguntas frecuentes
9. Llave MX: preguntas frecuentes
10. Portal CDMX: procedimiento administrativo de corrección

## Correr el proyecto

Backend:

```bash
cd backend
cp .env.example .env   # pon tus llaves aquí; nunca subas .env
npm install
npm run smoke          # revisa que las llaves funcionen
npm run dev            # API en http://localhost:3000
```

Frontend, en otra terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev            # abre http://localhost:5173
```

## Resultados de evals

Pendiente (fase 4, 16 y 17 de noviembre de 2026).

## Cómo uso IA en este proyecto

Uso Claude Code como par de programación. Yo decido qué se construye y por qué; la IA me ayuda con el cómo, y nada entra al repo sin que yo lo revise y lo pruebe.

**Mi flujo:**

1. **Primero el contrato y las decisiones.** Antes de pedir código escribo qué debe hacer cada parte ([docs/api-contract.md](docs/api-contract.md) y las decisiones de arriba). Así la IA trabaja sobre algo definido y yo tengo con qué comparar lo que me da.
2. **Partes pequeñas, una por commit.** Pido una pieza a la vez (el cliente de `/ask`, el formulario, el servidor, la búsqueda) para poder revisarla completa antes de seguir.
3. **Probar, no confiar.** Cada parte pasa por algo que la compruebe: los mocks para los 7 estados de la pantalla, `npm run smoke` para las llaves, `/health` y `/ask` con preguntas reales y, al final, los evals.
4. **Pedirle que revise, no solo que escriba.** Uso la IA para buscar bugs en mi código. Así encontré que el 502 nunca llegaba al frontend.
5. **Limpiar lo que genera.** El código generado tiende a llenarse de comentarios que narran lo obvio. Hice una pasada para dejar solo los que explican una decisión.

**Lo que no le delego:** qué problema resolver y para quién, el alcance del MVP, el diseño y la marca, los datos que entran al corpus (todas las fuentes las elegí y revisé yo) y la calibración del umbral.

## Créditos

Pendiente de completar al cierre. Debe decir con honestidad qué escribí yo, qué generé con ayuda de Claude y Claude Code, y qué librerías usé.
