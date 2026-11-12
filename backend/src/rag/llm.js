import { UpstreamError } from '../errors.js';

const TIMEOUT_MS = 18_000; // Voyage (10 s) + modelo (18 s) caben en los 30 s del frontend
const MAX_TOKENS = 1200;

export async function callModel({ system, user }) {
  const provider = process.env.LLM_PROVIDER || 'openrouter';
  if (provider === 'openrouter') return callOpenRouter(system, user);
  if (provider === 'anthropic') return callAnthropic(system, user);
  throw new Error(`LLM_PROVIDER desconocido: "${provider}". Usa "openrouter" o "anthropic".`);
}

async function post(service, url, headers, body) {
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    throw new UpstreamError(service, err.message);
  }
  if (!res.ok) throw new UpstreamError(service, `${res.status} ${await res.text()}`);
  return res.json();
}

async function callOpenRouter(system, user) {
  const env = process.env;
  const data = await post(
    'OpenRouter',
    'https://openrouter.ai/api/v1/chat/completions',
    { Authorization: `Bearer ${env.OPENROUTER_API_KEY}` },
    {
      model: env.OPENROUTER_MODEL || 'deepseek/deepseek-v4.1-flash',
      max_tokens: MAX_TOKENS,
      temperature: 0,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    },
  );
  return data.choices?.[0]?.message?.content ?? '';
}

async function callAnthropic(system, user) {
  const env = process.env;
  const data = await post(
    'Claude',
    'https://api.anthropic.com/v1/messages',
    { 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    {
      model: env.CLAUDE_MODEL || 'claude-haiku-5-5',
      max_tokens: MAX_TOKENS,
      temperature: 0,
      system,
      messages: [{ role: 'user', content: user }],
    },
  );
  return data.content?.find((block) => block.type === 'text')?.text ?? '';
}