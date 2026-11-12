import { useRef } from 'react';
import { MAX_LENGTH } from '../api/ask.js';

// Campo de pregunta con contador, validación accesible y botón.
// No guarda estado propio: App le pasa el valor y decide qué hacer al enviar.
function QuestionForm({ value, onChange, onSubmit, isLoading, error }) {
  const fieldRef = useRef(null);
  const length = value.trim().length;
  const isOver = length > MAX_LENGTH;

  function handleSubmit(event) {
    event.preventDefault();
    const ok = onSubmit();
    // Si la pregunta no es válida, el foco regresa al campo.
    if (!ok) fieldRef.current.focus();
  }

  // Enter envía; Shift + Enter hace un salto de línea.
  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form.requestSubmit();
    }
  }

  const describedBy = ['question-hint', 'question-counter', error && 'question-error']
    .filter(Boolean)
    .join(' ');

  return (
    <form className="question-form" onSubmit={handleSubmit} noValidate>
      <label className="visually-hidden" htmlFor="question">
        Tu pregunta sobre el acta de nacimiento
      </label>

      <div className={`question-form__field${error || isOver ? ' question-form__field--invalid' : ''}`}>
        <textarea
          ref={fieldRef}
          id="question"
          className="question-form__input"
          rows={2}
          placeholder="Escribe tu duda sobre el acta…"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
        />

        <button className="question-form__submit" type="submit" disabled={isLoading}>
          {isLoading ? 'Buscando…' : 'Preguntar'}
        </button>
      </div>

      <div className="question-form__meta">
        <p className="question-form__hint" id="question-hint">
          No escribas datos personales como tu CURP.
        </p>
        <p className={`question-form__counter${isOver ? ' question-form__counter--over' : ''}`} id="question-counter">
          {length}/{MAX_LENGTH}
          <span className="visually-hidden"> caracteres</span>
        </p>
      </div>

      {error && (
        <p className="question-form__error" id="question-error" role="alert">
          <svg className="question-form__error-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M12 7v6M12 16.5v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {error}
        </p>
      )}
    </form>
  );
}

export default QuestionForm;