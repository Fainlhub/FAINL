import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import {
  DEFAULT_IMAGE_COUNCIL_BRIEF,
  IMAGE_COUNCIL_ASPECT_RATIOS,
  IMAGE_COUNCIL_PIPELINE_STATUSES,
  IMAGE_COUNCIL_STYLE_PRESETS,
  ImageCouncilArtifact,
  ImageCouncilArtifactKind,
  ImageCouncilBranch,
  ImageCouncilBranchStatus,
  ImageCouncilCommandRequest,
  ImageCouncilEvaluation,
  ImageCouncilEvent,
  ImageCouncilProject,
  ImageCouncilProjectLifecycle,
  ImageCouncilProjectSnapshot,
  ImageCouncilRanking,
  ImageCouncilRun,
  ImageCouncilStatus,
  StartImageCouncilInput,
  StartImageCouncilResponse,
} from '../types/imageCouncil';

const TABLES = {
  projects: 'image_projects',
  runs: 'image_runs',
  branches: 'image_branches',
  artifacts: 'image_artifacts',
  evaluations: 'image_evaluations',
  rankings: 'image_rankings',
  events: 'image_events',
} as const;
const FUNCTIONS = { start: 'image-council-start', command: 'image-council-command' } as const;
const STORAGE_BUCKET = 'image-council';
const SIGNED_URL_TTL_SECONDS = 600;
type Row = Record<string, unknown>;

const record = (value: unknown): Row =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Row : {};
const string = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;
const nullableString = (value: unknown): string | null =>
  typeof value === 'string' && value.length > 0 ? value : null;
const number = (value: unknown): number | null => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

function pipelineStatus(value: unknown): ImageCouncilStatus {
  return IMAGE_COUNCIL_PIPELINE_STATUSES.includes(value as ImageCouncilStatus)
    ? value as ImageCouncilStatus
    : 'queued';
}

function lifecycleStatus(value: unknown): ImageCouncilProjectLifecycle {
  return ['active', 'archived', 'deletion_requested', 'purged'].includes(string(value))
    ? value as ImageCouncilProjectLifecycle
    : 'active';
}

function projectRow(value: unknown): ImageCouncilProject {
  const row = record(value);
  const brief = string(row.brief);
  const compact = brief.replace(/\s+/g, ' ').trim();
  return {
    id: string(row.id),
    userId: string(row.user_id),
    title: string(row.title, compact.slice(0, 56) || 'Naamloos beeldproject'),
    brief,
    lifecycleStatus: lifecycleStatus(row.lifecycle_status),
    selectedArtifactId: nullableString(row.selected_artifact_id),
    pinned: Boolean(row.pinned),
    latestRunId: null,
    pipelineStatus: null,
    createdAt: string(row.created_at, new Date(0).toISOString()),
    updatedAt: string(row.updated_at, string(row.created_at, new Date(0).toISOString())),
  };
}

function runRow(value: unknown): ImageCouncilRun {
  const row = record(value);
  const aspectRatio = string(row.aspect_ratio);
  const stylePreset = string(row.style_preset);
  return {
    id: string(row.id),
    userId: string(row.user_id),
    projectId: string(row.project_id),
    status: pipelineStatus(row.status),
    prompt: string(row.prompt),
    reservedCredits: number(row.reserved_credits),
    settledCredits: number(row.settled_credits),
    aspectRatio: IMAGE_COUNCIL_ASPECT_RATIOS.includes(aspectRatio as never)
      ? aspectRatio as ImageCouncilRun['aspectRatio'] : DEFAULT_IMAGE_COUNCIL_BRIEF.aspectRatio,
    stylePreset: IMAGE_COUNCIL_STYLE_PRESETS.includes(stylePreset as never)
      ? stylePreset as ImageCouncilRun['stylePreset'] : DEFAULT_IMAGE_COUNCIL_BRIEF.stylePreset,
    failureCode: nullableString(row.failure_code),
    failureStage: nullableString(row.failure_stage),
    failureDetail: nullableString(row.failure_detail),
    createdAt: string(row.created_at, new Date(0).toISOString()),
    startedAt: nullableString(row.started_at),
    completedAt: nullableString(row.completed_at),
  };
}

