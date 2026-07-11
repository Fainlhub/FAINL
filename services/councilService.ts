import { CouncilMember, CouncilResponse, PeerReview, ModelProvider, AppConfig, DebateMessage, ChatTurn } from "../types";
import { SYSTEM_PROMPTS } from "../constants";
import { parseCompartments } from "./parser";
import { byokKeyFor, byokProviderFor, byokStream } from "./byokService";

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '') as string;
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || '') as string;
const PROXY_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/ai-proxy` : '';

const PROXY_CONFIGURATION_ERROR =
  'De AI-backend is niet geconfigureerd. Stel VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY in.';

// Providers handled server-side via the Edge Function — no API keys needed in the browser
const PROXIED_PROVIDERS = new Set<ModelProvider>([
  ModelProvider.GOOGLE,
  ModelProvider.ANTHROPIC,
  ModelProvider.OPENAI,
  ModelProvider.GROQ,
  ModelProvider.DEEPSEEK,
  ModelProvider.MISTRAL,
  ModelProvider.OPENROUTER,
  ModelProvider.NEMOTRON,
  ModelProvider.GLM,
  ModelProvider.PERPLEXITY,
]);

const PROVIDER_STRING: Partial<Record<ModelProvider, string>> = {
  [ModelProvider.GOOGLE]:    'google',
  [ModelProvider.ANTHROPIC]: 'anthropic',
  [ModelProvider.OPENAI]:    'openai',
  [ModelProvider.GROQ]:      'groq',
  [ModelProvider.DEEPSEEK]:  'deepseek',
  [ModelProvider.MISTRAL]:   'mistral',
  [ModelProvider.OPENROUTER]:'openrouter',
  [ModelProvider.NEMOTRON]:  'nemotron',
  [ModelProvider.GLM]:       'glm',
  [ModelProvider.PERPLEXITY]:'perplexity',
};

export class UnifiedCouncilService {
  private config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
  }

  // Check if a provider is usable
  public isProviderReady(provider: ModelProvider): boolean {
    if (PROXIED_PROVIDERS.has(provider)) return true;
    if (provider === ModelProvider.OLLAMA) return true;
    if (provider === ModelProvider.CUSTOM) return !!(this.config.customKey);
    return false;
  }

  // Verify a user-supplied key for local/custom providers (proxied providers don't need this)
  public async verifyProviderKey(provider: ModelProvider, key: string): Promise<boolean> {
    if (!key) return false;
    if (PROXIED_PROVIDERS.has(provider)) return true; // server handles it
    try {
      if (provider === ModelProvider.OLLAMA) {
        const baseUrl = 'http://localhost:11434/v1';
        const res = await fetch(`${baseUrl}/models`, { headers: { 'Authorization': `Bearer ollama` } });
        return res.status === 200;
      }
      // Generic OpenAI-compatible check for custom
      const baseUrl = this.config.customBaseUrl || 'http://localhost:1234/v1';
      const res = await fetch(`${baseUrl}/models`, { headers: { 'Authorization': `Bearer ${key}` } });
      return res.status === 200;
    } catch {
      return false;
    }
  }

  public getReadyMembers(members: CouncilMember[]): CouncilMember[] {
    return members.filter(m => this.isProviderReady(m.provider));
  }

  /**
   * Verify the shared Edge Function before charging a credit or starting seven
   * parallel requests. The function handles OPTIONS without invoking a model.
   */
  public async assertProxyAvailable(): Promise<void> {
    if (!PROXY_URL || !SUPABASE_ANON_KEY) {
      throw new Error(PROXY_CONFIGURATION_ERROR);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8_000);
    try {
      const response = await fetch(PROXY_URL, {
        method: 'OPTIONS',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`De AI-backend antwoordt met HTTP ${response.status}.`);
      }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('De AI-backend')) throw error;
      throw new Error(
        'De AI-backend is onbereikbaar. Controleer of het Supabase-project actief is, ' +
        'VITE_SUPABASE_URL naar dat project wijst en de Edge Function ai-proxy is gedeployed.'
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // ─── Proxy calls ────────────────────────────────────────────────────────────

  private async callProxy(member: CouncilMember, prompt: string, systemInstruction?: string): Promise<string> {
    const provider = PROVIDER_STRING[member.provider];
    if (!provider) throw new Error(`Provider ${member.provider} not supported by proxy`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);
    try {
      const res = await fetch(PROXY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ provider, modelId: member.modelId, prompt, systemInstruction, stream: false }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(data.error || `Proxy error ${res.status}`);
      }
      const data = await res.json();
      return data.content || '';
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async callProxyStream(
    member: CouncilMember,
    prompt: string,
    systemInstruction?: string,
    onChunk?: (chunk: string) => void,
    maxTokens?: number
  ): Promise<string> {
    const provider = PROVIDER_STRING[member.provider];
    if (!provider) throw new Error(`Provider ${member.provider} not supported by proxy`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60_000);
    const res = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ provider, modelId: member.modelId, prompt, systemInstruction, stream: true, ...(maxTokens ? { maxTokens } : {}) }),
      signal: controller.signal,
    });

    if (!res.ok) {
      clearTimeout(timeoutId);
      const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(data.error || `Proxy error ${res.status}`);
    }
    if (!res.body) { clearTimeout(timeoutId); throw new Error('No response body from proxy'); }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') continue;
          try {
            const parsed = JSON.parse(payload);
            const text = parsed.content || '';
            if (text) { fullText += text; onChunk?.(text); }
          } catch { /* partial JSON */ }
        }
      }
    } finally {
      clearTimeout(timeoutId);
    }
    return fullText;
  }

  // ─── Local/custom provider calls (Ollama, Custom) ───────────────────────────

  private async callLocal(member: CouncilMember, prompt: string, systemInstruction?: string): Promise<string> {
    let apiKey = '';
    let baseUrl = '';
    if (member.provider === ModelProvider.OLLAMA) {
      apiKey = 'ollama';
      baseUrl = member.baseUrl || 'http://localhost:11434/v1';
    } else {
      apiKey = this.config.customKey || '';
      baseUrl = member.baseUrl || this.config.customBaseUrl || 'http://localhost:1234/v1';
    }

    const messages: { role: string; content: string }[] = [];
    if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
    messages.push({ role: 'user', content: prompt });

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: member.modelId, messages, temperature: 0.7 }),
    });
    if (!res.ok) throw new Error(`Local API Error ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }

  private async callLocalStream(
    member: CouncilMember,
    prompt: string,
    systemInstruction?: string,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    let apiKey = '';
    let baseUrl = '';
    if (member.provider === ModelProvider.OLLAMA) {
      apiKey = 'ollama';
      baseUrl = member.baseUrl || 'http://localhost:11434/v1';
    } else {
      apiKey = this.config.customKey || '';
      baseUrl = member.baseUrl || this.config.customBaseUrl || 'http://localhost:1234/v1';
    }

    const messages: { role: string; content: string }[] = [];
    if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
    messages.push({ role: 'user', content: prompt });

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: member.modelId, messages, temperature: 0.7, stream: true }),
    });
    if (!res.ok) throw new Error(`Local API Error ${res.status}`);
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
        if (payload === '[DONE]') continue;
        try {
          const parsed = JSON.parse(payload);
          const text = parsed.choices?.[0]?.delta?.content || '';
          if (text) { fullText += text; onChunk?.(text); }
        } catch { /* partial JSON */ }
      }
    }
    return fullText;
  }

  // ─── Internal routing ────────────────────────────────────────────────────────

  private async generate(member: CouncilMember, prompt: string, systemInstruction?: string): Promise<string> {
    if (!this.isProviderReady(member.provider)) {
      return `[Skipped] ${member.name}: Provider not configured.`;
    }
    try {
      if (PROXIED_PROVIDERS.has(member.provider)) {
        return await this.callProxy(member, prompt, systemInstruction);
      }
      return await this.callLocal(member, prompt, systemInstruction);
    } catch (error: any) {
      console.error(`Error with ${member.name}:`, error);
      const msg = error.message || 'Unknown error';
      if (msg.includes('401') || msg.toLowerCase().includes('invalid api key')) {
        return `[Unauthorized] ${member.name}: Invalid or missing API key.`;
      }
      return `[Error] ${member.name}: ${msg}`;
    }
  }

  private async generateStream(
    member: CouncilMember,
    prompt: string,
    systemInstruction?: string,
    onChunk?: (chunk: string) => void,
    maxTokens?: number
  ): Promise<string> {
    if (!this.isProviderReady(member.provider)) {
      const msg = `[Skipped] ${member.name}: Provider not configured.`;
      onChunk?.(msg);
      return msg;
    }
    try {
      if (PROXIED_PROVIDERS.has(member.provider)) {
        return await this.callProxyStream(member, prompt, systemInstruction, onChunk, maxTokens);
      }
      return await this.callLocalStream(member, prompt, systemInstruction, onChunk);
    } catch (error: any) {
      console.error(`Error with ${member.name}:`, error);
      const msg = `[Error] ${member.name}: ${error.message || 'Unknown error'}`;
      onChunk?.(msg);
      return msg;
    }
  }

  // ─── Chat module transport ───────────────────────────────────────────────────

  /**
   * Multi-turn streaming for the chat module. Routes through the proxy with a
   * messages[] body, or — when byok is set and the member's provider supports
   * it — straight from the browser to the provider so the user's key never
   * touches FAINL servers.
   */
  public async chatStream(
    member: CouncilMember,
    turns: ChatTurn[],
    systemInstruction: string | undefined,
    onChunk?: (chunk: string) => void,
    opts?: { maxTokens?: number; byok?: boolean }
  ): Promise<string> {
    if (opts?.byok) {
      const provider = byokProviderFor(member);
      const key = byokKeyFor(member);
      if (provider && key) {
        return byokStream(provider, key, member.modelId, turns, systemInstruction, onChunk, opts?.maxTokens ?? 4096);
      }
      throw new Error(`Geen eigen sleutel beschikbaar voor ${member.provider}`);
    }

    const provider = PROVIDER_STRING[member.provider];
    if (!provider) throw new Error(`Provider ${member.provider} not supported by proxy`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60_000);
    const res = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        provider,
        modelId: member.modelId,
        messages: turns,
        systemInstruction,
        stream: true,
        ...(opts?.maxTokens ? { maxTokens: opts.maxTokens } : {}),
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      clearTimeout(timeoutId);
      const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(data.error || `Proxy error ${res.status}`);
    }
    if (!res.body) { clearTimeout(timeoutId); throw new Error('No response body from proxy'); }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') continue;
          try {
            const parsed = JSON.parse(payload);
            const text = parsed.content || '';
            if (text) { fullText += text; onChunk?.(text); }
          } catch { /* partial JSON */ }
        }
      }
    } finally {
      clearTimeout(timeoutId);
    }
    return fullText;
  }

  /** Non-streaming single-shot with a custom system prompt (chat fan-out, titles). */
  public async generateWithPrompt(
    member: CouncilMember,
    prompt: string,
    systemInstruction?: string,
    opts?: { byok?: boolean; maxTokens?: number }
  ): Promise<string> {
    if (opts?.byok) {
      const provider = byokProviderFor(member);
      const key = byokKeyFor(member);
      if (provider && key) {
        return byokStream(provider, key, member.modelId, [{ role: 'user', content: prompt }], systemInstruction, undefined, opts?.maxTokens ?? 4096);
      }
      throw new Error(`Geen eigen sleutel beschikbaar voor ${member.provider}`);
    }
    return this.generate(member, prompt, systemInstruction);
  }

  // ─── Public API ──────────────────────────────────────────────────────────────

  async getCouncilResponses(
    query: string,
    members: CouncilMember[],
    onProgress?: (response: CouncilResponse) => void
  ): Promise<CouncilResponse[]> {
    const results: CouncilResponse[] = [];
    const promises = members.map(async (member) => {
      const structuredPrompt = SYSTEM_PROMPTS.COUNCIL_MEMBER(query, member.description);
      const content = await this.generate(member, query, structuredPrompt);
      const response: CouncilResponse = {
        memberId: member.id,
        content,
        sections: parseCompartments(content),
        timestamp: Date.now(),
        startedAt: Date.now(),
      };
      results.push(response);
      onProgress?.(response);
      return response;
    });
    await Promise.all(promises);
    return results;
  }

  async getPeerReviews(query: string, members: CouncilMember[], responses: CouncilResponse[]): Promise<PeerReview[]> {
    const activeResponses = responses.filter(r => !r.content.startsWith("[Skipped]") && !r.content.startsWith("[Unauthorized]"));
    const reviewPromises: Promise<PeerReview | null>[] = [];

    members.forEach(reviewer => {
      activeResponses.forEach(target => {
        if (target.memberId === reviewer.id) return;
        reviewPromises.push((async () => {
          const critique = await this.generate(
            reviewer,
            SYSTEM_PROMPTS.PEER_REVIEWER(query, target.content, members.find(m => m.id === target.memberId)?.name || "Peer"),
            "Analyze logical consistency."
          );
          if (critique.startsWith("[Skipped]") || critique.startsWith("[Unauthorized]")) return null;
          const scoreMatch = critique.match(/Score:\s*(\d+)/i);
          return { reviewerId: reviewer.id, targetId: target.memberId, content: critique, score: scoreMatch ? parseInt(scoreMatch[1], 10) : 5 };
        })());
      });
    });

    const results = await Promise.all(reviewPromises);
    return results.filter((r): r is PeerReview => r !== null);
  }

  private buildDebateContext(
    query: string,
    member: CouncilMember,
    councilResponses: CouncilResponse[],
    debateMessages: DebateMessage[],
    members: CouncilMember[]
  ): { context: string; systemPrompt: string } {
    const ownStance = councilResponses.find(r => r.memberId === member.id);

    let context = `ONDERWERP: "${query}"\n\n`;

    if (ownStance) {
      context += `=== JOUW STANDPUNT (verdedig en verdiep dit) ===\n`;
      context += `${ownStance.content.replace(/\n/g, ' ')}\n\n`;
    }

    context += `=== STANDPUNTEN ANDEREN ===\n`;
    councilResponses.filter(r => r.memberId !== member.id).forEach(r => {
      const m = members.find(x => x.id === r.memberId);
      if (m) context += `[${m.name}]: ${r.content.replace(/\n/g, ' ')}\n`;
    });

    const recentMessages = debateMessages.slice(-6);
    const lastMsg = recentMessages.length > 0 ? recentMessages[recentMessages.length - 1] : null;
    const userSpokeRecently = lastMsg?.memberId === 'user';
    const lastSpeakerName = lastMsg
      ? (lastMsg.memberId === 'user' ? 'de gebruiker' : (members.find(x => x.id === lastMsg.memberId)?.name ?? 'iemand'))
      : null;

    if (recentMessages.length > 0) {
      context += `\n=== LAATSTE ${recentMessages.length} DEBATBEURTEN ===\n`;
      recentMessages.forEach(m => {
        const isSelf = m.memberId === member.id;
        const authorName = m.memberId === 'user' ? 'GEBRUIKER' : (members.find(x => x.id === m.memberId)?.name ?? 'Onbekend');
        const snippet = m.content.replace(/\n/g, ' ');
        context += `${isSelf ? '[JIJ]' : `[${authorName}]`}: ${snippet}\n`;
      });
    }

    const totalTurns = debateMessages.filter(m => m.memberId !== 'user').length;
    const stage = totalTurns < 3 ? 'opening' : totalTurns < 10 ? 'clash' : 'closing';

    const userMessages = debateMessages.filter(m => m.memberId === 'user');
    const avgUserWordCount = userMessages.length > 0
      ? Math.round(userMessages.reduce((sum, m) => sum + m.content.split(' ').length, 0) / userMessages.length)
      : 0;
    const userLevel = avgUserWordCount > 40 ? 'expert' : avgUserWordCount > 15 ? 'informed' : 'general';

    const otherNames = members.filter(m => m.id !== member.id).map(m => m.name);

    const systemPrompt = `Jij bent ${member.name}. Jouw karakter: ${member.description || ''}

TAAL: Antwoord UITSLUITEND in vloeiend, gesproken Nederlands. Geen Engels, nooit.

Dit is een live debat. Kort, direct, raak — alsof je echt in gesprek bent.

Andere deelnemers: ${otherNames.join(', ')}.

SPREEKREGELS:
- Reageer direct op wat ${lastSpeakerName ?? 'de ander'} zei. Spreek ze bij naam aan.
- Begin met een klap: "Nee —", "Wacht even ${lastSpeakerName ?? ''} —", "Precies, maar je mist het punt:", "Goed punt, maar hier is het echte probleem:"
- MAX 3 zinnen. Geen opsommingen, geen kopjes, gewone spreektaal.
- Ga nooit samenvatten — aanval, kaats terug, of stel de vraag die ze niet kunnen negeren.
- ${stage === 'opening' ? 'Openingsfase: Sla de eerste klap. Zet je standpunt neer met lef.' : stage === 'clash' ? 'Clashfase: Zoek het zwakste punt in het laatste argument en val het direct aan.' : 'Slotfase: Eén memorabele zin. Dit is je laatste woord — laat het tellen.'}
- ${userLevel === 'expert' ? 'Niveau: expert — geen handje vasthouden, dicht en scherp.' : userLevel === 'informed' ? 'Niveau: ingevoerd — vakjargon mag, kort.' : 'Niveau: algemeen — gewone taal, concrete voorbeelden, geen jargon.'}
${userSpokeRecently ? `\nKRITIEK: De GEBRUIKER heeft net gesproken. Jouw EERSTE zin spreekt hen DIRECT aan. Dit is ook hún debat.` : ''}`.trim();

    return { context, systemPrompt };
  }

  async generateDebateResponse(
    query: string,
    member: CouncilMember,
    councilResponses: CouncilResponse[],
    debateMessages: DebateMessage[],
    members: CouncilMember[]
  ): Promise<string> {
    const { context, systemPrompt } = this.buildDebateContext(query, member, councilResponses, debateMessages, members);
    return this.generate(member, context, systemPrompt);
  }

  async generateDebateResponseStream(
    query: string,
    member: CouncilMember,
    councilResponses: CouncilResponse[],
    debateMessages: DebateMessage[],
    members: CouncilMember[],
    onChunk: (chunk: string) => void
  ): Promise<string> {
    const { context, systemPrompt } = this.buildDebateContext(query, member, councilResponses, debateMessages, members);
    return this.generateStream(member, context, systemPrompt, onChunk);
  }

  // ── Google Chirp 3 HD TTS ────────────────────────────────────────────────────
  async synthesizeSpeech(text: string, voiceName: string, speakingRate: number): Promise<string | null> {
    try {
      const res = await fetch(PROXY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ provider: 'tts', modelId: voiceName, prompt: text, temperature: speakingRate }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.audioContent || null;
    } catch {
      return null;
    }
  }

  async synthesize(
    query: string,
    responses: CouncilResponse[],
    reviews: PeerReview[],
    debateMessages: DebateMessage[],
    members: CouncilMember[],
    chairman: CouncilMember,
    userComposed?: string
  ): Promise<string> {
    const context = this.buildContext(query, responses, reviews, debateMessages, members, userComposed);
    return this.generate(chairman, SYSTEM_PROMPTS.CHAIRMAN(query, context), chairman.systemPrompt);
  }

  async synthesizeStream(
    query: string,
    responses: CouncilResponse[],
    reviews: PeerReview[],
    debateMessages: DebateMessage[],
    members: CouncilMember[],
    chairman: CouncilMember,
    onChunk: (chunk: string) => void,
    userComposed?: string
  ): Promise<string> {
    const context = this.buildContext(query, responses, reviews, debateMessages, members, userComposed);
    // Use 8192 tokens for the chairman synthesis so the full verdict is never truncated
    return this.generateStream(chairman, SYSTEM_PROMPTS.CHAIRMAN(query, context), chairman.systemPrompt, onChunk, 8192);
  }

  private buildContext(
    query: string,
    responses: CouncilResponse[],
    reviews: PeerReview[],
    debateMessages: DebateMessage[],
    members: CouncilMember[],
    userComposed?: string
  ): string {
    let context = "";

    if (userComposed) {
      context += "--- USER'S PREFERRED BEST ANSWER (PRIORITY) ---\n";
      context += `${userComposed}\n\n`;
      context += "De gebruiker heeft bovenstaand antwoord samengesteld uit de segmenten van de raad. Neem dit als leidraad voor jouw eindoordeel.\n\n";
    }

    context += "--- COUNCIL FINDINGS ---\n";
    responses.filter(r => !r.content.startsWith("[")).forEach(r => {
      context += `\n[${members.find(x => x.id === r.memberId)?.name}]: ${r.content}\n`;
    });

    if (reviews && reviews.length > 0) {
      context += "\n--- PEER REVIEWS ---\n";
      reviews.forEach(r => {
        context += `\n[${members.find(m => m.id === r.reviewerId)?.name} reviewing ${members.find(m => m.id === r.targetId)?.name}]: ${r.content}\n`;
      });
    }

    if (debateMessages && debateMessages.length > 0) {
      context += "\n--- DEBATE TRANSCRIPT ---\n";
      debateMessages.forEach(m => {
        const authorName = m.memberId === 'user' ? 'User' : members.find(x => x.id === m.memberId)?.name || 'Unknown';
        context += `\n[${authorName}]: ${m.content}\n`;
      });
    }

    return context;
  }
}
