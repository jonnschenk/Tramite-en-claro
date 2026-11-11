# Contrato de API — Trámite en claro

Versión 0.1 · 2026-11-10. El frontend se construye con datos mock que siguen este contrato; el backend debe devolver exactamente esta forma.

## `POST /ask`

### Petición

```json
{ "question": "¿Cuánto cuesta una copia certificada?" }
```

| Campo | Tipo | Regla |
| --- | --- | --- |
| `question` | string | Obligatorio. Se quitan espacios al inicio y al final. De 1 a 500 caracteres. |

No se envían ni se guardan datos personales.

### Respuesta 200: siempre trae `status`

`status` dice qué estado de la pantalla mostrar. Las tres respuestas son 200 porque el sistema funcionó bien, incluso cuando no responde.

#### `answered`: hay respuesta con fuentes

```json
{
  "status": "answered",
  "summary": {
    "text": "Puedes sacarla en línea con Llave CDMX. El costo es de $98.00.",
    "sourceIds": [1]
  },
  "steps": [
    { "text": "Inicia sesión en Llave CDMX Expediente.", "sourceIds": [1] },
    { "text": "Elige \"Tramita una copia de tu acta\" y después \"Acta de Nacimiento\".", "sourceIds": [1] },
    { "text": "Paga los derechos y descarga tu acta digital.", "sourceIds": [1] }
  ],
  "sources": [
    {
      "id": 1,
      "title": "Expedición de copias certificadas de actas — Portal CDMX",
      "url": "https://www.cdmx.gob.mx/public/InformacionTramite.xhtml?idTramite=598",
      "domain": "cdmx.gob.mx",
      "consultedAt": "2026-11-10"
    }
  ],
  "officialUrl": "https://www.cdmx.gob.mx/public/InformacionTramite.xhtml?idTramite=598"
}
```

- Cada dato del resumen y de los pasos cita sus fuentes con `sourceIds`, que apuntan a `sources[].id`.
- `officialUrl` es el botón "Ir al trámite oficial".
- `consultedAt` va en formato `AAAA-MM-DD`; el frontend lo muestra como "Consultada el 10 de noviembre de 2026".

> El ejemplo es ilustrativo: el texto real sale del corpus.

#### `no_info`: la pregunta es del tema, pero la respuesta no está en las fuentes

```json
{
  "status": "no_info",
  "message": "No tengo esa información en las fuentes oficiales que reviso.",
  "officialUrl": "https://www.cdmx.gob.mx/"
}
```

#### `off_topic`: la pregunta no es sobre el acta de nacimiento en CDMX

```json
{
  "status": "off_topic",
  "message": "Por ahora solo respondo sobre el acta de nacimiento en la Ciudad de México.",
  "suggestions": [
    "¿Cómo saco mi acta en línea?",
    "¿Cuánto cuesta una copia certificada?"
  ]
}
```

**Cómo se decide cada caso:**
- `off_topic`: ningún fragmento pasa el umbral de similitud, así que no se llama al modelo.
- `no_info`: sí hay fragmentos parecidos, pero el modelo indica que la respuesta no está en ellos.

### Errores: siempre `{ "error": { "code", "message" } }`

| HTTP | `code` | Cuándo | Estado en pantalla |
| --- | --- | --- | --- |
| 400 | `EMPTY_QUESTION` | `question` vacía o solo espacios | 6. Pregunta inválida |
| 400 | `QUESTION_TOO_LONG` | Más de 500 caracteres | 6. Pregunta inválida |
| 429 | `RATE_LIMITED` | Se pasó el límite de uso | 5. Error (texto de límite) |
| 502 | `UPSTREAM_ERROR` | Falló Voyage o el modelo | 5. Error |
| 500 | `INTERNAL_ERROR` | Cualquier otro fallo | 5. Error |

```json
{ "error": { "code": "QUESTION_TOO_LONG", "message": "La pregunta tiene más de 500 caracteres.", "maxLength": 500 } }
```

```json
{ "error": { "code": "RATE_LIMITED", "message": "Llegaste al límite de preguntas por ahora.", "retryAfterSeconds": 60 } }
```

El frontend valida lo mismo antes de enviar, pero el backend vuelve a validar: cualquiera puede llamar a `/ask` sin pasar por la pantalla.

### Tiempo de espera

El frontend cancela la petición a los 30 s y muestra el estado 5 (Error). A los 10 s cambia el texto a "Sigue buscando…".

## `GET /health`

`200 { "ok": true }`. Sirve para revisar que el servidor desplegado está vivo.

## De la respuesta a la pantalla

| Respuesta | Estado del diseño |
| --- | --- |
| Petición en curso | 2. Cargando |
| `status: "answered"` | 3. Respuesta |
| `status: "no_info"` | 4. Sin información |
| 429 / 500 / 502 / red / tiempo agotado | 5. Error |
| 400 (o validación del frontend) | 6. Pregunta inválida |
| `status: "off_topic"` | 7. Fuera de tema |