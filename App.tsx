
import { useState, useRef, useEffect, FC, lazy, Suspense } from 'react';
import {
  AlertTriangle,
  CircleCheck,
  Shield,
} from "lucide-react";
import {
  DEFAULT_COUNCIL,
  DEFAULT_CHAIRMAN,
  USAGE_LIMITS,
} from "./constants";
import {
  CouncilResponse,
  WorkflowStage,
  SessionState,
  AppConfig,
} from "./types";
import { UnifiedCouncilService } from "./services/councilService";
import { MissionFlow } from "./components/mission";
import { PaywallModal } from "./components/PaywallModal";
const PricingPage = lazy(() => import("./components/PricingPage").then(m => ({ default: m.PricingPage })));
const AccountPage = lazy(() => import("./components/AccountPage").then(m => ({ default: m.AccountPage })));
const CookbookPage = lazy(() => import("./components/CookbookPage").then(m => ({ default: m.CookbookPage })));
const FAQPage = lazy(() => import("./components/FAQPage").then(m => ({ default: m.FAQPage })));
const ContactPage = lazy(() => import("./components/ContactPage").then(m => ({ default: m.ContactPage })));
const PrivacyPolicyPage = lazy(() => import("./components/PrivacyPolicyPage").then(m => ({ default: m.PrivacyPolicyPage })));
const TermsOfServicePage = lazy(() => import("./components/TermsOfServicePage").then(m => ({ default: m.TermsOfServicePage })));
const AiTermsPage = lazy(() => import("./components/AiTermsPage").then(m => ({ default: m.AiTermsPage })));
const CookieDeclarationPage = lazy(() => import("./components/CookieDeclarationPage").then(m => ({ default: m.CookieDeclarationPage })));
const ProcessingAgreementPage = lazy(() => import("./components/ProcessingAgreementPage").then(m => ({ default: m.ProcessingAgreementPage })));
import { DebateRoom } from "./components/DebateRoom";
import { ComparePage } from "./components/ComparePage";
const BestAIToolPage = lazy(() => import("./components/BestAIToolPage").then(m => ({ default: m.BestAIToolPage })));
const UseCaseLegalPage = lazy(() => import("./components/UseCaseLegalPage").then(m => ({ default: m.UseCaseLegalPage })));
const UseCaseMarketingPage = lazy(() => import("./components/UseCaseMarketingPage").then(m => ({ default: m.UseCaseMarketingPage })));
const UseCaseHRPage = lazy(() => import("./components/UseCaseHRPage").then(m => ({ default: m.UseCaseHRPage })));
const UseCaseFinancePage = lazy(() => import("./components/UseCaseFinancePage").then(m => ({ default: m.UseCaseFinancePage })));
const CompareVsChatGPTPage = lazy(() => import("./components/CompareVsChatGPTPage").then(m => ({ default: m.CompareVsChatGPTPage })));
const CompareMultiModelPage = lazy(() => import("./components/CompareMultiModelPage").then(m => ({ default: m.CompareMultiModelPage })));
const NewsPage = lazy(() => import("./components/NewsPage").then(m => ({ default: m.NewsPage })));
const SeoArticlePage = lazy(() => import("./components/SeoArticlePage").then(m => ({ default: m.SeoArticlePage })));
const NewsAdminPage = lazy(() => import("./components/NewsAdminPage").then(m => ({ default: m.NewsAdminPage })));
const AuthCallbackPage = lazy(() => import("./components/AuthCallbackPage").then(m => ({ default: m.AuthCallbackPage })));
const NotFoundPage = lazy(() => import("./components/NotFoundPage").then(m => ({ default: m.NotFoundPage })));
const InclusionPage = lazy(() => import("./components/InclusionPage").then(m => ({ default: m.InclusionPage })));
const ImageCouncilPage = lazy(() => import("./components/image-council/ImageCouncilPage").then(m => ({ default: m.ImageCouncilPage })));
import { Zap as ZapIcon } from "lucide-react";
import { supabase } from "./services/supabaseClient";
import {
  useNavigate,
  useLocation,
  Routes,
  Route,
} from "react-router-dom";
import { SEO } from "./components/SEO";
import { AdSenseLoader } from "./components/AdSenseLoader";
import { startCheckout } from "./services/payments";
const LoginPage = lazy(() => import("./components/LoginPage").then(m => ({ default: m.LoginPage })));
import { CookieConsent } from "./components/CookieConsent";
const LandingPage = lazy(() => import("./components/LandingPage").then(m => ({ default: m.LandingPage })));
import { useLanguage } from "./contexts/LanguageContext";
import { AppShell } from "./components/layout/AppShell";
import { ChatHome } from "./components/ChatHome";
import { ChatView } from "./components/chat/ChatView";
import { useAuth } from "./contexts/AuthContext";


// Helper components (parseVerdictScores, ScoreBar, FeedbackWidget, WaitTimeIndicator,
// JourneyStepper) have been extracted to components/mission/

const LogoSwitch: FC = () => (
  <img
    src="/fainllogo_new_ui.png"
    alt="FAINL"
    className="h-14 sm:h-16 md:h-20 w-auto max-w-[180px] sm:max-w-[240px] object-contain"
  />
);

