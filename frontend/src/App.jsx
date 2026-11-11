import { useState } from 'react';
import { askQuestion } from './api/ask.js';

// Pantalla temporal: prueba askQuestion con los mocks.
function App() {
  const [result, setResult] = useState(null);

  async function handleClick() {
    setResult({ state: 'loading' });
    setResult(await askQuestion('¿Cuánto cuesta una copia certificada?'));
  }

  return (
    <main>
      <h1>Trámite en claro</h1>
      <button onClick={handleClick}>Probar</button>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </main>
  );
}

export default App;