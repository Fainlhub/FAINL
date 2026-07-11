import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  FC,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "../services/supabaseClient";
import { UnifiedCouncilService } from "../services/councilService";
import {
  ChatMessage,
  ChatProject,
  ChatThread,
  ChatTier,
  CouncilMember,
  ModelProvider,
  NodeTrace,
  ThinkingMetadata,
} from "../types";
import {
  CHAT_SYSTEM_PROMPTS,
  SYNTH_AGGREGATOR,
  DEFAULT_CHAIRMAN,
  CHAT_MODEL_OPTIONS,
  DEFAULT_CHAT_MODEL_IDS,
} from "../constants";
import * as chatDb from "../services/chatService";
import { getByokKeys, byokKeyFor } from "../services/byokService";

const ANON_THREAD_KEY = 'fainl_anon_thread';
const MODEL_SELECTION_KEY = 'fainl_chat_model_selection';
const BYOK_ENABLED_KEY = 'fainl_byok_enabled';

export interface NodeStatus {
  memberId: string;
  name: string;
  status: 'busy' | 'done' | 'error';
}

interface ChatContextValue {
  threads: ChatThread[];
  projects: ChatProject[];
  activeThreadId: string | null;
  messages: ChatMessage[];
  models: CouncilMember[];
  selectedModelIds: string[];
  setSelectedModelIds: (ids: string[]) => void;
  isStreaming: boolean;
  pendingNodes: NodeStatus[] | null;
  chatError: string | null;
  paywallOpen: boolean;
  setPaywallOpen: (open: boolean) => void;
  byokEnabled: boolean;
  byokAllowed: boolean;
  setByokEnabled: (on: boolean) => void;
  sendMessage: (content: string) => Promise<void>;
  newThread: () => void;
  openThread: (id: string) => Promise<void>;
  renameThread: (id: string, title: string) => Promise<void>;
  pinThread: (id: string, pinned: boolean) => Promise<void>;
  removeThread: (id: string) => Promise<void>;
  moveThreadToProject: (id: string, projectId: string | null) => Promise<void>;
  addProject: (name: string) => Promise<void>;
  editProject: (id: string, name: string) => Promise<void>;
  removeProject: (id: string) => Promise<void>;
  refreshThreads: () => Promise<void>;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

const makeServiceConfig = () => ({
  activeCouncil: chatDb.getActiveCouncil(),
  customNodes: [],
  chairmanId: DEFAULT_CHAIRMAN.id,
  modelCount: 7 as const,
  turnsUsed: 0,
  creditsRemaining: 0,
  isLifetime: false,
  totalTurnsAllowed: 2,
});

// In BYOK mode the aggregator (and the Instant model) must run on a provider
// the user actually has a key for.
function pickByokMember(base: CouncilMember): CouncilMember | null {
  if (byokKeyFor(base)) return base;
  const keys = getByokKeys();
  if (keys.anthropic) return { ...base, provider: ModelProvider.ANTHROPIC, modelId: 'claude-sonnet-4-20250514' };
  if (keys.google) return { ...base, provider: ModelProvider.GOOGLE, modelId: 'gemini-2.5-flash' };
  if (keys.groq) return { ...base, provider: ModelProvider.GROQ, modelId: 'llama-3.3-70b-versatile' };
  if (keys.openrouter) return { ...base, provider: ModelProvider.OPENROUTER, modelId: 'openrouter/auto' };
  return null;
}

const legacyTierForModelCount = (count: number): ChatTier => {
  if (count <= 1) return 'instant';
  if (count <= 3) return 'moderate';
  if (count <= 5) return 'complex';
  return 'max';
};

const cleanSelectedModelIds = (ids: string[]) => {
  const validIds = new Set(CHAT_MODEL_OPTIONS.map(model => model.id));
  const cleaned = ids.filter((id, index) => validIds.has(id) && ids.indexOf(id) === index);
  return cleaned.length ? cleaned : DEFAULT_CHAT_MODEL_IDS;
};

export const ChatProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { authSession, profile, fetchProfile } = useAuth();
  const userId = authSession?.user?.id ?? null;

