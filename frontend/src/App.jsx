import { useEffect, useRef, useState } from 'react';
import { askQuestion, validateQuestion, wakeUpServer } from './api/ask.js';
import Header from './components/Header.jsx';
import Notice from './components/Notice.jsx';
import QuestionForm from './components/QuestionForm.jsx';
import SuggestedQuestions from './components/SuggestedQuestions.jsx';
import LoadingState from './components/LoadingState.jsx';
import AnswerView from './components/AnswerView.jsx';
import NoInfoState from './components/NoInfoState.jsx';
import OffTopicState from './components/OffTopicState.jsx';
import ErrorState from './components/ErrorState.jsx';
import HowItWorks from './components/HowItWorks.jsx';

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
  const [serverAwake, setServerAwake] = useState(false);
  const lastQuestion = useRef(''); // la última pregunta enviada, para "Reintentar"

  // Al abrir la página despertamos al servidor mientras la persona escribe.
  useEffect(() => {
    wakeUpServer().then(() => setServerAwake(true));
  }, []);

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
    lastQuestion.current = text;
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
      <main className={`page${isIdle ? ' page--idle' : ''}`}>
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

        <div className={`ask-bar${isIdle ? '' : ' ask-bar--docked'}`}>
          <QuestionForm
            value={question}
            onChange={handleChange}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={formError}
          />
        </div>

        {isIdle && <HowItWorks />}
//Necesito estudiar "aria live"
        {/* aria-live: el lector de pantalla anuncia lo que aparece aquí (cargando, respuesta, errores). */}
        <section className="result" aria-live="polite" aria-busy={isLoading}>
          {isLoading && <LoadingState isWaking={!serverAwake} />}
          {result?.state === 'answered' && <AnswerView data={result.data} />}
          {result?.state === 'no_info' && <NoInfoState data={result.data} />}
          {result?.state === 'off_topic' && (
            <OffTopicState data={result.data} onSelect={handleSuggestion} />
          )}
          {result?.state === 'error' && (
            <ErrorState message={result.message} onRetry={() => sendQuestion(lastQuestion.current)} />
          )}
        </section>
      </main>
    </>
  );
}

export default App;