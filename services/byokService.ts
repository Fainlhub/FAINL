import { ChatTurn, CouncilMember, ModelProvider } from "../types";

// Bring-your-own-key: calls go STRAIGHT from the browser to the provider.
// Keys never transit the ai-proxy or any FAINL server, so they can never
// appear in our logs. That restricts BYOK to providers whose APIs allow
// browser CORS. Keys live only in localStorage on this device.

const BYOK_STORAGE_KEY = 'fainl_byok_v1';

export type ByokProvider = 'google' | 'anthropic' | 'groq' | 'openrouter';

export const BYOK_PROVIDERS: Record<ByokProvider, { label: string; keyHint: string }> = {
  google:     { label: 'Google Gemini', keyHint: 'AIza...' },
  anthropic:  { label: 'Anthropic',     keyHint: 'sk-ant-...' },
  groq:       { label: 'Groq',          keyHint: 'gsk_...' },
  openrouter: { label: 'OpenRouter',    keyHint: 'sk-or-...' },
};

const PROVIDER_MAP: Partial<Record<ModelProvider, ByokProvider>> = {
  [ModelProvider.GOOGLE]:     'google',
  [ModelProvider.ANTHROPIC]:  'anthropic',
  [ModelProvider.GROQ]:       'groq',
  [ModelProvider.OPENROUTER]: 'openrouter',
};

export function byokProviderFor(member: CouncilMember): ByokProvider | null {
  return PROVIDER_MAP[member.provider] ?? null;
}

export function getByokKeys(): Partial<Record<ByokProvider, string>> {
  try {
    return JSON.parse(localStorage.getItem(BYOK_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function setByokKey(provider: ByokProvider, key: string): void {
  const keys = getByokKeys();
  if (key) keys[provider] = key;
  else delete keys[provider];
  localStorage.setItem(BYOK_STORAGE_KEY, JSON.stringify(keys));
}

export function clearByokKeys(): void {
  localStorage.removeItem(BYOK_STORAGE_KEY);
}

export function byokKeyFor(member: CouncilMember): string | null {
  const provider = byokProviderFor(member);
  if (!provider) return null;
  return getByokKeys()[provider] ?? null;
}

// ─── SSE readers per provider family ─────────────────────────────────────────

async function readSse(
  res: Response,
  extract: (payload: string) => string,
  onChunk?: (chunk: string) => void
): Promise<string> {
  if (!res.body) throw new Error('No response body');
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (!payload || payload === '[DONE]') continue;
      try {
        const text = extract(payload);
        if (text) { fullText += text; onChunk?.(text); }
      } catch { /* partial JSON */ }
    }
  }
  return fullText;
}

function toGeminiContents(turns: ChatTurn[]) {
  return turns.map(t => ({
    role: t.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: t.content }],
  }));
}

// ─── Direct provider calls ───────────────────────────────────────────────────

export async function byokStream(
  provider: ByokProvider,
  key: string,
  modelId: string,
  turns: ChatTurn[],
  systemInstruction: string | undefined,
  onChunk?: (chunk: string) => void,
  maxTokens = 4096
): Promise<string> {
  if (provider === 'google') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:streamGenerateContent?key=${encodeURIComponent(key)}&alt=sse`;
    const body: any = {
      contents: toGeminiContents(turns),
      generationConfig: { temperature: 0.7, maxOutputTokens: maxTokens },
    };
    if (systemInstruction) body.systemInstruction = { parts: [{ text: systemInstruction }] };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Google ${res.status}`);
    return readSse(res, p => JSON.parse(p).candidates?.[0]?.content?.parts?.[0]?.text ?? '', onChunk);
  }

  if (provider === 'anthropic') {
    const body: any = {
      model: modelId,
      max_tokens: maxTokens,
      messages: turns,
      temperature: 0.7,
      stream: true,
    };
    if (systemInstruction) body.system = systemInstruction;
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}`);
    return readSse(res, p => {
      const parsed = JSON.parse(p);
      return parsed.type === 'content_block_delta' ? (parsed.delta?.text ?? '') : '';
    }, onChunk);
  }

  // groq / openrouter: OpenAI-compatible
  const baseUrl = provider === 'groq'
    ? 'https://api.groq.com/openai/v1'
    : 'https://openrouter.ai/api/v1';
  const messages: any[] = [];
  if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
  messages.push(...turns);
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: modelId, messages, temperature: 0.7, max_tokens: maxTokens, stream: true }),
  });
  if (!res.ok) throw new Error(`${provider} ${res.status}`);
  return readSse(res, p => JSON.parse(p).choices?.[0]?.delta?.content ?? '', onChunk);
}

export async function byokGenerate(
  provider: ByokProvider,
  key: string,
  modelId: string,
  turns: ChatTurn[],
  systemInstruction?: string,
  maxTokens = 4096
): Promise<string> {
  return byokStream(provider, key, modelId, turns, systemInstruction, undefined, maxTokens);
}

// 1-token live test, straight from the browser to the provider.
export async function verifyByokKey(provider: ByokProvider, key: string): Promise<boolean> {
  const testModel: Record<ByokProvider, string> = {
    google: 'gemini-2.0-flash',
    anthropic: 'claude-sonnet-4-20250514',
    groq: 'llama-3.3-70b-versatile',
    openrouter: 'openrouter/auto',
  };
  try {
    const result = await byokStream(provider, key, testModel[provider], [{ role: 'user', content: 'ok' }], undefined, undefined, 1);
    return typeof result === 'string';
  } catch {
    return false;
  }
}
