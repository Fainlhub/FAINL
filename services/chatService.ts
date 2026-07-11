import { supabase } from "./supabaseClient";
import { ChatMessage, ChatProject, ChatThread, ChatTurn, CouncilMember } from "../types";
import { DEFAULT_COUNCIL, INSTANT_MEMBER, CHAT_SYSTEM_PROMPTS } from "../constants";
import { UnifiedCouncilService } from "./councilService";

// Explicit column list for thread/message queries. metadata is deliberately
// absent from THREAD_COLUMNS-adjacent list queries; it can be 50-150KB per
// consensus turn and only the open thread ever needs it.
const THREAD_COLUMNS = 'id, user_id, project_id, title, pinned, created_at, updated_at';
const MESSAGE_COLUMNS = 'id, thread_id, role, content, tier, metadata, created_at';

// ─── Thread / message / project CRUD (cloud, RLS-owner-scoped) ────────────────

export async function fetchThreads(): Promise<ChatThread[]> {
  const { data, error } = await supabase
    .from('chat_threads')
    .select(THREAD_COLUMNS)
    .order('pinned', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as ChatThread[];
}

export async function fetchProjects(): Promise<ChatProject[]> {
  const { data, error } = await supabase
    .from('chat_projects')
    .select('id, name, created_at')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as ChatProject[];
}

export async function fetchMessages(threadId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select(MESSAGE_COLUMNS)
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as ChatMessage[];
}

export async function createThread(userId: string, title: string, projectId?: string | null): Promise<ChatThread> {
  const { data, error } = await supabase
    .from('chat_threads')
    .insert({ user_id: userId, title, project_id: projectId ?? null })
    .select(THREAD_COLUMNS)
    .single();
  if (error) throw error;
  return data as ChatThread;
}

export async function insertMessage(msg: {
  id: string;
  thread_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  tier: string;
  metadata?: object;
}): Promise<void> {
  const { error } = await supabase.from('chat_messages').insert({
    ...msg,
    metadata: msg.metadata ?? {},
  });
  if (error) throw error;
}

export async function updateThread(
  threadId: string,
  patch: Partial<Pick<ChatThread, 'title' | 'pinned' | 'project_id'>>
): Promise<void> {
  const { error } = await supabase.from('chat_threads').update(patch).eq('id', threadId);
  if (error) throw error;
}

export async function deleteThread(threadId: string): Promise<void> {
  const { error } = await supabase.from('chat_threads').delete().eq('id', threadId);
  if (error) throw error;
}

export async function createProject(userId: string, name: string): Promise<ChatProject> {
  const { data, error } = await supabase
    .from('chat_projects')
    .insert({ user_id: userId, name })
    .select('id, name, created_at')
    .single();
  if (error) throw error;
  return data as ChatProject;
}

export async function renameProject(projectId: string, name: string): Promise<void> {
  const { error } = await supabase.from('chat_projects').update({ name }).eq('id', projectId);
  if (error) throw error;
}

export async function deleteProject(projectId: string): Promise<void> {
  // Threads keep existing (FK is ON DELETE SET NULL) and fall back to the date groups.
  const { error } = await supabase.from('chat_projects').delete().eq('id', projectId);
  if (error) throw error;
}

// ─── Prompt/context helpers ───────────────────────────────────────────────────

const MAX_TURNS = 20;
const MAX_CONTEXT_TURNS = 6;
const MAX_CHARS_PER_TURN = 800;

/** Multi-turn history for the Instant path (true messages[] over the wire). */
export function buildInstantTurns(history: ChatMessage[]): ChatTurn[] {
  return history
    .slice(-MAX_TURNS)
    .map(m => ({ role: m.role, content: m.content }));
}

/**
 * Flattened conversation context for node fan-out (nodes answer one
 * contextualized question, mirroring how buildDebateContext flattens turns).
 */
export function buildNodeQuery(history: ChatMessage[], vraag: string): string {
  const prior = history.slice(0, -1).slice(-MAX_CONTEXT_TURNS);
  if (!prior.length) return vraag;
  let context = 'GESPREKSCONTEXT (eerdere beurten):\n';
  for (const m of prior) {
    const label = m.role === 'user' ? 'GEBRUIKER' : 'ANTWOORD';
    const text = m.content.length > MAX_CHARS_PER_TURN
      ? m.content.slice(0, MAX_CHARS_PER_TURN) + '…'
      : m.content;
    context += `[${label}]: ${text.replace(/\n/g, ' ')}\n`;
  }
  return `${context}\nNIEUWE VRAAG: ${vraag}`;
}

/** Short Dutch thread title via the free fast model; falls back to a truncation. */
export async function generateThreadTitle(service: UnifiedCouncilService, query: string): Promise<string> {
  const fallback = query.length > 40 ? query.slice(0, 40).trimEnd() + '…' : query;
  try {
    const title = await service.generateWithPrompt(
      INSTANT_MEMBER,
      `Vat deze vraag samen als korte titel: "${query.slice(0, 500)}"`,
      'Antwoord met alléén de titel: maximaal 5 woorden, Nederlands, geen aanhalingstekens, geen punt.',
      { maxTokens: 30 }
    );
    const clean = title.trim().replace(/^["']|["']$/g, '').split('\n')[0];
    return clean && !clean.startsWith('[') && clean.length <= 80 ? clean : fallback;
  } catch {
    return fallback;
  }
}

// ─── Council configuration for chat tiers ─────────────────────────────────────

/**
 * Node order determines tier participation (first 3 = Moderate, first 5 =
 * Complex). Reads the user's saved council from Node-configuratie, falling
 * back to the default seven.
 */
export function getActiveCouncil(): CouncilMember[] {
  try {
    const raw = localStorage.getItem('fainl_config_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.activeCouncil) && parsed.activeCouncil.length > 0) {
        return parsed.activeCouncil;
      }
    }
  } catch { /* corrupt config: fall through */ }
  return DEFAULT_COUNCIL;
}

export { CHAT_SYSTEM_PROMPTS };