  const serviceRef = useRef<UnifiedCouncilService>(new UnifiedCouncilService(makeServiceConfig() as any));

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [projects, setProjects] = useState<ChatProject[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedModelIds, setSelectedModelIdsState] = useState<string[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(MODEL_SELECTION_KEY) || 'null');
      return cleanSelectedModelIds(Array.isArray(stored) ? stored : DEFAULT_CHAT_MODEL_IDS);
    } catch {
      return DEFAULT_CHAT_MODEL_IDS;
    }
  });
  const [isStreaming, setIsStreaming] = useState(false);
  const [pendingNodes, setPendingNodes] = useState<NodeStatus[] | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [byokEnabled, setByokEnabledState] = useState(() => localStorage.getItem(BYOK_ENABLED_KEY) === 'true');
  const byokAllowed = !!profile?.is_lifetime;

  const setSelectedModelIds = useCallback((ids: string[]) => {
    const cleaned = cleanSelectedModelIds(ids);
    setSelectedModelIdsState(cleaned);
    localStorage.setItem(MODEL_SELECTION_KEY, JSON.stringify(cleaned));
  }, []);

  const setByokEnabled = useCallback((on: boolean) => {
    if (on && !byokAllowed) {
      setPaywallOpen(true);
      setByokEnabledState(false);
      localStorage.setItem(BYOK_ENABLED_KEY, 'false');
      return;
    }
    setByokEnabledState(on);
    localStorage.setItem(BYOK_ENABLED_KEY, String(on));
  }, [byokAllowed]);

  useEffect(() => {
    if (!byokAllowed && byokEnabled) {
      setByokEnabledState(false);
      localStorage.setItem(BYOK_ENABLED_KEY, 'false');
    }
  }, [byokAllowed, byokEnabled]);

  // ── Bootstrapping ───────────────────────────────────────────────────────────

  const refreshThreads = useCallback(async () => {
    if (!userId) { setThreads([]); setProjects([]); return; }
    try {
      const [t, p] = await Promise.all([chatDb.fetchThreads(), chatDb.fetchProjects()]);
      setThreads(t);
      setProjects(p);
    } catch (e) {
      console.error('Kon chats niet laden:', e);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      // Logged in: cloud threads; drop any anonymous draft.
      setMessages([]);
      setActiveThreadId(null);
      refreshThreads();
    } else {
      // Anonymous: one ephemeral thread restored from the local draft.
      setThreads([]);
      setProjects([]);
      setActiveThreadId(null);
      try {
        const draft = JSON.parse(localStorage.getItem(ANON_THREAD_KEY) || 'null');
        setMessages(Array.isArray(draft?.messages) ? draft.messages : []);
      } catch {
        setMessages([]);
      }
    }
  }, [userId, refreshThreads]);

  // Mirror the anonymous thread to a local draft so a reload doesn't wipe it mid-visit.
  useEffect(() => {
    if (!userId) {
      localStorage.setItem(ANON_THREAD_KEY, JSON.stringify({ messages: messages.slice(-40) }));
    }
  }, [messages, userId]);

  // ── Thread operations ───────────────────────────────────────────────────────

  const newThread = useCallback(() => {
    setActiveThreadId(null);
    setMessages(userId ? [] : []);
    setChatError(null);
    if (!userId) localStorage.removeItem(ANON_THREAD_KEY);
  }, [userId]);

  const openThread = useCallback(async (id: string) => {
    setChatError(null);
    setActiveThreadId(id);
    setMessages([]);
    try {
      setMessages(await chatDb.fetchMessages(id));
    } catch (e) {
      console.error('Kon berichten niet laden:', e);
      setChatError('Kon dit gesprek niet laden. Probeer het opnieuw.');
    }
  }, []);

  const renameThread = useCallback(async (id: string, title: string) => {
    setThreads(prev => prev.map(t => (t.id === id ? { ...t, title } : t)));
    await chatDb.updateThread(id, { title });
  }, []);

  const pinThread = useCallback(async (id: string, pinned: boolean) => {
    setThreads(prev => prev.map(t => (t.id === id ? { ...t, pinned } : t)));
    await chatDb.updateThread(id, { pinned });
  }, []);

  const removeThread = useCallback(async (id: string) => {
    setThreads(prev => prev.filter(t => t.id !== id));
    if (activeThreadId === id) { setActiveThreadId(null); setMessages([]); }
    await chatDb.deleteThread(id);
  }, [activeThreadId]);

  const moveThreadToProject = useCallback(async (id: string, projectId: string | null) => {
    setThreads(prev => prev.map(t => (t.id === id ? { ...t, project_id: projectId } : t)));
    await chatDb.updateThread(id, { project_id: projectId });
  }, []);

  const addProject = useCallback(async (name: string) => {
    if (!userId) return;
    const project = await chatDb.createProject(userId, name);
    setProjects(prev => [...prev, project]);
  }, [userId]);

  const editProject = useCallback(async (id: string, name: string) => {
    setProjects(prev => prev.map(p => (p.id === id ? { ...p, name } : p)));
    await chatDb.renameProject(id, name);
  }, []);

  const removeProject = useCallback(async (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    setThreads(prev => prev.map(t => (t.project_id === id ? { ...t, project_id: null } : t)));
    await chatDb.deleteProject(id);
  }, []);

  // ── Message pipeline ────────────────────────────────────────────────────────

  const appendChunk = useCallback((draftId: string, chunk: string) => {
    setMessages(prev => prev.map(m => (m.id === draftId ? { ...m, content: m.content + chunk } : m)));
  }, []);

  const finalizeDraft = useCallback((draftId: string, metadata: ThinkingMetadata) => {
    setMessages(prev => prev.map(m => (m.id === draftId ? { ...m, metadata } : m)));
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    const vraag = content.trim();
    if (!vraag || isStreaming) return;
    setChatError(null);

    const service = serviceRef.current;
    const selectedIds = userId ? selectedModelIds : selectedModelIds.slice(0, 1);
    let selectedMembers = CHAT_MODEL_OPTIONS.filter(model => selectedIds.includes(model.id));
    if (!selectedMembers.length) selectedMembers = [CHAT_MODEL_OPTIONS[0]];
    const effectiveTier = legacyTierForModelCount(selectedMembers.length);
    const byok = byokAllowed && byokEnabled && Object.keys(getByokKeys()).length > 0;
    const cost = byok || !userId ? 0 : selectedMembers.length;

    // 1. Affordability, before anything is sent or stored.
    if (cost > 0) {
      if (!profile) { setPaywallOpen(true); return; }
      if (!profile.is_lifetime && profile.credits_remaining < cost) {
        setPaywallOpen(true);
        return;
      }
    }

    setIsStreaming(true);
    const startedAt = Date.now();

    try {
      // 2. Backend reachable before charging (skipped in pure-BYOK runs).
      if (!byok) await service.assertProxyAvailable();

      // 3. Charge.
      if (cost > 0 && userId) {
        const { data, error } = await supabase.rpc('deduct_credits', { p_user_id: userId, p_amount: cost });
        if (error || !data?.success) {
          if (data?.reason === 'insufficient_credits') setPaywallOpen(true);
          else setChatError('Credits konden niet worden afgeschreven. Probeer het opnieuw.');
          return;
        }
      }

      // 4. Ensure a cloud thread exists (logged in).
      let threadId = activeThreadId;
      if (userId && !threadId) {
        const fallbackTitle = vraag.length > 40 ? vraag.slice(0, 40).trimEnd() + '…' : vraag;
        const thread = await chatDb.createThread(userId, fallbackTitle);
        threadId = thread.id;
        setActiveThreadId(thread.id);
        setThreads(prev => [thread, ...prev]);
        // Better title in the background; never blocks the answer.
        chatDb.generateThreadTitle(service, vraag).then(title => {
          if (title !== fallbackTitle) {
            chatDb.updateThread(thread.id, { title }).catch(() => {});
            setThreads(prev => prev.map(t => (t.id === thread.id ? { ...t, title } : t)));
          }
        });
      }

      const now = new Date().toISOString();
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        thread_id: threadId ?? 'anon',
        role: 'user',
        content: vraag,
        tier: effectiveTier,
        metadata: {},
        created_at: now,
      };
      const draft: ChatMessage = {
        id: crypto.randomUUID(),
        thread_id: threadId ?? 'anon',
        role: 'assistant',
        content: '',
        tier: effectiveTier,
        metadata: {},
        created_at: now,
      };
      const history = [...messages, userMsg];
      setMessages([...history, draft]);

      if (userId && threadId) {
        chatDb.insertMessage({ ...userMsg, user_id: userId, thread_id: threadId }).catch(e =>
          console.error('Bericht opslaan mislukt:', e)
        );
      }

      let finalMeta: ThinkingMetadata;

      if (selectedMembers.length === 1) {
        // ── Instant: one fast model, true multi-turn ──
        let member = selectedMembers[0];
        if (byok) {
          const picked = pickByokMember(member);
          if (!picked) throw new Error('Geen eigen sleutel beschikbaar. Voeg een sleutel toe in Node-configuratie.');
          member = picked;
        }
        await service.chatStream(
          member,
          chatDb.buildInstantTurns(history),
          CHAT_SYSTEM_PROMPTS.INSTANT,
          chunk => appendChunk(draft.id, chunk),
          { byok }
        );
        finalMeta = {
          creditsSpent: cost,
          byok,
          selectedModels: [member].map(model => ({
            id: model.id,
            name: model.name,
            provider: String(model.provider),
            modelId: model.modelId,
          })),
          durationMs: Date.now() - startedAt,
        };
      } else {
        // ── Moderate+: node fan-out → (peer review) → aggregation ──
        let council = selectedMembers;
        if (byok) {
          council = council.filter(m => byokKeyFor(m));
          if (!council.length) {
            throw new Error('Geen geselecteerde modellen beschikbaar met eigen sleutels. Voeg sleutels toe in Node-configuratie.');
          }
        }

        setPendingNodes(council.map(m => ({ memberId: m.id, name: m.name, status: 'busy' })));
        const nodeQuery = chatDb.buildNodeQuery(history, vraag);

        const traces: NodeTrace[] = [];
        await Promise.all(council.map(async member => {
          try {
            const answer = await service.generateWithPrompt(
              member,
              nodeQuery,
              CHAT_SYSTEM_PROMPTS.NODE_ANALYST(vraag),
              { byok }
            );
            const failed = answer.startsWith('[');
            if (!failed) traces.push({ memberId: member.id, name: member.name, modelId: member.modelId, content: answer });
            setPendingNodes(prev => prev?.map(n =>
              n.memberId === member.id ? { ...n, status: failed ? 'error' : 'done' } : n
            ) ?? null);
          } catch {
            setPendingNodes(prev => prev?.map(n =>
              n.memberId === member.id ? { ...n, status: 'error' } : n
            ) ?? null);
          }
        }));

        if (!traces.length) {
          throw new Error('Geen van de geselecteerde modellen kon antwoorden. Probeer het over een moment opnieuw.');
        }

        let aggregator = SYNTH_AGGREGATOR;
        if (byok) {
          const picked = pickByokMember(SYNTH_AGGREGATOR);
          if (!picked) throw new Error('Geen eigen sleutel beschikbaar voor de samenvoegstap.');
          aggregator = picked;
        }

        const context = traces.map((t, i) => `--- MODEL ${i + 1}: ${t.name} (${t.modelId}) ---\n${t.content}`).join('\n\n');

        await service.chatStream(
          aggregator,
          [{ role: 'user', content: CHAT_SYSTEM_PROMPTS.AGGREGATOR(vraag, context) }],
          undefined,
          chunk => appendChunk(draft.id, chunk),
          { byok, maxTokens: 8192 }
        );

        finalMeta = {
          creditsSpent: cost,
          byok,
          selectedModels: council.map(model => ({
            id: model.id,
            name: model.name,
            provider: String(model.provider),
            modelId: model.modelId,
          })),
          nodeTraces: traces,
          durationMs: Date.now() - startedAt,
        };
      }

      finalizeDraft(draft.id, finalMeta);

      if (userId && threadId) {
        setMessages(prev => {
          const finished = prev.find(m => m.id === draft.id);
          if (finished?.content) {
            chatDb.insertMessage({
              id: draft.id,
              thread_id: threadId!,
              user_id: userId,
              role: 'assistant',
              content: finished.content,
              tier: effectiveTier,
              metadata: finalMeta,
            }).catch(e => console.error('Antwoord opslaan mislukt:', e));
          }
          return prev;
        });
        refreshThreads();
      }

      if (cost > 0) fetchProfile(userId ?? undefined);
    } catch (e: any) {
      console.error('Chatbeurt mislukt:', e);
      // Drop the empty draft; keep the user's message visible.
      setMessages(prev => prev.filter(m => !(m.role === 'assistant' && m.content === '')));
      setChatError(e?.message || 'Er ging iets mis. Probeer het opnieuw.');
    } finally {
      setIsStreaming(false);
      setPendingNodes(null);
    }
  }, [messages, selectedModelIds, userId, profile, byokAllowed, byokEnabled, isStreaming, activeThreadId, appendChunk, finalizeDraft, refreshThreads, fetchProfile]);

  return (
    <ChatContext.Provider
      value={{
        threads,
        projects,
        activeThreadId,
        messages,
        models: CHAT_MODEL_OPTIONS,
        selectedModelIds,
        setSelectedModelIds,
        isStreaming,
        pendingNodes,
        chatError,
        paywallOpen,
        setPaywallOpen,
        byokEnabled,
        byokAllowed,
        setByokEnabled,
        sendMessage,
        newThread,
        openThread,
        renameThread,
        pinThread,
        removeThread,
        moveThreadToProject,
        addProject,
        editProject,
        removeProject,
        refreshThreads,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextValue => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
