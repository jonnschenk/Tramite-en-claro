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

**Preparar el índice (`ingest.js`)**

- **Un fragmento por sección `##`, no cortes fijos de N palabras.** Las fuentes ya vienen divididas por tema.
- **Secciones de menos de 30 palabras se unen y las de más de 250 se parten.** Una sección mínima casi no tiene significado y una muy larga mezcla temas. Las tablas se parten por filas y cada pedazo repite el encabezado, para que se entienda solo.
- **Cada fragmento empieza con "Título — Sección".** Así una sección corta como "Costo: gratuito" sigue sabiendo de qué trámite habla.
- **Las `notas` del frontmatter no entran al embedding.** Son mías como curador, no información oficial.
- **Parser propio de frontmatter en lugar de `gray-matter`.** Es una dependencia menos.
- **`--dry-run` para ver los fragmentos sin llamar a Voyage.** Puedo ajustar el corte gratis.
- **`index.json` va en el repo y sin sangría.** El servidor despliega sin gastar Voyage y los diffs quedan pequeños.

**Buscar**

- **Índice en memoria con similitud coseno, sin base de datos vectorial.** Son 53 fragmentos y compararlos todos tarda menos de 1 ms.
- **Voyage con `input_type` distinto:** `document` para los fragmentos y `query` para las preguntas.
- **El servidor no arranca si falta el índice o si se hizo con otro modelo.** Vectores de modelos distintos no se pueden comparar.
- **"Fuera de tema" se decide con un umbral, sin llamar al modelo.** Es más rápido, más barato y no puede inventar nada. Lo calibré con `npm run similarity`: las preguntas del tema dieron 0.564–0.638 y las de fuera 0.260–0.481. Dejé 0.50, en la parte baja del hueco, porque si algo se cuela todavía queda la red del `no_info` del modelo.
- **Al modelo solo le llegan los 5 fragmentos más parecidos que pasan el umbral.**

**Responder**

- **El modelo cita números de fragmento, no URLs.** Así no puede inventar enlaces. Las citas inválidas se ignoran, los pasos sin cita no se muestran y si el resumen no tiene cita la respuesta pasa a `no_info`.
- **El modelo decide `no_info` con `found: false`.** En ese caso `officialUrl` apunta a la fuente más parecida a la pregunta.
- **Si el modelo no responde JSON válido, es un 502.** La falla es del servicio, no de la pregunta.
- **Pasos solo cuando la pregunta pide cómo hacer algo.** Si pregunta un dato (costo, horario, vigencia), la respuesta va sin pasos. Cada paso empieza con un verbo y es una acción real, no relleno.
- **Sin comillas dobles dentro de los textos** (se usan « »). Era la causa más probable del 502 de q07, que desapareció con esta regla.
- **`cleanText` como red de seguridad:** si el modelo escribe `[3]` dentro del texto, se quita. Es un número de fragmento, no de fuente, y en pantalla se confundiría con las citas reales.
- **`temperature: 0`** para que los evals sean reproducibles.
- **Proveedor intercambiable con `LLM_PROVIDER`** (OpenRouter o Anthropic), sin tocar código.
- **Tiempos: 10 s para Voyage + 18 s para el modelo,** para que todo quepa en los 30 s que espera el frontend.

**Servidor**

- **Express 5 + `cors` + `express-rate-limit`.** Express 5 manda solo los errores async al manejador, sin `try/catch`.
- **Límite de 10 preguntas por minuto por IP, solo en `/ask`.** Es la única ruta que gasta APIs de pago. `/health` va antes del límite y `trust proxy` hace que cada persona tenga su propia IP detrás del proxy de Render.
- **JSON mal formado responde 400 `EMPTY_QUESTION`.** Así no tuve que agregar un código nuevo al contrato.

**Evals**

- **Los evals llaman al mismo `POST /ask` por HTTP** que usa la pantalla, así prueban el sistema completo.
- **El dato clave se revisa con texto (sin acentos y con alternativas), no con otro LLM como juez.** Es más simple y siempre da el mismo resultado.
- **Las métricas de calidad van aparte de "Pasan todo".** Una respuesta con un paso de más sigue siendo correcta; separarlas deja ver los dos tipos de problema sin mezclarlos.

## Errores y aprendizajes

- **`npm create vite` se canceló solo:** pegué varios comandos juntos y los siguientes le llegaron como respuestas al asistente. Ahora los corro uno por uno.
- **`npm install` en la raíz creó un `package.json` que no debía existir:** el repo tiene dos proyectos y npm usa la carpeta donde está la terminal. Ahora reviso con `pwd` antes.
- **`git add fronted` no encontraba nada:** error de dedo, más un `cd ..` de más. Ahora uso Tab para completar.
- **Vite marcaba `Empty parenthesized expression`:** el código que copié había perdido sus etiquetas JSX. Aprendí a leer el error por archivo, línea y columna.
- **El placeholder se cortaba en móvil:** era muy largo para 390 px y lo acorté.
- **El error 502 nunca llegaba al frontend:** el manejador de errores mandaba el 500 antes de revisar si era un `UpstreamError`. Lo encontré en una revisión de código con Claude Code.
- **El servidor se cerraba sin ningún mensaje:** `server.js` estaba vacío porque el código no se había guardado.
- **El frontend decía "No pudimos conectar":** había cerrado la terminal del backend. El mensaje de error funcionó como debía.
- **Voyage respondía 429:** sin método de pago solo permite 3 peticiones por minuto. Pasó en la calibración y luego en 12 de 20 evals. Los evals detectaron un problema de infraestructura, no de código.
- **La consola se llenaba con la pila completa en cada 502:** para errores de Voyage o del modelo ahora solo imprimo el mensaje.
- **Push rechazado y conflicto en `server.js`:** se subió una limpieza desde otra copia del repo mientras yo seguía trabajando en la mía. Lo resolví con `git pull --no-rebase` y quedándome con la versión correcta del archivo.
- **`fg: no current job`:** copié el prompt `backend %` junto con el comando.
- **GitHub rechazó un push (GH007)** porque exponía mi correo privado. Ahora uso el correo noreply de GitHub.

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