function branchRow(value: unknown): ImageCouncilBranch {
  const row = record(value);
  const status = string(row.status);
  return {
    id: string(row.id),
    userId: string(row.user_id),
    projectId: string(row.project_id),
    runId: string(row.run_id),
    modelCatalogId: string(row.model_catalog_id),
    ordinal: number(row.ordinal) ?? 0,
    status: ['queued', 'generating', 'completed', 'failed', 'cancel_requested', 'cancelled', 'quarantined'].includes(status)
      ? status as ImageCouncilBranchStatus : 'queued',
    failureCode: nullableString(row.failure_code),
    failureDetail: nullableString(row.failure_detail),
    createdAt: string(row.created_at, new Date(0).toISOString()),
  };
}

function evaluationRow(value: unknown): ImageCouncilEvaluation {
  const row = record(value);
  return {
    id: string(row.id),
    runId: string(row.run_id),
    artifactId: string(row.artifact_id),
    evaluatorModelCatalogId: string(row.evaluator_model_catalog_id),
    evaluator: string(row.evaluator),
    round: number(row.round) ?? 1,
    criteria: record(row.criteria),
    argumentation: string(row.argumentation),
    confidence: number(row.confidence) ?? 0,
    createdAt: string(row.created_at, new Date(0).toISOString()),
  };
}

function rankingRow(value: unknown): ImageCouncilRanking {
  const row = record(value);
  return {
    id: string(row.id),
    runId: string(row.run_id),
    evaluatorModelCatalogId: string(row.evaluator_model_catalog_id),
    evaluator: string(row.evaluator),
    round: number(row.round) ?? 1,
    rank1ArtifactId: string(row.rank_1_artifact_id),
    rank2ArtifactId: nullableString(row.rank_2_artifact_id),
    rank3ArtifactId: nullableString(row.rank_3_artifact_id),
    argumentation: string(row.argumentation),
    confidence: number(row.confidence) ?? 0,
    createdAt: string(row.created_at, new Date(0).toISOString()),
  };
}

function eventRow(value: unknown): ImageCouncilEvent {
  const row = record(value);
  return {
    id: string(row.id),
    projectId: string(row.project_id),
    runId: string(row.run_id),
    artifactId: nullableString(row.artifact_id),
    eventType: string(row.event_type),
    payload: record(row.payload),
    occurredAt: string(row.occurred_at, new Date(0).toISOString()),
  };
}

function artifactRanking(
  artifactId: string,
  rankings: ImageCouncilRanking[],
): { rank: number | null; confidence: number | null; rationale: string | null } {
  if (!rankings.length) return { rank: null, confidence: null, rationale: null };
  const latestRound = Math.max(...rankings.map((ranking) => ranking.round));
  const positions = rankings.filter((ranking) => ranking.round === latestRound).flatMap((ranking) => {
    if (ranking.rank1ArtifactId === artifactId) return [{ position: 1, ranking }];
    if (ranking.rank2ArtifactId === artifactId) return [{ position: 2, ranking }];
    if (ranking.rank3ArtifactId === artifactId) return [{ position: 3, ranking }];
    return [];
  });
  if (!positions.length) return { rank: null, confidence: null, rationale: null };
  return {
    rank: Math.round(positions.reduce((sum, item) => sum + item.position, 0) / positions.length),
    confidence: positions.reduce((sum, item) => sum + item.ranking.confidence, 0) / positions.length,
    rationale: positions.map((item) => item.ranking.argumentation).find(Boolean) ?? null,
  };
}

