export const IMAGE_COUNCIL_ASPECT_RATIOS = ['1:1', '4:5', '3:2', '16:9', '9:16'] as const;
export type ImageCouncilAspectRatio = (typeof IMAGE_COUNCIL_ASPECT_RATIOS)[number];

export const IMAGE_COUNCIL_STYLE_PRESETS = ['auto', 'photo', 'illustration', 'editorial', 'product'] as const;
export type ImageCouncilStylePreset = (typeof IMAGE_COUNCIL_STYLE_PRESETS)[number];

export const IMAGE_COUNCIL_PIPELINE_STATUSES = [
  'queued', 'moderating', 'generating', 'evaluating', 'debating', 'refining',
  'ranking', 'polishing', 'completed', 'partial', 'failed',
  'cancel_requested', 'cancelled', 'quarantined',
] as const;
export type ImageCouncilStatus = (typeof IMAGE_COUNCIL_PIPELINE_STATUSES)[number];

export type ImageCouncilProjectLifecycle =
  | 'active' | 'archived' | 'deletion_requested' | 'purged';
export type ImageCouncilArtifactKind = 'original' | 'refinement' | 'finalist' | 'thumbnail';
export type ImageCouncilBranchStatus =
  | 'queued' | 'generating' | 'completed' | 'failed'
  | 'cancel_requested' | 'cancelled' | 'quarantined';

export const IMAGE_COUNCIL_COMMANDS = [
  'cancel_run', 'retry_step', 'select_artifact', 'refine_artifact', 'delete_project',
] as const;
export type ImageCouncilCommand = (typeof IMAGE_COUNCIL_COMMANDS)[number];

export interface StartImageCouncilInput {
  clientRequestId: string;
  prompt: string;
  aspectRatio: ImageCouncilAspectRatio;
  stylePreset: ImageCouncilStylePreset;
}

export interface StartImageCouncilResponse {
  projectId: string;
  runId: string;
  status: 'queued';
  reservedCredits: 9;
}

export interface ImageCouncilCommandRequest {
  clientRequestId: string;
  command: ImageCouncilCommand;
  projectId: string;
  runId?: string;
  artifactId?: string;
  step?: ImageCouncilStatus;
  prompt?: string;
}

export interface ImageCouncilProject {
  id: string;
  userId: string;
  title: string;
  brief: string;
  lifecycleStatus: ImageCouncilProjectLifecycle;
  selectedArtifactId: string | null;
  pinned: boolean;
  latestRunId: string | null;
  pipelineStatus: ImageCouncilStatus | null;
  createdAt: string;
  updatedAt: string;
}

export interface ImageCouncilRun {
  id: string;
  userId: string;
  projectId: string;
  status: ImageCouncilStatus;
  prompt: string;
  reservedCredits: number | null;
  settledCredits: number | null;
  aspectRatio: ImageCouncilAspectRatio;
  stylePreset: ImageCouncilStylePreset;
  failureCode: string | null;
  failureStage: string | null;
  failureDetail: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface ImageCouncilBranch {
  id: string;
  userId: string;
  projectId: string;
  runId: string;
  modelCatalogId: string;
  ordinal: number;
  status: ImageCouncilBranchStatus;
  failureCode: string | null;
  failureDetail: string | null;
  createdAt: string;
}

export interface ImageCouncilEvaluation {
  id: string;
  runId: string;
  artifactId: string;
  evaluatorModelCatalogId: string;
  evaluator: string;
  round: number;
  criteria: Record<string, unknown>;
  argumentation: string;
  confidence: number;
  createdAt: string;
}

export interface ImageCouncilRanking {
  id: string;
  runId: string;
  evaluatorModelCatalogId: string;
  evaluator: string;
  round: number;
  rank1ArtifactId: string;
  rank2ArtifactId: string | null;
  rank3ArtifactId: string | null;
  argumentation: string;
  confidence: number;
  createdAt: string;
}

export interface ImageCouncilArtifact {
  id: string;
  userId: string;
  projectId: string;
  runId: string;
  branchId: string | null;
  modelCatalogId: string;
  kind: ImageCouncilArtifactKind;
  parentArtifactId: string | null;
  version: number;
  storagePath: string;
  mimeType: string;
  checksumSha256: string;
  width: number;
  height: number;
  byteSize: number | null;
  metadata: Record<string, unknown>;
  rank: number | null;
  confidence: number | null;
  rankingRationale: string | null;
  evaluations: ImageCouncilEvaluation[];
  critique: string | null;
  createdAt: string;
}

export interface ImageCouncilEvent {
  id: string;
  projectId: string;
  runId: string;
  artifactId: string | null;
  eventType: string;
  payload: Record<string, unknown>;
  occurredAt: string;
}

export interface ImageCouncilProjectSnapshot {
  project: ImageCouncilProject;
  run: ImageCouncilRun | null;
  branches: ImageCouncilBranch[];
  artifacts: ImageCouncilArtifact[];
  events: ImageCouncilEvent[];
  selectedArtifactId: string | null;
}

export interface ImageCouncilContextValue {
  projects: ImageCouncilProject[];
  activeProject: ImageCouncilProject | null;
  activeRun: ImageCouncilRun | null;
  branches: ImageCouncilBranch[];
  artifacts: ImageCouncilArtifact[];
  events: ImageCouncilEvent[];
  selectedArtifactId: string | null;
  isLoadingProjects: boolean;
  isLoadingProject: boolean;
  isStarting: boolean;
  pendingCommand: ImageCouncilCommand | null;
  error: string | null;
  refreshProjects: () => Promise<void>;
  openProject: (projectId: string) => Promise<void>;
  clearActiveProject: () => void;
  startProject: (input: StartImageCouncilInput) => Promise<StartImageCouncilResponse>;
  cancelRun: (projectId: string, runId: string) => Promise<void>;
  retryStep: (projectId: string, runId: string, step: ImageCouncilStatus) => Promise<void>;
  selectArtifact: (projectId: string, runId: string, artifactId: string) => Promise<void>;
  refineArtifact: (projectId: string, runId: string, artifactId: string, prompt?: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  downloadArtifact: (artifact: ImageCouncilArtifact) => Promise<void>;
  clearError: () => void;
}

export const DEFAULT_IMAGE_COUNCIL_BRIEF = {
  aspectRatio: '1:1',
  stylePreset: 'auto',
} as const;

export const TERMINAL_IMAGE_COUNCIL_STATUSES = new Set<ImageCouncilStatus>([
  'completed', 'partial', 'failed', 'cancelled', 'quarantined',
]);