const CyberLogo: FC<{ isAnimated?: boolean }> = ({ isAnimated = true }) => {
  return (
    <div className="relative w-10 h-10 md:w-12 md:h-12 flex items-center justify-center group overflow-visible">
      <div className="absolute inset-0 bg-white/10 dark:bg-white/5 rounded-full blur-xl group-hover:bg-white/20 transition-all duration-500 animate-pulse-glow" />
      {isAnimated && (
        <>
          <div className="absolute inset-x-0.5 inset-y-0.5 border border-white/20 rounded-full animate-orbit pointer-events-none" />
          <div className="absolute inset-x-2 inset-y-2 border border-white/10 dark:border-white/5 rounded-full animate-reverse-orbit pointer-events-none" />
        </>
      )}
      <div className="relative w-8 h-8 md:w-10 md:h-10 bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-xl border border-white/30 dark:border-white/20 flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:border-white/50 transition-all duration-500 overflow-hidden">
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,255,255,0.4)_0%,transparent_60%)] opacity-50 group-hover:opacity-80 transition-opacity" />
        <Shield className="text-white dark:text-white w-4 h-4 md:w-5 md:h-5 relative z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
      </div>
    </div>
  );
};

// Shown after Stripe redirects back from server-created Checkout Sessions.
const PaymentSuccessPage: FC = () => {
  const navigate = useNavigate();
  const { authSession, fetchProfile, profile } = useAuth();
  const params = new URLSearchParams(window.location.search);
  const hasCheckoutSession = params.has('checkout_session_id');

  useEffect(() => {
    if (!hasCheckoutSession || !authSession?.user?.id) return;

    const timers = [0, 2500, 7500].map((delay) =>
      window.setTimeout(() => {
        fetchProfile(authSession.user.id);
      }, delay)
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [authSession?.user?.id, fetchProfile, hasCheckoutSession]);

  return (
    <div className="max-w-xl mx-auto px-4 py-16 md:py-24 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
      <style>{`
        @keyframes success-glow {
          0%, 100% { box-shadow: 0 0 0px var(--action); }
          50% { box-shadow: 0 0 30px var(--action), 0 0 60px var(--action); }
        }
        .success-shimmer { animation: success-glow 1.5s ease-in-out 1; }
      `}</style>
      <div className="p-6 md:p-8 bg-white dark:bg-black border-2 md:border-4 border-black dark:border-[var(--line)] shadow-sm md:shadow-md success-shimmer">
        <div className="w-14 h-14 md:w-20 md:h-20 bg-[var(--action)] border-2 md:border-4 border-black flex items-center justify-center mx-auto mb-6 animate-in zoom-in-50 duration-500">
          <CircleCheck className="w-8 h-8 md:w-10 md:h-10 text-black" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-3 text-black dark:text-white">
          {hasCheckoutSession ? 'Betaling Ontvangen!' : 'Bedankt!'}
        </h1>
        <p className="font-bold text-black dark:text-white/80 mb-2 text-lg">
          {hasCheckoutSession
            ? 'Stripe verwerkt je aankoop. Je account wordt automatisch bijgewerkt zodra de webhook is ontvangen.'
            : 'Je betaling is verwerkt. Ga terug naar het dashboard om je account te bekijken.'}
        </p>
        {hasCheckoutSession && (
          <p className="text-sm font-bold text-black/50 dark:text-white/40 mb-6">
            {authSession?.user?.id
              ? `Huidige status: ${profile ? `${profile.credits_remaining} credits beschikbaar.` : 'profiel wordt geladen...'}`
              : 'Log opnieuw in als je credits niet direct zichtbaar zijn.'}
          </p>
        )}
        <p className="text-sm font-bold text-black/50 dark:text-white/40 uppercase tracking-widest mb-8">
          Je kunt terug naar Mijn FAINL zodra de verwerking klaar is.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 md:px-8 md:py-4 bg-black text-white font-black text-sm md:text-base uppercase tracking-widest hover:bg-[var(--action)] hover:text-black transition-all"
          >
            Naar Mijn FAINL's
        </button>
        <button
          type="button"
          onClick={() => navigate('/mission')}
          className="px-6 py-3 md:px-8 md:py-4 bg-black border-2 border-black text-white font-black text-sm md:text-base uppercase tracking-widest hover:shadow-[4px_4px_0_0_black] transition-all"
        >
          Nieuwe vraag stellen
        </button>
        </div>
      </div>
    </div>
  );
};

const App: FC = () => {
  const { t, language } = useLanguage();
  const { authSession, profile, fetchProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const rootSearchParams = new URLSearchParams(location.search);
  const hasAdFreeAccess = Boolean(
    profile?.is_lifetime ||
    profile?.ad_free_lifetime ||
    ['active', 'trialing'].includes(profile?.subscription_status || '')
  );
  const isRootAuthCallback =
    location.pathname === '/' &&
    (
      rootSearchParams.has('code') ||
      rootSearchParams.has('error') ||
      rootSearchParams.has('error_description')
    );

  const defaultConfig = {
    // API keys for proxied providers are stored server-side (Supabase Secrets).
    // Only user-configured local providers (Ollama, Custom) need keys here.
    googleKey:    '',
    openRouterKey: '',
    openaiKey:    '',
    anthropicKey: '',
    deepseekKey:  '',
    groqKey:      '',
    mistralKey:   '',
    customKey: '',
    mimoKey: '',
    devstralKey: '',
    katKey: '',
    olmoKey: '',
    nemotronKey: '',
    gemmaKey: '',
    glmKey: '',
    // App settings
    activeCouncil: DEFAULT_COUNCIL,
    customNodes: [] as any[],
    chairmanId: DEFAULT_CHAIRMAN.id,
    modelCount: 7 as 3 | 7,
    turnsUsed: 0,
    creditsRemaining: 0,
    isLifetime: false,
    totalTurnsAllowed: 2,
  };

  const normalizeConfig = (raw: any) => {
    const merged = { ...defaultConfig, ...(raw || {}) };
    return {
      ...merged,
      activeCouncil: (() => {
        if (!Array.isArray(merged.activeCouncil) || merged.activeCouncil.length === 0) return DEFAULT_COUNCIL;
        const defaultById = Object.fromEntries(DEFAULT_COUNCIL.map(m => [m.id, m]));
        const migrated = merged.activeCouncil.map((m: any) => defaultById[m.id] ? { ...m, ...defaultById[m.id] } : m);
        const hasAllDefaults = DEFAULT_COUNCIL.every(d => migrated.some((m: any) => m.id === d.id));
        if (!hasAllDefaults) return DEFAULT_COUNCIL;
        return migrated;
      })(),
      customNodes: Array.isArray(merged.customNodes) ? merged.customNodes : [],
      modelCount: merged.modelCount === 3 ? 3 : 7,
      turnsUsed: Number.isFinite(merged.turnsUsed) ? merged.turnsUsed : 0,
      creditsRemaining: Number.isFinite(merged.creditsRemaining) ? merged.creditsRemaining : 0,
      totalTurnsAllowed: Number.isFinite(merged.totalTurnsAllowed) ? merged.totalTurnsAllowed : 2,
      isLifetime: !!merged.isLifetime,
    };
  };

  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem("fainl_config_v2");
    if (!saved) return normalizeConfig(null) as AppConfig;
    if (saved.length > 100_000) return normalizeConfig(null) as AppConfig;
    try {
      return normalizeConfig(JSON.parse(saved)) as AppConfig;
    } catch {
      return normalizeConfig(null) as AppConfig;
    }
  });

  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  // Auto-start when navigating from the landing page hero input
  useEffect(() => {
    const state = location.state as { autoQuery?: string } | null;
    if (state?.autoQuery && location.pathname === '/mission') {
      const q = state.autoQuery;
      setInput(q);
      navigate('/mission', { replace: true, state: null });
      handleStart(q);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [showOutofCreditsUpsell, setShowOutofCreditsUpsell] = useState(false);
  const [inclusionStatus, setInclusionStatus] = useState<{ is_inclusion: boolean; remaining?: number; monthly_limit?: number } | null>(null);

  const authUserId = authSession?.user?.id;

  useEffect(() => {
    setInclusionStatus(null);
    syncCloudHistory(authUserId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUserId]);

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  // Cloud session history: one-time import of the legacy localStorage history,
  // then the cloud becomes the source of truth for logged-in users.
  const syncCloudHistory = async (userId?: string) => {
    if (!userId) return;
    try {
      if (!localStorage.getItem('fainl_history_imported')) {
        const saved = localStorage.getItem('fainl_history');
        const legacy: SessionState[] = saved ? JSON.parse(saved) : [];
        if (legacy.length) {
          const rows = legacy.map(s => {
            const id = UUID_RE.test(s.id) ? s.id : crypto.randomUUID();
            return {
              id,
              user_id: userId,
              query: s.query || '',
              synthesis: s.synthesis || '',
              data: { ...s, id },
              is_archived: !!s.isArchived,
              created_at: s.timestamp ? new Date(s.timestamp).toISOString() : new Date().toISOString(),
            };
          });
          await supabase.from('council_sessions').upsert(rows, { onConflict: 'id' });
        }
        localStorage.setItem('fainl_history_imported', '1');
      }

      const { data, error } = await supabase
        .from('council_sessions')
        .select('id, data, is_archived, created_at')
        .order('created_at', { ascending: false })
        .limit(200);
      if (!error && data) {
        setHistory(data.map(r => ({
          ...(r.data as SessionState),
          id: r.id,
          isArchived: r.is_archived,
        })));
      }
    } catch (e) {
      console.error('Cloud-sessiehistorie synchroniseren mislukt:', e);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const [history, setHistory] = useState<SessionState[]>(() => {
    const saved = localStorage.getItem('fainl_history');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return parsed.map((s: any) => ({
        ...s,
        id: s.id || crypto.randomUUID(),
        isArchived: !!s.isArchived
      }));
    } catch (e) {
      return [];
    }
  });

  const [input, setInput] = useState('');
  const [isDebateOpen, setIsDebateOpen] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const verdictRef = useRef<HTMLDivElement>(null);
  const processingStartRef = useRef<number>(Date.now());
  const councilRef = useRef<HTMLDivElement>(null);
  const debateChoiceRef = useRef<HTMLDivElement>(null);
  const compositionRef = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>, delay = 80) => {
    setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), delay);
  };
  const toggleCard = (memberId: string) => setExpandedCards(prev => {
    const next = new Set(prev);
    if (next.has(memberId)) next.delete(memberId); else next.add(memberId);
    return next;
  });
  const [isAnnouncementVisible, setIsAnnouncementVisible] = useState(() => {
    if (localStorage.getItem('fainl_visited')) return false;
    const h = localStorage.getItem('fainl_history');
    if (!h) return false;
    try { return JSON.parse(h).length > 0; } catch { return false; }
  });
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterState, setNewsletterState] = useState<'banner' | 'form' | 'submitting' | 'success'>('banner');

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterState('submitting');
    try {
      const { error } = await supabase.from('newsletter_subscribers').insert({
        email: newsletterEmail.trim().toLowerCase(),
        promo_code: 'promo_1T9tKD2Z8WgVHOZM0xJIa5Py',
        source: 'announcement_banner',
      });
      
      if (error) {
        if (error.code === '23505') {
          setNewsletterState('success');
        } else {
          alert(`Fout bij aanmelden: ${error.message}`);
          setNewsletterState('banner');
        }
        return;
      }
      
      setNewsletterState('success');
      localStorage.setItem('fainl_visited', '1');
    } catch (err: any) {
      alert(`Er ging iets mis: ${err.message}`);
      setNewsletterState('banner');
    }
  };

  const SESSION_RECOVERY_KEY = 'fainl_session_recovery';

  const [session, setSession] = useState<SessionState>({
    id: crypto.randomUUID(),
    stage: WorkflowStage.IDLE,
    query: '',
    councilResponses: [],
    debateMessages: [],
    reviews: [],
    synthesis: ''
  });

  // Recovery banner: shown when a previous in-progress session is found in localStorage
  const [recoverySession, setRecoverySession] = useState<SessionState | null>(() => {
    try {
      const saved = localStorage.getItem(SESSION_RECOVERY_KEY);
      if (!saved) return null;
      const parsed: SessionState = JSON.parse(saved);
      // Only offer recovery for sessions that have council responses (something to show)
      if (parsed.councilResponses?.length > 0 && parsed.stage !== WorkflowStage.IDLE) return parsed;
    } catch {}
    return null;
  });

  const councilService = useRef(new UnifiedCouncilService(config));

  useEffect(() => {
    councilService.current = new UnifiedCouncilService(config);
    localStorage.setItem('fainl_config_v2', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('fainl_history', JSON.stringify(history));
  }, [history]);

  // Auto-expand all council cards once all responses have arrived
  useEffect(() => {
    if (session.stage === WorkflowStage.DEBATE) {
      setExpandedCards(new Set(config.activeCouncil.map(m => m.id)));
    }
  }, [session.stage]);

  // Persist in-progress sessions to localStorage so they survive a page refresh
  useEffect(() => {
    if (session.stage === WorkflowStage.IDLE || session.stage === WorkflowStage.COMPLETED) {
      localStorage.removeItem(SESSION_RECOVERY_KEY);
      return;
    }
    const t = setTimeout(() => {
      try { localStorage.setItem(SESSION_RECOVERY_KEY, JSON.stringify(session)); } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [session]);

  const startSession = async (queryInput: string) => {
    const allMembers = config.activeCouncil;
    const readyMembers = councilService.current.getReadyMembers(allMembers);
    const membersToUse = readyMembers.length > 0 ? readyMembers : allMembers;

    if (membersToUse.length < 1) {
      setSession((prev: SessionState) => ({
        ...prev,
        stage: WorkflowStage.ERROR,
        error: "Er zijn geen raadsleden beschikbaar. Voeg minimaal één AI-model toe aan je raad via het dashboard.",
      }));
      return;
    }

    // All hosted models use one Edge Function. Check it before deducting a
    // credit, otherwise an unavailable Supabase project charges failed runs.
    try {
      await councilService.current.assertProxyAvailable();
    } catch (error) {
      setSession((prev: SessionState) => ({
        ...prev,
        stage: WorkflowStage.ERROR,
        error: error instanceof Error ? error.message : 'De AI-backend is onbereikbaar.',
      }));
      return;
    }

    // Deduct credit — inclusion users use inclusion credits, others use regular credits
    if (authSession?.user && inclusionStatus?.is_inclusion) {
      const { data: incData, error: incError } = await supabase.rpc('use_inclusion_credit', {
        p_user_id: authSession.user.id,
      });
      if (incError || !incData?.success) {
        setSession((prev: SessionState) => ({
          ...prev,
          stage: WorkflowStage.ERROR,
          error: incData?.error || "Inclusiecredits niet beschikbaar.",
        }));
        return;
      }
      setInclusionStatus(prev => prev ? { ...prev, remaining: incData.remaining } : prev);
    } else if (authSession?.user && profile) {
      const { data: rpcData, error: rpcError } = await supabase.rpc('deduct_credit', {
        p_user_id: authSession.user.id,
      });
      if (rpcError || !rpcData?.success) {
        setSession((prev: SessionState) => ({
          ...prev,
          stage: WorkflowStage.ERROR,
          error: "Onvoldoende credits om een sessie te starten.",
        }));
        return;
      }
      fetchProfile(authSession.user.id);
    } else {
      // Fallback local storage for backward compat edge cases, though handleStart blocks it.
      setConfig((current: AppConfig) => {
        if (current.creditsRemaining > 0) {
          return { ...current, creditsRemaining: current.creditsRemaining - USAGE_LIMITS.CREDITS_PER_TURN };
        } else {
          return { ...current, turnsUsed: current.turnsUsed + 1 };
        }
      });
    }

    processingStartRef.current = Date.now();
    setSession({
      id: crypto.randomUUID(),
      stage: WorkflowStage.PROCESSING_COUNCIL,
      query: queryInput,
      councilResponses: [],
      debateMessages: [],
      reviews: [],
      synthesis: ''
    });
    // Scroll to council cards as soon as they appear
    scrollTo(councilRef, 300);

    try {
      const responses = await councilService.current.getCouncilResponses(
        queryInput,
        membersToUse,
        (response) => {
          setSession((prev: SessionState) => ({
            ...prev,
            councilResponses: [...prev.councilResponses, response],
          }));
        }
      );

      const successfulResponses = responses.filter(response =>
        !/^\[(?:Error|Unauthorized|Skipped)\]/.test(response.content)
      );
      if (successfulResponses.length === 0) {
        setSession((prev: SessionState) => ({
          ...prev,
          stage: WorkflowStage.ERROR,
          error: 'Geen van de AI-modellen kon een analyse leveren. Probeer het opnieuw — soms zijn modellen tijdelijk onbereikbaar.'
        }));
        return;
      }

      // Stop at DEBATE stage — user chooses: Live Debate or direct Chairman's Verdict
      setSession((prev: SessionState) => ({
        ...prev,
        councilResponses: responses,
        stage: WorkflowStage.DEBATE,
        synthesis: '',
        debateMessages: []
      }));
      // Scroll to the choice buttons once all nodes are done
      scrollTo(debateChoiceRef, 150);

    } catch (err: any) {
      console.error(err);
      setSession((prev: SessionState) => ({
        ...prev,
        stage: WorkflowStage.ERROR,
        error: err.message || "Er ging iets mis tijdens de analyse. Probeer het opnieuw."
      }));
    }
  };

  const handleStart = async (queryOverride?: string) => {
    const queryToUse = queryOverride ?? input;
    if (!queryToUse.trim()) return;

    const currentCredits = profile ? profile.credits_remaining : config.creditsRemaining;
    const currentTurns = profile ? profile.total_turns_used : config.turnsUsed;
    const isLifetime = profile ? profile.is_lifetime : config.isLifetime;

    const hasCredits = currentCredits > 0;
    const hasTurnsRemaining = currentTurns < config.totalTurnsAllowed;
    const isInclusionUser = inclusionStatus?.is_inclusion && (inclusionStatus.remaining ?? 0) > 0;
    const isAllowed = isLifetime || isInclusionUser || hasTurnsRemaining || hasCredits;

    if (!isAllowed) {
      // After 2 free anonymous turns, force login/registration
      setIsPaywallOpen(true);
      return;
    }

    await startSession(queryToUse);
  };

  const handleCompose = async (composedText: string) => {
    setSession((prev: SessionState) => ({
      ...prev,
      userComposedResponse: composedText,
      stage: WorkflowStage.SYNTHESIZING
    }));
    await runSynthesis(session.query, session.councilResponses, session.debateMessages, composedText);
  };

  // Quick path: skip drag-and-drop, merge all compartments, go straight to Victor
  const handleQuickCompose = async () => {
    const CATS = ['STANDPUNT', 'ANALYSE', 'NUANCE', 'ADVIES'];
    const allText = session.councilResponses
      .flatMap(r => CATS.map(cat => r.sections?.[cat]).filter(Boolean))
      .join('\n\n');
    await handleCompose(allText || session.councilResponses.map(r => r.content).join('\n\n'));
  };

  // Single synthesis entry point — used by both "Get Verdict" and "After Debate"
  const runSynthesis = async (query: string, responses: CouncilResponse[], debateMsgs: import('./types').DebateMessage[], userComposed?: string) => {
    const readyForSynth = councilService.current.getReadyMembers(config.activeCouncil);
    const membersForSynth = readyForSynth.length > 0 ? readyForSynth : config.activeCouncil;
    setSession((prev: SessionState) => ({ ...prev, stage: WorkflowStage.SYNTHESIZING, synthesis: '' }));
    // Scroll verdict into view after a short tick so the DOM has updated
    setTimeout(() => { verdictRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); verdictRef.current?.focus(); }, 80);
    try {
      const synthesis = await councilService.current.synthesizeStream(
        query,
        responses,
        [],
        debateMsgs,
        membersForSynth,
        DEFAULT_CHAIRMAN,
        (chunk) => {
          setSession((prev: SessionState) => ({
            ...prev,
            synthesis: (prev.synthesis || '') + chunk
          }));
        },
        userComposed
      );
      setSession((prev: SessionState) => {
        const completedSession = { ...prev, synthesis, stage: WorkflowStage.COMPLETED, timestamp: Date.now() };
        setHistory((h: SessionState[]) => [completedSession, ...h]);
        const uid = authSession?.user?.id;
        if (uid) {
          supabase.from('council_sessions').insert({
            id: completedSession.id,
            user_id: uid,
            query: completedSession.query,
            synthesis: completedSession.synthesis,
            data: completedSession,
          }).then(({ error }) => { if (error) console.error('Sessie cloud-opslag mislukt:', error); });
        }
        return completedSession;
      });
      
      // Trigger Upsell if that was the last credit (and not on lifetime)
      const isNowZero = profile ? profile.credits_remaining === 0 : config.creditsRemaining === 0;
      const wasLifetime = profile ? profile.is_lifetime : config.isLifetime;
      const wasGreaterThanZeroBefore = profile ? (profile.credits_remaining + USAGE_LIMITS.CREDITS_PER_TURN > 0) : (config.creditsRemaining + USAGE_LIMITS.CREDITS_PER_TURN > 0);

      if (isNowZero && !wasLifetime && wasGreaterThanZeroBefore /* meaning it was > 0 before startSession */) {
          setTimeout(() => setShowOutofCreditsUpsell(true), 3000);
      }

    } catch (err: any) {
      console.error(err);
      setSession((prev: SessionState) => ({
        ...prev,
        stage: WorkflowStage.ERROR,
        error: err.message || "Het eindoordeel kon niet worden opgesteld. Probeer het opnieuw."
      }));
    }
  };

  const handleEndDebate = async (debateMessages: import('./types').DebateMessage[]) => {
    setIsDebateOpen(false);
    setSession((prev: SessionState) => ({ ...prev, debateMessages, stage: WorkflowStage.COMPOSITION }));
    scrollTo(compositionRef, 200);
  };

  const handleAddDebateMessage = (msg: import('./types').DebateMessage) => {
    setSession((prev: SessionState) => ({
      ...prev,
      debateMessages: [...prev.debateMessages, msg]
    }));
  };

  const requireLoginForCheckout = () => {
    if (!authSession?.user?.id) {
      navigate('/login?next=/tokens');
      return false;
    }
    return true;
  };

  const handlePurchaseTurns = async (count: number) => {
    if (!requireLoginForCheckout()) return;
    try {
      await startCheckout({ type: 'credits', count });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Checkout starten mislukt.");
    }
  };

  const handlePurchaseSubscription = async (plan: 'starter' | 'pro') => {
    if (!requireLoginForCheckout()) return;
    try {
      await startCheckout({ type: 'subscription', plan });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Checkout starten mislukt.");
    }
  };

  const handlePurchaseAdFree = async () => {
    if (!requireLoginForCheckout()) return;
    try {
      await startCheckout({ type: 'ad_free' });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Checkout starten mislukt.");
    }
  };

  const showContentAds = !Boolean((authSession && !profile) || hasAdFreeAccess);

  return (
    <AppShell>
      <AdSenseLoader disabled={!showContentAds} />

      {isAnnouncementVisible && newsletterState !== 'success' && (
        <div className="w-full bg-[var(--action)] text-black px-4 py-4 relative border-b-4 border-black">
          {newsletterState === 'banner' && (
            <div className="flex items-center justify-center gap-4 text-xl md:text-2xl font-black uppercase tracking-widest">
              <span>★</span>
              <span>15% korting op je eerste aankoop</span>
              <span className="text-black hidden sm:inline">—</span>
              <button
                type="button"
                onClick={() => setNewsletterState('form')}
                className="underline hover:text-white transition-colors hidden sm:inline"
              >
                Aanmelden voor nieuwsbrief
              </button>
            </div>
          )}
          {(newsletterState === 'form' || newsletterState === 'submitting') && (
            <form onSubmit={handleNewsletterSubmit} className="flex items-center justify-center gap-4 flex-wrap">
              <span className="text-black text-lg font-black uppercase tracking-widest whitespace-nowrap">★ 15% korting</span>
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={e => setNewsletterEmail(e.target.value)}
                placeholder="jouw@email.nl"
                className="bg-white border-4 border-black text-black placeholder-black/40 text-xl px-6 py-3 outline-none focus:shadow-[4px_4px_0_0_black] transition-all w-80"
              />
              <button
                type="submit"
                disabled={newsletterState === 'submitting'}
                className="bg-black text-white text-xl font-black uppercase tracking-widest px-8 py-3 hover:bg-white hover:text-black transition-colors disabled:opacity-60 border-4 border-black"
              >
                {newsletterState === 'submitting' ? '...' : 'Aanmelden'}
              </button>
            </form>
          )}
          <button
            type="button"
            onClick={() => {
              localStorage.setItem('fainl_visited', '1');
              setIsAnnouncementVisible(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/50 hover:text-white transition-colors"
            aria-label="Sluit aankondiging"
          >
            ✕
          </button>
        </div>
      )}
      {newsletterState === 'success' && (
        <div className="w-full bg-white text-black px-4 py-2.5 flex items-center justify-center gap-3 text-sm font-black uppercase tracking-widest relative">
          <span>✓ Aangemeld!</span>
          <span className="text-black">Jouw kortingscode:</span>
          <span className="bg-black text-white px-2 py-0.5 font-mono tracking-normal select-all">promo_1T9tKD2Z8WgVHOZM0xJIa5Py</span>
          <button
            type="button"
            onClick={() => setIsAnnouncementVisible(false)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-black hover:text-black transition-colors"
            aria-label="Sluit"
          >
            ✕
          </button>
        </div>
      )}

      <main id="main-content" className="flex-1 w-full min-w-0 flex flex-col">
        <Suspense fallback={<div className="flex items-center justify-center min-h-[40vh]"><div className="w-6 h-6 border-2 border-black/20 border-t-black dark:border-white/20 dark:border-t-white rounded-full animate-spin" /></div>}>
        <Routes>
          {/* Home — multi-turn chat (nodes werken samen achter Thinking) */}
          <Route path="/" element={isRootAuthCallback ? <AuthCallbackPage /> : <ChatView />} />
          <Route path="/chat/:threadId" element={<ChatView />} />
          <Route path="/beeldraad" element={<ImageCouncilPage />} />
          <Route path="/beeldraad/:projectId" element={<ImageCouncilPage />} />

          {/* Landing / Welcome page */}
          <Route path="/welcome" element={<LandingPage />} />

          {/* Mission / Chat Area */}
          <Route
            path="/mission"
            element={
              <>
                <SEO
                  title="Start AI Consensus Sessie — Stel jouw vraag"
                  description="Stel jouw vraag aan meerdere AI-modellen tegelijk. Gemini, GPT-4 en Claude analyseren parallel, debatteren live en geven één gewogen eindoordeel."
                  canonical="/mission"
                  keywords="AI vraag stellen, meerdere AI modellen, AI consensus sessie"
                  noIndex
                />
                <div className="session-wrap">
                  {session.stage === WorkflowStage.ERROR && (
                    <div className="error-center">
                      <div className="error-card animate-fade-in-up">
                        <AlertTriangle className="error-card__icon" />
                        <h3 className="error-card__title">Er ging iets mis</h3>
                        <p className="error-card__message">{session.error}</p>
                        <button
                          type="button"
                          onClick={() => setSession({ ...session, stage: WorkflowStage.IDLE })}
                          className="btn-send"
                        >
                          Opnieuw proberen
                        </button>
                      </div>
                    </div>
                  )}

                  {session.stage === WorkflowStage.IDLE ? (
                    <ChatHome
                      input={input}
                      onInputChange={setInput}
                      onSubmit={() => handleStart()}
                    />
                  ) : (
                    session.stage !== WorkflowStage.ERROR && (
                      <MissionFlow
                        session={session}
                        config={config}
                        chairman={DEFAULT_CHAIRMAN}
                        expandedCards={expandedCards}
                        processingStartedAt={processingStartRef.current}
                        isLoggedIn={!!authSession}
                        turnsUsed={profile ? profile.total_turns_used : config.turnsUsed}
                        councilRef={councilRef}
                        debateChoiceRef={debateChoiceRef}
                        compositionRef={compositionRef}
                        verdictRef={verdictRef}
                        onToggleCard={toggleCard}
                        onCancel={() => {
                          setInput(session.query);
                          setSession({ id: crypto.randomUUID(), stage: WorkflowStage.IDLE, query: '', councilResponses: [], debateMessages: [], reviews: [], synthesis: '' });
                        }}
                        onGetVerdict={handleQuickCompose}
                        onOpenDebate={() => setIsDebateOpen(true)}
                        onOpenComposition={() => { setSession(prev => ({ ...prev, stage: WorkflowStage.COMPOSITION })); scrollTo(compositionRef, 150); }}
                        onRestart={() => {
                          setInput(session.query);
                          setSession({ id: crypto.randomUUID(), stage: WorkflowStage.IDLE, query: '', councilResponses: [], debateMessages: [], reviews: [], synthesis: '' });
                        }}
                        onCompose={handleCompose}
                        onNewQuestion={() => {
                          setSession({ id: crypto.randomUUID(), stage: WorkflowStage.IDLE, query: '', councilResponses: [], debateMessages: [], reviews: [], synthesis: '' });
                          setInput('');
                          navigate('/');
                        }}
                        onCookbook={() => navigate('/cookbook')}
                        onLogin={() => navigate('/login')}
                      />
                    )
                  )}
                </div>
              </>
            }
          />



          {/* Kookboek */}
          <Route
            path="/cookbook"
            element={
              <CookbookPage
                onSelectMission={(query) => {
                  setInput(query);
                  setSession({
                    id: crypto.randomUUID(),
                    stage: WorkflowStage.IDLE,
                    query: '',
                    councilResponses: [],
                    debateMessages: [],
                    reviews: [],
                    synthesis: '',
                  });
                  navigate('/mission');
                }}
              />
            }
          />

          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={
              <AccountPage
                config={config}
                onUpdateConfig={(c) => setConfig(c)}
                history={history}
                onLoadSession={(s) => { setSession(s); navigate('/mission'); }}
                onDeleteSessions={(ids) => {
                  setHistory(h => h.filter(s => !ids.includes(s.id)));
                  if (authSession?.user?.id) {
                    supabase.from('council_sessions').delete().in('id', ids)
                      .then(({ error }) => { if (error) console.error('Sessies cloud-verwijderen mislukt:', error); });
                  }
                }}
                onArchiveSessions={(ids) => {
                  setHistory(h => h.map(s => ids.includes(s.id) ? { ...s, isArchived: true } : s));
                  if (authSession?.user?.id) {
                    supabase.from('council_sessions').update({ is_archived: true }).in('id', ids)
                      .then(({ error }) => { if (error) console.error('Sessies cloud-archiveren mislukt:', error); });
                  }
                }}
              />
            }
          />

          {/* Pricing / Tokens */}
          <Route
            path="/tokens"
            element={
              <PricingPage
                hasOwnKeys={profile ? profile.credits_remaining > 0 : config.creditsRemaining > 0}
                onPurchaseTurns={handlePurchaseTurns}
                onPurchaseCredits={handlePurchaseTurns}
                onPurchaseSubscription={handlePurchaseSubscription}
                onPurchaseAdFree={handlePurchaseAdFree}
              />
            }
          />

          {/* FAQ */}
          <Route path="/faq" element={<FAQPage />} />

          {/* Contact */}
          <Route path="/contact" element={<ContactPage />} />

          {/* Auth */}
          <Route path="/login" element={<LoginPage onLoginSuccess={() => navigate('/')} />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* Legal */}
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/ai-voorwaarden" element={<AiTermsPage />} />
          <Route path="/cookies" element={<CookieDeclarationPage />} />
          <Route path="/verwerkersovereenkomst" element={<ProcessingAgreementPage />} />

          {/* Inclusie */}
          <Route path="/inclusie" element={<InclusionPage />} />

          {/* Payment Success — Stripe redirects here after checkout */}
          <Route
            path="/payment-success"
            element={<PaymentSuccessPage />}
          />

          {/* Vergelijkingspagina's */}
          <Route path="/vergelijk/chatgpt-vs-gemini-vs-claude" element={<ComparePage />} />
          <Route path="/vergelijk/beste-ai-tool-nederland" element={<BestAIToolPage />} />

          {/* Use-case pagina's */}
          <Route path="/gebruik/juridisch-advies-ai" element={<UseCaseLegalPage />} />
          <Route path="/gebruik/marketing-strategie-ai" element={<UseCaseMarketingPage />} />
          <Route path="/gebruik/hr-recruitment-ai" element={<UseCaseHRPage />} />
          <Route path="/gebruik/financiele-analyse-ai" element={<UseCaseFinancePage />} />
          <Route path="/vergelijken/fainl-vs-chatgpt" element={<CompareVsChatGPTPage />} />
          <Route path="/vergelijken/ai-modellen-vergelijken" element={<CompareMultiModelPage />} />

          {/* AI nieuws, modelgidsen en content hubs */}
          <Route path="/nieuws" element={<NewsPage showAds={showContentAds} />} />
          <Route path="/nieuws/:slug" element={<SeoArticlePage section="nieuws" showAds={showContentAds} />} />
          <Route path="/vergelijken/:slug" element={<SeoArticlePage section="vergelijken" />} />
          <Route path="/modellen/:slug" element={<SeoArticlePage section="modellen" />} />
          <Route path="/tutorials/:slug" element={<SeoArticlePage section="tutorials" />} />
          <Route path="/infographics/:slug" element={<SeoArticlePage section="infographics" />} />
          <Route path="/admin/news" element={<NewsAdminPage />} />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </Suspense>
      </main>

      <PaywallModal
        isOpen={isPaywallOpen}
        hasOwnKeys={profile ? profile.credits_remaining > 0 : config.creditsRemaining > 0}
        onPurchaseTurns={handlePurchaseTurns}
        onClose={() => setIsPaywallOpen(false)}
        authSession={authSession}
      />


      {/* Upsell Modal when last credit is used */}
      {showOutofCreditsUpsell && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-4 animate-in fade-in duration-300">
           <div className="bg-white dark:bg-black border-2 md:border-4 border-black dark:border-[var(--line)]/40 rounded-none w-full max-w-lg shadow-lg md:shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="p-6 sm:p-10 md:p-16 text-center">
              <div className="w-16 h-16 md:w-24 md:h-24 bg-[var(--action)] mx-auto rounded-none flex items-center justify-center border-2 md:border-4 border-black mb-6 md:mb-10 shadow-[4px_4px_0_0_black] md:shadow-[8px_8px_0_0_black]">
                <ZapIcon className="w-8 h-8 md:w-12 md:h-12 text-black" />
              </div>
              <h3 className="text-2xl md:text-5xl font-black uppercase tracking-tighter text-black dark:text-white mb-3 md:mb-4">
                {language === 'nl' ? 'Dat was je laatste credit!' : 'That was your last credit!'}
              </h3>
              <p className="text-xl font-bold text-black dark:text-white/70 leading-relaxed mb-10">
                {language === 'nl' 
                  ? 'Je hebt zojuist je laatste premium FAINL vraag verbruikt. Tijd om op te waarderen voor je volgende diepe analyse?'
                  : 'You just used your last premium FAINL question. Time to recharge for your next deep analysis?'}
              </p>
              <div className="flex flex-col gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowOutofCreditsUpsell(false);
                    navigate('/tokens');
                  }}
                  className="w-full py-6 bg-black text-white dark:bg-[var(--action)] dark:text-black font-black text-xl uppercase tracking-widest rounded-none hover:scale-105 active:scale-95 transition-all shadow-lg border-4 border-black"
                >
                  {language === 'nl' ? 'Bekijk Pakketten' : 'View Packages'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowOutofCreditsUpsell(false)}
                  className="w-full py-4 bg-transparent text-black dark:text-white/40 hover:text-black dark:hover:text-[var(--ink)] font-black text-lg uppercase tracking-widest transition-colors"
                >
                  {language === 'nl' ? 'Nu niet, bedankt' : 'Not now, thanks'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <DebateRoom
        isOpen={isDebateOpen}
        session={session}
        config={config}
        councilService={councilService.current}
        onClose={() => setIsDebateOpen(false)}
        onEndDebate={handleEndDebate}
        onAddDebateMessage={handleAddDebateMessage}
      />

      <CookieConsent />
    </AppShell>
  );
};

export default App;