function artifactRow(
  value: unknown,
  evaluations: ImageCouncilEvaluation[],
  rankings: ImageCouncilRanking[],
): ImageCouncilArtifact {
  const row = record(value);
  const id = string(row.id);
  const relevantEvaluations = evaluations.filter((evaluation) => evaluation.artifactId === id);
  const ranked = artifactRanking(id, rankings);
  const kind = string(row.kind);
  return {
    id,
    userId: string(row.user_id),
    projectId: string(row.project_id),
    runId: string(row.run_id),
    branchId: nullableString(row.branch_id),
    modelCatalogId: string(row.model_catalog_id),
    kind: ['original', 'refinement', 'finalist', 'thumbnail'].includes(kind)
      ? kind as ImageCouncilArtifactKind : 'original',
    parentArtifactId: nullableString(row.parent_artifact_id),
    version: number(row.version) ?? 1,
    storagePath: string(row.storage_path),
    mimeType: string(row.mime_type, 'image/png'),
    checksumSha256: string(row.checksum_sha256),
    width: number(row.width_px) ?? 1,
    height: number(row.height_px) ?? 1,
    byteSize: number(row.byte_size),
    metadata: record(row.metadata),
    rank: ranked.rank,
    confidence: ranked.confidence,
    rankingRationale: ranked.rationale,
    evaluations: relevantEvaluations,
    critique: relevantEvaluations.map((evaluation) => evaluation.argumentation).find(Boolean) ?? null,
    createdAt: string(row.created_at, new Date(0).toISOString()),
  };
}

function apiError(data: unknown, fallback: string): Error {
  const root = record(data);
  return new Error(string(record(root.error).message ?? root.message, fallback));
}

async function requireOwner(userId: string): Promise<void> {
  const { data, error } = await supabase.auth.getUser();
  if (error || data.user?.id !== userId) throw new Error('Log opnieuw in om Beeldraad te gebruiken.');
}

export async function fetchImageCouncilProjects(userId: string): Promise<ImageCouncilProject[]> {
  await requireOwner(userId);
  const [projectsResult, runsResult] = await Promise.all([
    supabase.from(TABLES.projects).select('*').eq('user_id', userId)
      .neq('lifecycle_status', 'purged')
      .order('pinned', { ascending: false }).order('updated_at', { ascending: false }).limit(100),
    supabase.from(TABLES.runs).select('*').eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(200),
  ]);
  if (projectsResult.error) throw projectsResult.error;
  if (runsResult.error) throw runsResult.error;
  const latestRuns = new Map<string, ImageCouncilRun>();
  for (const row of runsResult.data ?? []) {
    const run = runRow(row);
    if (!latestRuns.has(run.projectId)) latestRuns.set(run.projectId, run);
  }
  return (projectsResult.data ?? []).map((row) => {
    const project = projectRow(row);
    const run = latestRuns.get(project.id);
    return { ...project, latestRunId: run?.id ?? null, pipelineStatus: run?.status ?? null };
  });
}

export async function fetchImageCouncilProjectSnapshot(
  userId: string,
  projectId: string,
): Promise<ImageCouncilProjectSnapshot> {
  await requireOwner(userId);
  const projectResult = await supabase.from(TABLES.projects).select('*')
    .eq('id', projectId).eq('user_id', userId).maybeSingle();
  if (projectResult.error) throw projectResult.error;
  if (!projectResult.data) throw new Error('Dit beeldproject bestaat niet of is niet toegankelijk.');
  const runsResult = await supabase.from(TABLES.runs).select('*')
    .eq('project_id', projectId).eq('user_id', userId)
    .order('created_at', { ascending: false }).limit(1);
  if (runsResult.error) throw runsResult.error;
  const rawRun = runsResult.data?.[0];
  if (!rawRun) {
    const project = projectRow(projectResult.data);
    return { project, run: null, branches: [], artifacts: [], events: [], selectedArtifactId: project.selectedArtifactId };
  }
  const run = runRow(rawRun);
  const [branches, artifacts, evaluations, rankings, events] = await Promise.all([
    supabase.from(TABLES.branches).select('*').eq('run_id', run.id).eq('user_id', userId).order('ordinal'),
    supabase.from(TABLES.artifacts).select('*').eq('run_id', run.id).eq('user_id', userId).order('created_at'),
    supabase.from(TABLES.evaluations).select('*').eq('run_id', run.id).eq('user_id', userId).order('created_at'),
    supabase.from(TABLES.rankings).select('*').eq('run_id', run.id).eq('user_id', userId).order('round', { ascending: false }),
    supabase.from(TABLES.events).select('*').eq('run_id', run.id).eq('user_id', userId).order('occurred_at'),
  ]);
  for (const result of [branches, artifacts, evaluations, rankings, events]) {
    if (result.error) throw result.error;
  }
  const mappedEvaluations = (evaluations.data ?? []).map(evaluationRow);
  const mappedRankings = (rankings.data ?? []).map(rankingRow);
  const project = {
    ...projectRow(projectResult.data),
    latestRunId: run.id,
    pipelineStatus: run.status,
  };
  return {
    project,
    run,
    branches: (branches.data ?? []).map(branchRow),
    artifacts: (artifacts.data ?? []).map((row) => artifactRow(row, mappedEvaluations, mappedRankings)),
    events: (events.data ?? []).map(eventRow),
    selectedArtifactId: project.selectedArtifactId,
  };
}

