import { mockResponses } from './mocks/ask-responses.js';

// Pantalla temporal: solo comprueba que React, Sass y los mocks funcionan.
function App() {
  return (
    <main>
      <h1>Trámite en claro</h1>
      <pre>{JSON.stringify(mockResponses.answered, null, 2)}</pre>
    </main>
  );
}

export default App;