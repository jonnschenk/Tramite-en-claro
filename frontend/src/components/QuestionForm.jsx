import { useLayoutEffect, useRef } from 'react';

// Altura máxima del campo (unas 4 líneas); arriba de eso aparece scroll.
const MAX_INPUT_HEIGHT = 120;
import { MAX_LENGTH } from '../api/ask.js';

function QuestionForm({ value, onChange, onSubmit, isLoading, error }) {
  const fieldRef = useRef(null);
  const length = value.trim().length;
  const isOver = length > MAX_LENGTH;
  // El contador solo aparece cerca del límite: con preguntas normales es ruido.
  const showCounter = length >= MAX_LENGTH * 0.8;

  // El campo crece con el texto, también cuando una sugerencia lo llena o se vacía al enviar.
  useLayoutEffect(() => {
    const field = fieldRef.current;
    field.style.height = 'auto';
    field.style.height = `${Math.min(field.scrollHeight, MAX_INPUT_HEIGHT)}px`;
  }, [value]);

  function handleSubmit(event) {
    event.preventDefault();
    const ok = onSubmit();
    if (!ok) fieldRef.current.focus();
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form.requestSubmit();
    }
  }

  const describedBy = ['question-hint', showCounter && 'question-counter', error && 'question-error']
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
          rows={1}
          placeholder="Escribe tu duda sobre el acta…"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
        />

        <button
          className="question-form__submit"
          type="submit"
          disabled={isLoading}
          aria-label={isLoading ? 'Buscando…' : 'Preguntar'}
        >
          {isLoading ? (
            <span className="question-form__spinner" aria-hidden="true" />
          ) : (
            <svg className="question-form__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      <div className="question-form__meta">
        <p className="question-form__hint" id="question-hint">
          No escribas datos personales como tu CURP.
        </p>
        {showCounter && (
          <p className={`question-form__counter${isOver ? ' question-form__counter--over' : ''}`} id="question-counter">
            {length}/{MAX_LENGTH}
            <span className="visually-hidden"> caracteres</span>
          </p>
        )}
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