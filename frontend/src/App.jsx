import { useState } from 'react';
import { askQuestion, validateQuestion } from './api/ask.js';
import Header from './components/Header.jsx';
import Notice from './components/Notice.jsx';
import QuestionForm from './components/QuestionForm.jsx';
import SuggestedQuestions from './components/SuggestedQuestions.jsx';
import LoadingState from './components/LoadingState.jsx';
import AnswerView from './components/AnswerView.jsx';

// Preguntas que el corpus sí cubre (fuentes 01, 02, 05 y 06).
const SUGGESTIONS = [
  '¿Cómo saco mi acta en línea?',
  '¿Cuánto cuesta una copia certificada?',
  '¿Dónde hay una oficina del Registro Civil?',
  '¿Cómo corrijo un error en mi acta?',
];

function App() {
  const [question, setQuestion] = useState('');
  const [formError, setFormError] = useState(null);
  const [result, setResult] = useState(null);

  const isIdle = result === null;
  const isLoading = result?.state === 'loading';

  function handleChange(text) {
    setQuestion(text);
    setFormError(null); // al escribir, se quita el error anterior
  }

  // Devuelve true si la pregunta se envió, false si no era válida.
  function handleSubmit() {
    const invalid = validateQuestion(question);
    if (invalid) {
      setFormError(invalid.message);
      return false;
    }
    sendQuestion(question);
    return true;
  }

  // Una píldora llena el campo y envía la pregunta de una vez.
  function handleSuggestion(text) {
    setQuestion(text);
    setFormError(null);
    sendQuestion(text);
  }

  async function sendQuestion(text) {
    setResult({ state: 'loading' });
    const response = await askQuestion(text);

    // Si el backend también la rechaza (400), se muestra igual que la validación del frontend.
    if (response.state === 'invalid') {
      setFormError(response.message);
      setResult(null);
      return;
    }
    setResult(response);
  }

  return (
    <>
      <Header />
      <main className="page">
        <Notice />

        {isIdle ? (
          <div className="hero">
            <h1 className="hero__title">
              Tu acta de nacimiento, en claro<span className="hero__dot">.</span>
            </h1>
          </div>
        ) : (
          <h1 className="visually-hidden">Trámite en claro</h1>
        )}

        {isIdle && (
          <SuggestedQuestions
            title="Preguntas frecuentes"
            questions={SUGGESTIONS}
            onSelect={handleSuggestion}
          />
        )}

        <QuestionForm
          value={question}
          onChange={handleChange}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          error={formError}
        />

        {/* aria-live: el lector de pantalla anuncia lo que aparece aquí (cargando, respuesta, errores). */}
               <section className="result" aria-live="polite" aria-busy={isLoading}>
          {isLoading && <LoadingState />}
          {result?.state === 'answered' && <AnswerView data={result.data} />}
          {/* Temporal: no_info, off_topic y error se muestran en crudo hasta el paso 8. */}
          {['no_info', 'off_topic', 'error'].includes(result?.state) && (
            <pre>{JSON.stringify(result, null, 2)}</pre>
          )}
        </section>
      </main>
    </>
  );
}

export default App;