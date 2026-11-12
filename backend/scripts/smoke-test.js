// Revisa que las llaves de .env funcionen: Voyage y el modelo de LLM_PROVIDER.

const env = process.env;
const LLM_PROVIDER = env.LLM_PROVIDER || 'openrouter';

// Las llaves creadas en MongoDB Atlas usan ai.mongodb.com.
// Las llaves antiguas creadas en el sitio de Voyage usan api.voyageai.com.
const VOYAGE_BASE_URL = env.VOYAGE_BASE_URL || 'https://ai.mongodb.com/v1';

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

async function testVoyage() {
  if (!env.VOYAGE_API_KEY) fail('Falta VOYAGE_API_KEY en .env');

  const res = await fetch(`${VOYAGE_BASE_URL}/embeddings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.VOYAGE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: ['¿Puedo sacar mi acta de nacimiento en línea?'],
      model: env.VOYAGE_MODEL || 'voyage-4',
      input_type: 'query',
    }),
  });

  if (!res.ok) fail(`Voyage falló: ${res.status} ${await res.text()}`);

  const data = await res.json();
  console.log(`Voyage OK: el embedding tiene ${data.data[0].embedding.length} números.`);
}

async function testOpenRouter() {
  if (!env.OPENROUTER_API_KEY) fail('Falta OPENROUTER_API_KEY en .env');

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.OPENROUTER_MODEL || 'deepseek/deepseek-v4.1-flash',
      max_tokens: 50,
      messages: [{ role: 'user', content: 'Responde solo: "DeepSeek OK".' }],
    }),
  });

  if (!res.ok) fail(`OpenRouter falló: ${res.status} ${await res.text()}`);

  const data = await res.json();
  console.log('DeepSeek respondió:', data.choices[0].message.content);
}

async function testAnthropic() {
  if (!env.ANTHROPIC_API_KEY) fail('Falta ANTHROPIC_API_KEY en .env');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.CLAUDE_MODEL || 'claude-haiku-5-5',
      max_tokens: 50,
      messages: [{ role: 'user', content: 'Responde solo: "Claude OK".' }],
    }),
  });

  if (!res.ok) fail(`Claude falló: ${res.status} ${await res.text()}`);

  const data = await res.json();
  console.log('Claude respondió:', data.content[0].text);
}

await testVoyage();

if (LLM_PROVIDER === 'anthropic') await testAnthropic();
else if (LLM_PROVIDER === 'openrouter') await testOpenRouter();
else fail(`LLM_PROVIDER desconocido: "${LLM_PROVIDER}". Usa "openrouter" o "anthropic".`);

console.log('Las dos APIs funcionan.');
