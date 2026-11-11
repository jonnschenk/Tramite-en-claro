import { useState } from 'react';
import { askQuestion } from './api/ask.js';
import Header from './components/Header.jsx';
import Notice from './components/Notice.jsx';

function App() {
  const [result, setResult] = useState(null);

  async function handleClick() {
    setResult({ state: 'loading' });
    setResult(await askQuestion('¿Cuánto cuesta una copia certificada?'));
  }

  return (
    <>
      <Header />
      <main className="page">
        <Notice />
        {/* Temporal: prueba de askQuestion. Se reemplaza en los siguientes pasos. */}
        <button onClick={handleClick}>Probar</button>
        <pre>{JSON.stringify(result, null, 2)}</pre>
      </main>
    </>
  );
}

export default App;