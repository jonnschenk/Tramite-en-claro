import { useEffect, useRef, useState } from 'react';
import { askQuestion, validateQuestion, wakeUpServer } from './api/ask.js';
import Header from './components/Header.jsx';
import QuestionForm from './components/QuestionForm.jsx';
import SuggestedQuestions from './components/SuggestedQuestions.jsx';
import LoadingState from './components/LoadingState.jsx';
import AnswerView from './components/AnswerView.jsx';
import NoInfoState from './components/NoInfoState.jsx';
import OffTopicState from './components/OffTopicState.jsx';
import ErrorState from './components/ErrorState.jsx';
import HowItWorks from './components/HowItWorks.jsx';
import Credits from './components/Credits.jsx';
import { useKeyboardOffset } from './utils/useKeyboardOffset.js';

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
  const requestId = useRef(0); // para ignorar respuestas que llegan después de volver al inicio
  const homeTitle = useRef(null);
  useKeyboardOffset(); // en móvil, la barra del buscador sube junto con el teclado

  // Al abrir la página despertamos al servidor mientras la persona escribe.
  useEffect(() => {
    wakeUpServer().then(() => setServerAwake(true));
  }, []);

  // "Atrás" del navegador o del celular: si hay un resultado en pantalla, regresa al home
  // en lugar de salir de la página.
  useEffect(() => {
    function handlePopState() {
      resetToHome();
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
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

  // Deja la pantalla como al abrir la página. El foco va al título para que el lector de pantalla
  // sepa dónde quedó (no al campo: en el celular abriría el teclado sin que la persona lo pida).
  function resetToHome() {
    requestId.current += 1;
    setResult(null);
    setQuestion('');
    setFormError(null);
    window.scrollTo({ top: 0 });
    requestAnimationFrame(() => homeTitle.current?.focus({ preventScroll: true }));
  }

  // Botón "Inicio" del header. Si el resultado está en el historial, regresa con history.back()
  // (dispara popstate → resetToHome) para que el historial no acumule pasos de más.
  function handleHome() {
    if (window.history.state?.view === 'result') {
      window.history.back();
    } else {
      resetToHome();
    }
  }

  async function sendQuestion(text) {
    const id = ++requestId.current;
    lastQuestion.current = text;
    // Al salir del home se agrega un paso al historial; las siguientes preguntas lo reutilizan.
    if (window.history.state?.view !== 'result') {
      window.history.pushState({ view: 'result' }, '');
    }
    setResult({ state: 'loading' });
    const response = await askQuestion(text);
    if (id !== requestId.current) return; // la persona ya volvió al inicio o preguntó otra cosa

    // Si el backend también la rechaza (400), se muestra igual que la validación del frontend.
    if (response.state === 'invalid') {
      setFormError(response.message);
      setResult(null);
      window.history.replaceState(null, ''); // ya no hay resultado en pantalla
      return;
    }
    setResult(response);
  }

  return (
    <>
      <Header isHome={isIdle} onHome={isIdle ? null : handleHome} />
      <main className={`page${isIdle ? ' page--idle' : ''}`}>
        {isIdle ? (
          <div className="hero">
            <h1 className="hero__title" ref={homeTitle} tabIndex={-1}>
              Tu acta de nacimiento,{' '}
              <br />
              <span className="hero__accent">en claro.</span>
            </h1>
            <Credits className="hero__credits" />
          </div>
        ) : (
          <h1 className="visually-hidden">Trámite en claro</h1>
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

        {isIdle && (
          <SuggestedQuestions
            title="Preguntas frecuentes"
            questions={SUGGESTIONS}
            onSelect={handleSuggestion}
          />
        )}

        {isIdle && <HowItWorks />}
        {/* aria-live: el lector de pantalla anuncia lo que aparece aquí (cargando, respuesta, errores). */}
        <section className="result" aria-live="polite" aria-busy={isLoading}>
          {isLoading && <LoadingState isWaking={!serverAwake} />}
          {result?.state === 'answered' && <AnswerView data={result.data} />}
          {result?.state === 'no_info' && <NoInfoState data={result.data} />}
          {(result?.state === 'off_topic' || result?.state === 'needs_detail') && (
            <OffTopicState data={result.data} onSelect={handleSuggestion} />
          )}
          {result?.state === 'error' && (
            <ErrorState message={result.message} onRetry={() => sendQuestion(lastQuestion.current)} />
          )}
        </section>
      </main>
      <footer className={`footer${isIdle ? ' footer--home' : ''}`}>
        <Credits />
      </footer>
    </>
  );
}

export default App;