export async function startImageCouncilProject(
  userId: string,
  input: StartImageCouncilInput,
): Promise<StartImageCouncilResponse> {
  await requireOwner(userId);
  const { data, error } = await supabase.functions.invoke(FUNCTIONS.start, {
    body: input,
    headers: { 'idempotency-key': input.clientRequestId },
  });
  if (error) throw apiError(data, error.message || 'Beeldraad kon niet worden gestart.');
  const response = record(data);
  if (!string(response.projectId) || !string(response.runId) ||
      response.status !== 'queued' || response.reservedCredits !== 9) {
    throw apiError(data, 'De server gaf een ongeldig startantwoord terug.');
  }
  return response as unknown as StartImageCouncilResponse;
}

export async function sendImageCouncilCommand(
  userId: string,
  request: ImageCouncilCommandRequest,
): Promise<void> {
  await requireOwner(userId);
  const { data, error } = await supabase.functions.invoke(FUNCTIONS.command, {
    body: request,
    headers: { 'idempotency-key': request.clientRequestId },
  });
  if (error) throw apiError(data, error.message || 'De opdracht kon niet worden uitgevoerd.');
}

export async function createImageCouncilSignedUrl(
  path: string,
  width?: number,
): Promise<string> {
  const bucket = supabase.storage.from(STORAGE_BUCKET);
  const { data, error } = await bucket
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS, width ? {
      transform: {
        width,
        resize: 'contain',
        quality: 82,
      },
    } : undefined);
  if (error && width) {
    const fallback = await bucket.createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
    if (fallback.error) throw fallback.error;
    return fallback.data.signedUrl;
  }
  if (error) throw error;
  return data.signedUrl;
}

export async function downloadImageCouncilArtifact(artifact: ImageCouncilArtifact): Promise<void> {
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).download(artifact.storagePath);
  if (error) throw error;
  const url = URL.createObjectURL(data);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `beeldraad-${artifact.kind}-v${artifact.version}.${artifact.mimeType.split('/')[1] || 'png'}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function subscribeToImageCouncilProject(
  projectId: string,
  runId: string | null,
  onChange: () => void,
): () => void {
  let timer: number | null = null;
  const notify = () => {
    if (timer !== null) window.clearTimeout(timer);
    timer = window.setTimeout(onChange, 120);
  };
  let channel: RealtimeChannel = supabase.channel(`image-council:${projectId}:${crypto.randomUUID()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.projects, filter: `id=eq.${projectId}` }, notify)
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.runs, filter: `project_id=eq.${projectId}` }, notify);
  if (runId) {
    for (const table of [TABLES.branches, TABLES.artifacts, TABLES.evaluations, TABLES.rankings, TABLES.events]) {
      channel = channel.on('postgres_changes', { event: '*', schema: 'public', table, filter: `run_id=eq.${runId}` }, notify);
    }
  }
  channel.subscribe();
  return () => {
    if (timer !== null) window.clearTimeout(timer);
    void supabase.removeChannel(channel);
  };
}
