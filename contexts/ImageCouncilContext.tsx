import {
  FC,
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAuth } from './AuthContext';
import {
  downloadImageCouncilArtifact,
  fetchImageCouncilProjectSnapshot,
  fetchImageCouncilProjects,
  sendImageCouncilCommand,
  startImageCouncilProject,
  subscribeToImageCouncilProject,
} from '../services/imageCouncilService';
import {
  ImageCouncilArtifact,
  ImageCouncilBranch,
  ImageCouncilCommand,
  ImageCouncilContextValue,
  ImageCouncilEvent,
  ImageCouncilProject,
  ImageCouncilRun,
  ImageCouncilStatus,
  StartImageCouncilInput,
  StartImageCouncilResponse,
} from '../types/imageCouncil';

const ImageCouncilContext = createContext<ImageCouncilContextValue | undefined>(undefined);
const POLL_FALLBACK_MS = 10_000;

function readableError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Er ging iets mis. Probeer het opnieuw.';
}

export const ImageCouncilProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { authSession } = useAuth();
  const userId = authSession?.user?.id ?? null;
  const activeProjectIdRef = useRef<string | null>(null);
  const projectRequestRef = useRef(0);

  const [projects, setProjects] = useState<ImageCouncilProject[]>([]);
  const [activeProject, setActiveProject] = useState<ImageCouncilProject | null>(null);
  const [activeRun, setActiveRun] = useState<ImageCouncilRun | null>(null);
  const [branches, setBranches] = useState<ImageCouncilBranch[]>([]);
  const [artifacts, setArtifacts] = useState<ImageCouncilArtifact[]>([]);
  const [events, setEvents] = useState<ImageCouncilEvent[]>([]);
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [pendingCommand, setPendingCommand] = useState<ImageCouncilCommand | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const resetActiveState = useCallback(() => {
    setActiveProject(null);
    setActiveRun(null);
    setBranches([]);
    setArtifacts([]);
    setEvents([]);
    setSelectedArtifactId(null);
  }, []);

  const mergeProject = useCallback((project: ImageCouncilProject) => {
    setProjects((current) => {
      const next = [project, ...current.filter((item) => item.id !== project.id)];
      return next.sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
      );
    });
  }, []);

  const refreshProjects = useCallback(async () => {
    if (!userId) {
      setProjects([]);
      return;
    }
    setIsLoadingProjects(true);
    try {
      setProjects(await fetchImageCouncilProjects(userId));
    } catch (nextError) {
      setError(readableError(nextError));
    } finally {
      setIsLoadingProjects(false);
    }
  }, [userId]);

  const refreshActiveProject = useCallback(async (
    projectId: string,
    showLoading = false,
  ) => {
    if (!userId || activeProjectIdRef.current !== projectId) return;
    const requestId = ++projectRequestRef.current;
    if (showLoading) setIsLoadingProject(true);
    try {
      const snapshot = await fetchImageCouncilProjectSnapshot(userId, projectId);
      if (
        requestId !== projectRequestRef.current ||
        activeProjectIdRef.current !== projectId
      ) return;
      setActiveProject(snapshot.project);
      setActiveRun(snapshot.run);
      setBranches(snapshot.branches);
      setArtifacts(snapshot.artifacts);
      setEvents(snapshot.events);
      setSelectedArtifactId(snapshot.selectedArtifactId);
      mergeProject(snapshot.project);
      setError(null);
    } catch (nextError) {
      if (
        requestId === projectRequestRef.current &&
        activeProjectIdRef.current === projectId
      ) {
        resetActiveState();
        setError(readableError(nextError));
      }
    } finally {
      if (requestId === projectRequestRef.current && showLoading) {
        setIsLoadingProject(false);
      }
    }
  }, [mergeProject, resetActiveState, userId]);

  const openProject = useCallback(async (projectId: string) => {
    if (!userId) {
      activeProjectIdRef.current = null;
      resetActiveState();
      return;
    }
    activeProjectIdRef.current = projectId;
    resetActiveState();
    setError(null);
    await refreshActiveProject(projectId, true);
  }, [refreshActiveProject, resetActiveState, userId]);

  const clearActiveProject = useCallback(() => {
    activeProjectIdRef.current = null;
    projectRequestRef.current += 1;
    resetActiveState();
    setIsLoadingProject(false);
    setError(null);
  }, [resetActiveState]);

  const startProject = useCallback(async (
    input: StartImageCouncilInput,
  ): Promise<StartImageCouncilResponse> => {
    if (!userId) throw new Error('Log in om een beeldproject te starten.');
    setIsStarting(true);
    setError(null);
    try {
      const response = await startImageCouncilProject(userId, input);
      await refreshProjects();
      return response;
    } catch (nextError) {
      setError(readableError(nextError));
      throw nextError;
    } finally {
      setIsStarting(false);
    }
  }, [refreshProjects, userId]);

  const runCommand = useCallback(async (
    command: ImageCouncilCommand,
    fields: Omit<Parameters<typeof sendImageCouncilCommand>[1], 'command' | 'clientRequestId'>,
  ) => {
    if (!userId) throw new Error('Log opnieuw in om deze opdracht uit te voeren.');
    setPendingCommand(command);
    setError(null);
    try {
      await sendImageCouncilCommand(userId, {
        ...fields,
        command,
        clientRequestId: crypto.randomUUID(),
      });
      if (activeProjectIdRef.current === fields.projectId) {
        await refreshActiveProject(fields.projectId);
      }
      await refreshProjects();
    } catch (nextError) {
      setError(readableError(nextError));
      throw nextError;
    } finally {
      setPendingCommand(null);
    }
  }, [refreshActiveProject, refreshProjects, userId]);

  const cancelRun = useCallback(
    (projectId: string, runId: string) =>
      runCommand('cancel_run', { projectId, runId }),
    [runCommand],
  );

  const retryStep = useCallback(
    (projectId: string, runId: string, step: ImageCouncilStatus) =>
      runCommand('retry_step', { projectId, runId, step }),
    [runCommand],
  );

  const selectArtifact = useCallback(
    (projectId: string, runId: string, artifactId: string) =>
      runCommand('select_artifact', { projectId, runId, artifactId }),
    [runCommand],
  );

  const refineArtifact = useCallback((
    projectId: string,
    runId: string,
    artifactId: string,
    prompt?: string,
  ) => runCommand('refine_artifact', {
    projectId,
    runId,
    artifactId,
    ...(prompt?.trim() ? { prompt: prompt.trim() } : {}),
  }), [runCommand]);

  const deleteProject = useCallback(async (projectId: string) => {
    await runCommand('delete_project', { projectId });
    setProjects((current) => current.filter((project) => project.id !== projectId));
    if (activeProjectIdRef.current === projectId) clearActiveProject();
  }, [clearActiveProject, runCommand]);

  const downloadArtifact = useCallback(async (artifact: ImageCouncilArtifact) => {
    setError(null);
    try {
      await downloadImageCouncilArtifact(artifact);
    } catch (nextError) {
      setError(readableError(nextError));
      throw nextError;
    }
  }, []);

  useEffect(() => {
    projectRequestRef.current += 1;
    activeProjectIdRef.current = null;
    resetActiveState();
    setError(null);
    if (userId) void refreshProjects();
    else setProjects([]);
  }, [refreshProjects, resetActiveState, userId]);

  useEffect(() => {
    const projectId = activeProject?.id;
    if (!userId || !projectId || activeProjectIdRef.current !== projectId) return;
    const unsubscribe = subscribeToImageCouncilProject(
      projectId,
      activeRun?.id ?? null,
      () => void refreshActiveProject(projectId),
    );
    const intervalId = window.setInterval(
      () => void refreshActiveProject(projectId),
      POLL_FALLBACK_MS,
    );
    return () => {
      unsubscribe();
      window.clearInterval(intervalId);
    };
  }, [activeProject?.id, activeRun?.id, refreshActiveProject, userId]);

  const value = useMemo<ImageCouncilContextValue>(() => ({
    projects,
    activeProject,
    activeRun,
    branches,
    artifacts,
    events,
    selectedArtifactId,
    isLoadingProjects,
    isLoadingProject,
    isStarting,
    pendingCommand,
    error,
    refreshProjects,
    openProject,
    clearActiveProject,
    startProject,
    cancelRun,
    retryStep,
    selectArtifact,
    refineArtifact,
    deleteProject,
    downloadArtifact,
    clearError,
  }), [
    activeProject,
    activeRun,
    artifacts,
    branches,
    cancelRun,
    clearActiveProject,
    clearError,
    deleteProject,
    downloadArtifact,
    error,
    events,
    isLoadingProject,
    isLoadingProjects,
    isStarting,
    openProject,
    pendingCommand,
    projects,
    refreshProjects,
    refineArtifact,
    retryStep,
    selectArtifact,
    selectedArtifactId,
    startProject,
  ]);

  return (
    <ImageCouncilContext.Provider value={value}>
      {children}
    </ImageCouncilContext.Provider>
  );
};

export function useImageCouncil(): ImageCouncilContextValue {
  const context = useContext(ImageCouncilContext);
  if (!context) {
    throw new Error('useImageCouncil must be used within an ImageCouncilProvider');
  }
  return context;
}
