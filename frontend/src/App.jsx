import { useState } from 'react';
import { askQuestion, validateQuestion } from './api/ask.js';
import Header from './components/Header.jsx';
import Notice from './components/Notice.jsx';
import QuestionForm from './components/QuestionForm.jsx';

function App() {
  const [question, setQuestion] = useState('');
  const [formError, setFormError] = useState(null);
  const [result, setResult] = useState(null);

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
        <QuestionForm
          value={question}
          onChange={handleChange}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          error={formError}
        />
        {/* Temporal: muestra el resultado crudo. Se reemplaza en los siguientes pasos. */}
        <pre>{JSON.stringify(result, null, 2)}</pre>
      </main>
    </>
  );
}

export default App;