Otros comandos del backend:

```bash
npm run ingest:dry                  # ver los fragmentos sin llamar a Voyage
npm run ingest                      # regenerar data/index.json
npm run similarity -- "pregunta"    # ver el puntaje de una pregunta contra el índice
npm run evals                       # correr los evals (con el servidor encendido)
```

Frontend, en otra terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev            # abre http://localhost:5173
```

## Resultados de evals

20 preguntas en `backend/evals/questions.json`: 12 con respuesta, 3 sin información y 5 fuera de tema (una es un intento de prompt injection).

| Métrica | Corrida 1 | Corrida 2 |
|---|---|---|
| Pasan todo | 95% (19/20) | **100% (20/20)** |
| Status correcto | 95% (19/20) | **100% (20/20)** |
| Cita una fuente correcta | 92% (11/12) | **100% (12/12)** |
| Trae el dato clave | 92% (11/12) | **100% (12/12)** |
| Se niega cuando debe | 100% (8/8) | 100% (8/8) |
| Calidad: sin pasos de más | 71% (5/7) | **100% (7/7)** |
| Calidad: sin marcas [n] en el texto | 82% (9/11) | 100% (12/12) |
| Errores | 1 (q07) | **0** |
| Tiempo promedio | 2.4 s | 2.0 s |

**Corrida 1 (línea base).** La única falla fue q07 (Velásquez/Velázquez): un 502 a los 7.3 s, probablemente por comillas sin escapar dentro del JSON del modelo. Al revisar las respuestas también vi dos problemas que los evals no medían: pasos de relleno en preguntas que solo piden un dato, y marcas como `[3]` dentro del texto. Las métricas de calidad de esta corrida las calculé después, con las respuestas guardadas.

**Qué cambié para la corrida 2:**

- **Reglas nuevas en el prompt:** usar pasos solo cuando la pregunta pide cómo hacer algo; cada paso empieza con un verbo y es una acción real; no usar comillas dobles dentro de los textos; no escribir números de fragmento en el texto.
- **`cleanText` en el backend** como red de seguridad: si el modelo escribe `[3]` de todos modos, se quita antes de responder.
- **Dos métricas de calidad nuevas en los evals.** Las 7 preguntas de un solo dato (costo, horario, vigencia…) llevan `"steps": false` en `questions.json`. Estas métricas no cuentan para "Pasan todo".

**Cómo leer estos resultados:**

- **Ajusté el prompt viendo las respuestas de estas mismas 20 preguntas.** El 100% no garantiza lo mismo con preguntas nuevas. Para comprobarlo necesito un segundo set de preguntas que no haya usado para ajustar.
- **"Sin marcas [n]" en la corrida 2 mide la red de seguridad, no al modelo.** `cleanText` quita las marcas antes de que lleguen al eval, así que ese 100% no dice si el prompt por sí solo lo resolvió.

La corrida 1 usó `EVAL_DELAY_MS=21000` por el límite de Voyage sin método de pago. El detalle completo está en `backend/evals/results/`.

## Próximos pasos

- Escribir un set de preguntas nuevo, que no haya usado para ajustar el prompt, y correr los evals contra él.
- Agregar método de pago en Voyage: 3 peticiones por minuto no alcanzan para una demo pública.
- Desplegar el backend en Render con `CORS_ORIGIN` apuntando al dominio de Firebase.

## Cómo uso IA en este proyecto

Uso Claude Code como par de programación. Yo decido qué se construye y por qué; la IA me ayuda con el cómo, y nada entra al repo sin que yo lo revise y lo pruebe.

**Mi flujo:**

1. **Primero el contrato y las decisiones.** Antes de pedir código escribo qué debe hacer cada parte ([docs/api-contract.md](docs/api-contract.md) y las decisiones de arriba). Así la IA trabaja sobre algo definido y yo tengo con qué comparar lo que me da.
2. **Partes pequeñas, una por commit.** Pido una pieza a la vez (el cliente de `/ask`, el formulario, el servidor, la búsqueda) para poder revisarla completa antes de seguir.
3. **Probar, no confiar.** Cada parte pasa por algo que la compruebe: los mocks para los 7 estados de la pantalla, `npm run smoke` para las llaves, `/health` y `/ask` con preguntas reales y, al final, los evals.
4. **Pedirle que revise, no solo que escriba.** Uso la IA para buscar bugs en mi código. Así encontré que el 502 nunca llegaba al frontend.
5. **Ayuda con los evals, pero yo verifico.** Las 20 preguntas de prueba las redacté con ayuda de Claude y revisé que cada respuesta esperada exista en las fuentes.
6. **Limpiar lo que genera.** El código generado tiende a llenarse de comentarios que narran lo obvio. Hice una pasada para dejar solo los que explican una decisión.

**Lo que no le delego:** qué problema resolver y para quién, el alcance del MVP, el diseño y la marca, los datos que entran al corpus (todas las fuentes las elegí y revisé yo) y la calibración del umbral.

## Créditos

Pendiente de completar al cierre. Debe decir con honestidad qué escribí yo, qué generé con ayuda de Claude y Claude Code, y qué librerías usé.
