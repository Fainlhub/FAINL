export enum ModelProvider {
  GOOGLE = "Google (Direct)",
  OPENAI = "OpenAI",
  ANTHROPIC = "Anthropic",
  GROQ = "Groq",
  DEEPSEEK = "DeepSeek",
  MISTRAL = "Mistral AI",
  OPENROUTER = "OpenRouter",
  OLLAMA = "Ollama (Local)",
  CUSTOM = "Custom (OpenAI Compatible)",
  MIMO = "MiMo-V2-Flash",
  DEVSTRAL = "Devstral 2 2512",
  KAT = "KAT-Coder-Pro V1",
  OLMO = "Olmo 3 32B Think",
  NEMOTRON = "Nemotron 3 Nano",
  GEMMA = "Gemma 3 12B",
  GLM = "GLM 4.5 Air",
  PERPLEXITY = "Perplexity",
}

export interface CouncilMember {
  id: string;
  name: string;
  role: string;
  provider: ModelProvider;
  modelId: string; // The API model string
  baseUrl?: string; // For custom endpoints (Groq, LocalAI)
  avatar: string;
  color: string; // Tailwind class
  description: string;
  systemPrompt?: string; // Custom instructions for this specific member
}

export interface PeerReview {
  reviewerId: string;
  targetId: string;
  content: string;
  score: number; // 1-10
}

export interface CouncilResponse {
  memberId: string;
  content: string;
  sections?: Record<string, string>;
  timestamp: number;
  startedAt?: number;
}

export interface DebateMessage {
  id: string;
  memberId: string;
  content: string;
  timestamp: number;
}

export enum WorkflowStage {
  IDLE = "IDLE",
  PROCESSING_COUNCIL = "PROCESSING_COUNCIL",
  DEBATE = 'DEBATE',
  COMPOSITION = "COMPOSITION",
  PEER_REVIEW = "PEER_REVIEW",
  SYNTHESIZING = "SYNTHESIZING",
  COMPLETED = "COMPLETED",
  ERROR = "ERROR",
}

export interface SessionState {
  id: string;
  stage: WorkflowStage;
  query: string;
  councilResponses: CouncilResponse[];
  debateMessages: DebateMessage[];
  reviews: PeerReview[];
  userComposedResponse?: string; // The "7th node" / 4th node custom choice
  synthesis: string;
  error?: string;
  isArchived?: boolean;
  timestamp?: number;
}

// ─── Chat module ──────────────────────────────────────────────────────────────

export type ChatTier = 'instant' | 'moderate' | 'complex' | 'max' | 'ultra';
export type ChatRole = 'user' | 'assistant';

export interface ChatTurn {
  role: ChatRole;
  content: string;
}

export interface ChatProject {
  id: string;
  name: string;
  created_at: string;
}

export interface ChatThread {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

// One node's contribution inside the expandable Thinking block.
export interface NodeTrace {
  memberId: string;
  name: string;
  modelId: string;
  content: string;
}

// chat_messages.metadata — can be 50-150KB for consensus turns, so list
// queries must never select it.
export interface ThinkingMetadata {
  creditsSpent?: number;
  byok?: boolean;
  nodeTraces?: NodeTrace[];
  reviews?: PeerReview[];
  durationMs?: number;
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  role: ChatRole;
  content: string;
  tier: ChatTier;
  metadata: ThinkingMetadata;
  created_at: string;
}

export interface AppConfig {
  activeCouncil: CouncilMember[];
  customNodes: CouncilMember[];
  chairmanId: string;
  modelCount: 3 | 7;
  // Usage Tracking
  turnsUsed: number;
  creditsRemaining: number;
  isLifetime: boolean;
  totalTurnsAllowed: number;
  // Local/custom provider keys (proxied providers use server-side secrets)
  customKey?: string;
  customBaseUrl?: string;
  // Legacy key fields kept for backwards-compat with saved localStorage configs
  googleKey?: string;
  openaiKey?: string;
  anthropicKey?: string;
  groqKey?: string;
  deepseekKey?: string;
  mistralKey?: string;
  openRouterKey?: string;
  nemotronKey?: string;
  glmKey?: string;
  mimoKey?: string;
  devstralKey?: string;
  katKey?: string;
  olmoKey?: string;
  gemmaKey?: string;
}
