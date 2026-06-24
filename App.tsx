
import { useState, useRef, useEffect, FC, lazy, Suspense } from 'react';
import {
  Users,
  MessageSquare,
  Gavel,
  ArrowRight,
  Loader2,
  Shield,
  AlertTriangle,
  CircleCheck,
  Swords,
  PenLine,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
  DEFAULT_COUNCIL,
  DEFAULT_CHAIRMAN,
  USAGE_LIMITS,
  PRICING,
} from "./constants";
import {
  CouncilResponse,
  PeerReview,
  WorkflowStage,
  SessionState,
  AppConfig,
  ModelProvider,
} from "./types";
import { UnifiedCouncilService } from "./services/councilService";
import { CouncilCard } from "./components/CouncilCard";
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
import { DebateRoom } from "./components/DebateRoom";
import { CompositionStage } from "./components/CompositionStage";
import { ComparePage } from "./components/ComparePage";
const BestAIToolPage = lazy(() => import("./components/BestAIToolPage").then(m => ({ default: m.BestAIToolPage })));
const UseCaseLegalPage = lazy(() => import("./components/UseCaseLegalPage").then(m => ({ default: m.UseCaseLegalPage })));
const UseCaseMarketingPage = lazy(() => import("./components/UseCaseMarketingPage").then(m => ({ default: m.UseCaseMarketingPage })));
const UseCaseHRPage = lazy(() => import("./components/UseCaseHRPage").then(m => ({ default: m.UseCaseHRPage })));
const UseCaseFinancePage = lazy(() => import("./components/UseCaseFinancePage").then(m => ({ default: m.UseCaseFinancePage })));
const CompareVsChatGPTPage = lazy(() => import("./components/CompareVsChatGPTPage").then(m => ({ default: m.CompareVsChatGPTPage })));
const CompareMultiModelPage = lazy(() => import("./components/CompareMultiModelPage").then(m => ({ default: m.CompareMultiModelPage })));
const AuthCallbackPage = lazy(() => import("./components/AuthCallbackPage").then(m => ({ default: m.AuthCallbackPage })));
const NotFoundPage = lazy(() => import("./components/NotFoundPage").then(m => ({ default: m.NotFoundPage })));
import {
  Menu,
  X as CloseIcon,
  LayoutDashboard,
  Coins,
  BookOpen,
  HelpCircle,
  Mail,
  Zap as ZapIcon,
} from "lucide-react";
import { supabase } from "./services/supabaseClient";
import {
  useNavigate,
  useLocation,
  Routes,
  Route,
  Link,
} from "react-router-dom";
import { SEO } from "./components/SEO";
const LoginPage = lazy(() => import("./components/LoginPage").then(m => ({ default: m.LoginPage })));
import { Session } from "@supabase/supabase-js";
import { LogOut } from "lucide-react";
import { CookieConsent } from "./components/CookieConsent";
const LandingPage = lazy(() => import("./components/LandingPage").then(m => ({ default: m.LandingPage })));
import { useLanguage } from "./contexts/LanguageContext";
import { AppShell } from "./components/layout/AppShell";
import { ChatHome } from "./components/ChatHome";


// ─── Score Parser & Display ──────────────────────────────────────────────────
const parseVerdictScores = (text: string): { consensus: number | null; confidence: number | null; cleanText: string } => {
  let consensus: number | null = null;
  let confidence: number | null = null;
  let cleanText = text;
  const consensusMatch = cleanText.match(/<CONSENSUS_SCORE>(\d{1,3})<\/CONSENSUS_SCORE>/);
  if (consensusMatch) {
    consensus = Math.min(100, Math.max(0, parseInt(consensusMatch[1], 10)));
    cleanText = cleanText.replace(consensusMatch[0], '');
  }
  const confidenceMatch = cleanText.match(/<CONFIDENCE_SCORE>(\d{1,3})<\/CONFIDENCE_SCORE>/);
  if (confidenceMatch) {
    confidence = Math.min(100, Math.max(0, parseInt(confidenceMatch[1], 10)));
    cleanText = cleanText.replace(confidenceMatch[0], '');
  }
  return { consensus, confidence, cleanText: cleanText.trimStart() };
};

const ScoreBar: FC<{ label: string; value: number; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="flex-1 min-w-[140px]">
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <span className="text-xs font-black uppercase tracking-widest text-black/60 dark:text-white/50">{label}</span>
      <span className="ml-auto text-sm font-black text-black dark:text-white">{value}%</span>
    </div>
    <div className="h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
      <div
        className="h-full bg-[var(--action)] rounded-full transition-all duration-1000 ease-out"
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

// ─── Feedback Widget ─────────────────────────────────────────────────────────
const FeedbackWidget: FC<{ sessionId: string }> = ({ sessionId }) => {
  const [state, setState] = useState<'idle' | 'negative' | 'submitted'>('idle');
  const [comment, setComment] = useState('');

  const submit = async (positive: boolean, text?: string) => {
    setState('submitted');
    try {
      await supabase.from('session_feedback').insert({
        session_id: sessionId,
        positive,
        comment: text || null,
      });
    } catch {}
  };

  if (state === 'submitted') {
    return (
      <p className="text-xs font-bold text-black/50 dark:text-white/40 text-center py-2 animate-in fade-in duration-300">
        Bedankt voor je feedback!
      </p>
    );
  }

  if (state === 'negative') {
    return (
      <div className="flex flex-col items-center gap-2 py-2 animate-in fade-in duration-300">
        <p className="text-xs font-bold text-black/60 dark:text-white/50">Wat kan er beter?</p>
        <div className="flex gap-2 w-full max-w-sm">
          <input
            type="text"
            maxLength={200}
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Optioneel..."
            className="flex-1 px-3 py-2 text-xs border-2 border-black/15 dark:border-white/15 bg-white dark:bg-black text-black dark:text-white rounded-none outline-none focus:border-black dark:focus:border-white transition-colors"
          />
          <button
            type="button"
            onClick={() => submit(false, comment)}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-xs font-black uppercase tracking-widest hover:bg-[var(--action)] hover:text-black transition-colors"
          >
            Verstuur
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-4 py-2">
      <span className="text-xs font-bold text-black/50 dark:text-white/40">Was dit oordeel nuttig?</span>
      <button
        type="button"
        onClick={() => submit(true)}
        className="p-2 hover:bg-green-50 dark:hover:bg-green-900/20 text-black/40 dark:text-white/30 hover:text-green-600 dark:hover:text-green-400 transition-colors rounded-full"
        aria-label="Nuttig"
      >
        <ThumbsUp className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => setState('negative')}
        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-black/40 dark:text-white/30 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-full"
        aria-label="Niet nuttig"
      >
        <ThumbsDown className="w-4 h-4" />
      </button>
    </div>
  );
};

// ─── Wait Time Indicator ─────────────────────────────────────────────────────
const WaitTimeIndicator: FC<{ startedAt: number }> = ({ startedAt }) => {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  if (elapsed < 5) return <span className="text-[10px] font-bold text-black/30 dark:text-white/20">Gemiddeld 8–15 seconden</span>;
  if (elapsed < 30) return <span className="text-[10px] font-bold text-black/30 dark:text-white/20">Gemiddeld 8–15 seconden · {elapsed}s</span>;
  if (elapsed < 60) return <span className="text-[10px] font-bold text-amber-600/70 dark:text-amber-400/60">Even geduld — complexe vragen kosten meer tijd · {elapsed}s</span>;
  return <span className="text-[10px] font-bold text-red-500/70">Dit duurt langer dan verwacht · {elapsed}s</span>;
};

// ─── Journey Progress Stepper ────────────────────────────────────────────────
const JOURNEY_STEPS: { label: string; stages: WorkflowStage[] }[] = [
  { label: 'Analyse',    stages: [WorkflowStage.PROCESSING_COUNCIL] },
  { label: 'Keuze',      stages: [WorkflowStage.DEBATE] },
  { label: 'Compositie', stages: [WorkflowStage.COMPOSITION] },
  { label: 'Oordeel',    stages: [WorkflowStage.SYNTHESIZING, WorkflowStage.COMPLETED] },
];

const JourneyStepper: FC<{ stage: WorkflowStage }> = ({ stage }) => {
  const currentIdx = JOURNEY_STEPS.findIndex(s => s.stages.includes(stage));
  const isComplete = stage === WorkflowStage.COMPLETED;
  return (
    <div className="flex items-center justify-center mb-4">
      {JOURNEY_STEPS.map((step, i) => {
        const isActive = i === currentIdx;
        const isPast = i < currentIdx || isComplete;
        return (
          <div key={step.label} className="flex items-center">
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 transition-all border-2 ${
              isActive
                ? 'bg-[var(--action)] border-[var(--line)] text-white'
                : isPast
                  ? 'bg-black dark:bg-white border-black dark:border-white text-white dark:text-black'
                  : 'bg-transparent border-black/15 dark:border-white/15 text-black/40 dark:text-white/40'
            }`}>
              <span className="text-[10px] font-black w-4 h-4 flex items-center justify-center">
                {isPast && !isActive ? '✓' : String(i + 1)}
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.15em] hidden sm:block">{step.label}</span>
            </div>
            {i < JOURNEY_STEPS.length - 1 && (
              <div className={`w-6 md:w-10 h-0.5 transition-colors ${isPast ? 'bg-black dark:bg-white' : 'bg-black/10 dark:bg-white/10'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

const LogoSwitch: FC = () => (
  <video
    src="/FAINLANI.mp4"
    autoPlay
    muted
    loop
    playsInline
    aria-label="FAINL logo animatie"
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

// Shown after Stripe redirects back. Reads ?payment_confirm=true&type=credits&count=X
// which must be configured as the success URL in each Stripe Payment Link dashboard.
const PaymentSuccessPage: FC = () => {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const count = params.get('count') || '?';
  const type = params.get('type');
  const isConfirmed = params.get('payment_confirm') === 'true';

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
          {isConfirmed ? 'Betaling Bevestigd!' : 'Bedankt!'}
        </h1>
        <p className="font-bold text-black dark:text-white/80 mb-2 text-lg">
          {isConfirmed && type === 'credits'
            ? `${count} credits zijn toegevoegd aan jouw account.`
            : isConfirmed && type === 'lifetime'
            ? 'Onbeperkte toegang geactiveerd.'
            : 'Je betaling is verwerkt. Ga terug naar het dashboard om je credits te bekijken.'}
        </p>
        <p className="text-sm font-bold text-black/50 dark:text-white/40 uppercase tracking-widest mb-8">
          Je kunt direct je volgende vraag stellen aan de Raad.
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
  const navigate = useNavigate();

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
    modelCount: 3 as 3 | 5,
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
        // Migrate: update modelId for any member whose ID matches a DEFAULT_COUNCIL member
        const defaultById = Object.fromEntries(DEFAULT_COUNCIL.map(m => [m.id, m]));
        return merged.activeCouncil.map((m: any) => defaultById[m.id] ? { ...m, modelId: defaultById[m.id].modelId, provider: defaultById[m.id].provider } : m);
      })(),
      customNodes: Array.isArray(merged.customNodes) ? merged.customNodes : [],
      modelCount: merged.modelCount === 5 ? 5 : 3,
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

  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
  const [authSession, setAuthSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<{ credits_remaining: number; total_turns_used: number; is_lifetime: boolean } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthSession(session);
      fetchProfile(session?.user?.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthSession(session);
      fetchProfile(session?.user?.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId?: string) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    const { data, error } = await supabase.from('user_profiles').select('*').eq('id', userId).single();
    if (error) {
      // If no profile exists yet, create one
      if (error.code === 'PGRST116') {
         const { data: newProfile } = await supabase.from('user_profiles').insert({
           id: userId,
           credits_remaining: 0,
           total_turns_used: 0,
           is_lifetime: false,
         }).select().single();
         if (newProfile) setProfile(newProfile);
      }
    } else if (data) {
      setProfile(data);
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

  const [isInputFocused, setIsInputFocused] = useState(false);

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

    // Deduct credit atomically server-side via RPC to prevent race conditions
    if (authSession?.user && profile) {
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
      setProfile(p => p ? {
        ...p,
        credits_remaining: rpcData.credits_remaining,
        total_turns_used: rpcData.total_turns_used,
      } : null);
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

      if (responses.length === 0) {
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
    const isAllowed = isLifetime || hasTurnsRemaining || hasCredits;

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

  const handlePurchaseTurns = (count: number) => {
    const creditPkg = PRICING.CREDITS.find(p => p.count === count);
    const subPkg = PRICING.SUBSCRIPTIONS.find(p => p.count === count || p.creditsPerMonth === count);
    const pkg = creditPkg || subPkg;
    if (!pkg?.stripeUrl) {
      alert("Deze betaallink is nog niet actief.");
      return;
    }
    // Stripe Payment Links do not support ?success_url= overrides.
    // Configure each Payment Link's success URL in the Stripe Dashboard to:
    //   https://fainl.com/?payment_confirm=true&type=credits&count=X
    // where X is the number of credits for that product.
    try {
      const destination = new URL(pkg.stripeUrl);
      if (!destination.hostname.endsWith('stripe.com')) throw new Error('invalid host');
    } catch {
      alert("Ongeldige betaallink. Neem contact op met support.");
      return;
    }
    window.location.href = pkg.stripeUrl;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment_confirm') === 'true') {
      const type = params.get('type');
      const countStr = params.get('count');
      const count = countStr === 'infinity' ? Infinity : parseInt(countStr || '0', 10);

      if (type === 'lifetime') {
        setConfig(prev => ({ ...prev, isLifetime: true }));
      } else if (type === 'credits' || type === 'turns') {
        // Both credits and subscription purchases add to creditsRemaining
        setConfig(prev => ({
          ...prev,
          creditsRemaining: prev.creditsRemaining + (isFinite(count as number) ? (count as number) : 0),
          isLifetime: count === Infinity ? true : prev.isLifetime,
        }));
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const NavLinks = [
    { id: "/",          label: "Home",               img: "/icons-navbar/home-icons.png" },
    { id: "/tokens",    label: "Credits",             img: "/icons-navbar/Euro-icon.png" },
    { id: "/dashboard", label: "Mijn FAINL's",        img: "/icons-navbar/settings-icon.png" },
    { id: "/cookbook",  label: "Voorbeeldvragen",     img: "/icons-navbar/question-icon.png" },
    { id: "/faq",       label: "FAQ",                 img: "/icons-navbar/faq-icon.png" },
    { id: "/contact",   label: "Contact",             img: "/icons-navbar/contact-icon.png" },
  ];


  return (
    <AppShell
      history={history}
      onLoadSession={(s) => { setSession(s); navigate('/mission'); }}
      onNewChat={() => {
        setSession({
          id: crypto.randomUUID(),
          stage: WorkflowStage.IDLE,
          query: '',
          councilResponses: [],
          debateMessages: [],
          reviews: [],
          synthesis: '',
        });
        setInput('');
        navigate('/');
      }}
    >

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

      <main className="flex-1 w-full flex flex-col">
        <Suspense fallback={<div className="flex items-center justify-center min-h-[40vh]"><div className="w-6 h-6 border-2 border-black/20 border-t-black dark:border-white/20 dark:border-t-white rounded-full animate-spin" /></div>}>
        <Routes>
          {/* Home — Chat interface (navigates to /mission on submit) */}
          <Route path="/" element={
            <ChatHome
              input={input}
              onInputChange={setInput}
              onSubmit={() => { navigate('/mission'); handleStart(); }}
              isInputFocused={isInputFocused}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
            />
          } />

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
                />
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 flex flex-col items-center justify-center min-h-[calc(100vh-120px)]">
                  {session.stage === WorkflowStage.ERROR && (
                    <div className="w-full max-w-xl bg-white dark:bg-black border-2 md:border-4 border-black dark:border-[var(--line)]/40 p-6 md:p-12 rounded-none text-center animate-fade-in-up">
                      <AlertTriangle className="w-12 h-12 md:w-20 md:h-20 text-black dark:text-white mb-6 md:mb-8 mx-auto" />
                      <h3 className="text-xl md:text-3xl font-black uppercase mb-3 md:mb-4 tracking-tighter">
                        Er ging iets mis
                      </h3>
                      <p className="text-black dark:text-white/50 font-bold mb-6 md:mb-10 leading-relaxed text-sm md:text-lg">
                        {session.error}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                          type="button"
                          onClick={() =>
                            setSession({
                              ...session,
                              stage: WorkflowStage.IDLE,
                            })
                          }
                          className="px-6 py-3 md:px-10 md:py-5 bg-white dark:bg-black border-2 border-black dark:border-[var(--line)]/40 font-black rounded-none uppercase tracking-[0.2em] text-sm md:text-sm transition-all text-black dark:text-white hover:bg-[var(--action)] hover:text-black"
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
                      isInputFocused={isInputFocused}
                      onFocus={() => setIsInputFocused(true)}
                      onBlur={() => setIsInputFocused(false)}
                    />
                  ) : (
                    session.stage !== WorkflowStage.ERROR && (
                      <div className="animate-fade-in-up space-y-8 md:space-y-16 w-full pb-12">

                        {/* Journey stepper */}
                        <JourneyStepper stage={session.stage} />

                        {/* Query display */}
                        <div className="relative bg-white dark:bg-black border-2 md:border-4 border-black dark:border-[var(--line)] rounded-none p-6 md:p-12 text-center shadow-[6px_6px_0_0_black] md:shadow-md dark:shadow-md dark:md:shadow-lg">
                          <p className="text-sm md:text-base font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-[var(--ink)] mb-4">Jouw vraag</p>
                          <p className="text-xl sm:text-3xl md:text-5xl text-black dark:text-white font-serif italic font-black tracking-tight leading-tight">
                            "{session.query}"
                          </p>
                          {session.stage === WorkflowStage.PROCESSING_COUNCIL && (
                            <button
                              type="button"
                              onClick={() => {
                                if (!window.confirm('Weet je zeker dat je de lopende analyse wilt annuleren?')) return;
                                setInput(session.query);
                                setSession({ id: crypto.randomUUID(), stage: WorkflowStage.IDLE, query: '', councilResponses: [], debateMessages: [], reviews: [], synthesis: '' });
                              }}
                              className="absolute top-3 right-3 md:top-6 md:right-6 p-2 text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white transition-colors"
                              title="Vraag aanpassen"
                            >
                              <PenLine className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Processing progress indicator */}
                        {session.stage === WorkflowStage.PROCESSING_COUNCIL && (
                          <div className="flex flex-col items-center gap-3 -mt-2">
                            <div className="flex items-center gap-2">
                              {config.activeCouncil.map((member, i) => {
                                const done = session.councilResponses.some(r => r.memberId === member.id);
                                const delayClass = i === 0 ? '[animation-delay:0ms]' : i === 1 ? '[animation-delay:150ms]' : '[animation-delay:300ms]';
                                return (
                                  <div key={member.id} className="flex items-center gap-1.5">
                                    <div className={`w-2 h-2 rounded-full transition-all duration-500 ${done ? 'bg-[var(--action)] scale-125' : `bg-black/20 dark:bg-white/20 animate-pulse ${delayClass}`}`} />
                                  </div>
                                );
                              })}
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-black/40 dark:text-white/30">
                              {session.councilResponses.length} van {config.activeCouncil.length} analyses klaar
                            </span>
                            <WaitTimeIndicator startedAt={processingStartRef.current} />
                          </div>
                        )}

                        {/* Council node cards */}
                        <div ref={councilRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                          {config.activeCouncil.map((member) => (
                            <CouncilCard
                              key={member.id}
                              member={member}
                              response={session.councilResponses.find(
                                (r) => r.memberId === member.id,
                              )}
                              isLoading={
                                session.stage === WorkflowStage.PROCESSING_COUNCIL &&
                                !session.councilResponses.find(
                                  (r) => r.memberId === member.id,
                                )
                              }
                              isExpanded={expandedCards.has(member.id)}
                              onToggle={() => toggleCard(member.id)}
                            />
                          ))}
                        </div>

                        {/* Choice: Verdict / Debate / Compose — after all nodes responded */}
                         {session.stage === WorkflowStage.DEBATE && (
                           <div ref={debateChoiceRef} className="w-full p-5 md:p-8 animate-fade-in-up verdict-panel">
                            <div className="flex justify-center mb-4">
                              <span className="badge"><CircleCheck className="w-3.5 h-3.5" /> Alle {config.activeCouncil.length} analyses klaar</span>
                            </div>

                            <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
                              {/* PRIMARY: Direct to Victor */}
                              <button
                                type="button"
                                onClick={handleQuickCompose}
                                className="btn-send w-full justify-center py-4 text-base flex-col"
                              >
                                <span className="flex items-center gap-2">
                                  <Gavel className="w-5 h-5" />
                                  Victor's eindoordeel ophalen
                                </span>
                                <span className="text-[11px] font-medium opacity-60 mt-1">Voorzitter Victor weegt alle analyses en levert het definitieve advies</span>
                              </button>

                              <p className="text-xs text-black/40 dark:text-white/30">of verdiep je eerst</p>

                              <div className="flex gap-3 w-full">
                                <button
                                  type="button"
                                  onClick={() => setIsDebateOpen(true)}
                                  className="btn-ghost flex-1 justify-center py-3 flex-col"
                                >
                                  <span className="flex items-center gap-2">
                                    <Swords className="w-4 h-4" />
                                    Live debat
                                  </span>
                                  <span className="text-[11px] font-medium text-black/40 dark:text-white/30 mt-1">Laat de AI-modellen met elkaar discussiëren</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setSession(prev => ({ ...prev, stage: WorkflowStage.COMPOSITION })); scrollTo(compositionRef, 150); }}
                                  className="btn-ghost flex-1 justify-center py-3 flex-col"
                                >
                                  <span className="flex items-center gap-2">
                                    <PenLine className="w-4 h-4" />
                                    Compositie
                                  </span>
                                  <span className="text-[11px] font-medium text-black/40 dark:text-white/30 mt-1">Stel zelf het eindadvies samen uit de analyses</span>
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setInput(session.query);
                                  setSession({ id: crypto.randomUUID(), stage: WorkflowStage.IDLE, query: '', councilResponses: [], debateMessages: [], reviews: [], synthesis: '' });
                                }}
                                className="text-[11px] font-bold text-black/30 dark:text-white/20 hover:text-black dark:hover:text-white transition-colors mt-2 underline underline-offset-2"
                              >
                                Vraag aanpassen en opnieuw starten
                              </button>
                            </div>
                          </div>
                        )}
                         {session.stage === WorkflowStage.COMPOSITION && (
                           <div ref={compositionRef}>
                             <CompositionStage
                               responses={session.councilResponses}
                               members={config.activeCouncil}
                               onCompose={handleCompose}
                             />
                           </div>
                         )}

                        {/* Victor's verdict — rendered BELOW the council cards so it appears naturally as user scrolls */}
                         {(session.stage === WorkflowStage.SYNTHESIZING ||
                           session.stage === WorkflowStage.COMPLETED) && (
                           <div ref={verdictRef} tabIndex={-1} aria-label="Eindoordeel van Voorzitter Victor" className="w-full bg-white dark:bg-black border-2 md:border-4 border-black dark:border-[var(--line)]/40 rounded-none overflow-hidden shadow-md md:shadow-lg outline-none">
                            {/* Verdict header */}
                            <div className="bg-black dark:bg-zinc-800 text-white px-4 md:px-10 py-4 md:py-7 flex items-center gap-3 md:gap-4 border-b-2 border-black/20">
                              <div className="w-10 h-10 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-white/20 shrink-0 bg-zinc-700">
                                <img src={DEFAULT_CHAIRMAN.avatar} alt="Victor" className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-black uppercase tracking-[0.35em] text-white/40 leading-none mb-1">Eindoordeel van de Raad</p>
                                <h3 className="font-black text-xl md:text-2xl uppercase tracking-tight text-white leading-none flex items-center gap-3">
                                  <Gavel className="w-5 h-5 shrink-0 text-white/60" />
                                  Voorzitter Victor
                                </h3>
                              </div>
                              {session.stage === WorkflowStage.SYNTHESIZING && (
                                <div className="flex items-center gap-2 text-white/50 text-xs font-black uppercase tracking-widest shrink-0">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span className="hidden sm:inline">Verwerken…</span>
                                </div>
                              )}
                            </div>

                            {/* Verdict body */}
                            <div className="px-5 sm:px-8 md:px-16 py-6 sm:py-10 md:py-16 bg-white dark:bg-black">
                              {session.synthesis ? (
                                (() => {
                                  const { consensus, confidence, cleanText } = parseVerdictScores(session.synthesis);
                                  return (
                                    <>
                                      {(consensus !== null || confidence !== null) && (
                                        <div className="flex flex-col sm:flex-row gap-6 mb-8 md:mb-12 p-4 md:p-6 border-2 border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900">
                                          {consensus !== null && (
                                            <ScoreBar label="Consensus" value={consensus} icon={<Users className="w-4 h-4 text-black/40 dark:text-white/40" />} />
                                          )}
                                          {confidence !== null && (
                                            <ScoreBar label="Vertrouwen" value={confidence} icon={<Shield className="w-4 h-4 text-black/40 dark:text-white/40" />} />
                                          )}
                                        </div>
                                      )}
                                      <div className="prose prose-lg md:prose-xl max-w-none dark:prose-invert
                                        prose-headings:font-black prose-headings:tracking-tight prose-headings:uppercase
                                        prose-h2:text-2xl sm:prose-h2:text-3xl md:prose-h2:text-4xl prose-h2:border-b-2 md:prose-h2:border-b-4 prose-h2:border-black dark:prose-h2:border-[var(--line)] prose-h2:pb-2 md:prose-h2:pb-4 prose-h2:mb-6 md:prose-h2:mb-8 prose-h2:mt-12 md:prose-h2:mt-16 first:prose-h2:mt-0
                                        prose-h3:text-xl md:prose-h3:text-2xl prose-h3:text-black dark:prose-h3:text-[var(--ink)] prose-h3:mt-8 md:prose-h3:mt-12 prose-h3:mb-3 md:prose-h3:mb-4
                                        prose-p:leading-relaxed prose-p:text-black dark:prose-p:text-white/80 prose-p:text-lg sm:prose-p:text-xl md:prose-p:text-2xl prose-p:font-bold
                                        prose-strong:text-black dark:prose-strong:text-[var(--ink)] prose-strong:font-black
                                        prose-blockquote:border-l-4 md:prose-blockquote:border-l-8 prose-blockquote:border-[var(--line)] prose-blockquote:bg-zinc-50 dark:prose-blockquote:bg-zinc-900 prose-blockquote:px-5 md:prose-blockquote:px-8 prose-blockquote:py-4 md:prose-blockquote:py-6 prose-blockquote:rounded-none prose-blockquote:not-italic
                                        prose-li:text-black dark:prose-li:text-white/80 prose-li:my-1 md:prose-li:my-2 prose-li:text-lg sm:prose-li:text-xl md:prose-li:text-xl prose-li:font-bold
                                        prose-hr:border-black/10 dark:prose-hr:border-[var(--line)]/20">
                                        <ReactMarkdown>{cleanText}</ReactMarkdown>
                                      </div>
                                    </>
                                  );
                                })()
                              ) : (
                                <div className="space-y-6 animate-pulse">
                                  <p className="font-black text-sm uppercase tracking-[0.3em] text-black/40 dark:text-white/30 text-center mb-6">Victor stelt het oordeel op…</p>
                                  {/* Score bars skeleton */}
                                  <div className="flex gap-6 p-4 border-2 border-black/5 dark:border-white/5">
                                    <div className="flex-1 space-y-2"><div className="h-3 w-20 bg-black/10 dark:bg-white/10 rounded" /><div className="h-2 w-full bg-black/10 dark:bg-white/10 rounded-full" /></div>
                                    <div className="flex-1 space-y-2"><div className="h-3 w-24 bg-black/10 dark:bg-white/10 rounded" /><div className="h-2 w-full bg-black/10 dark:bg-white/10 rounded-full" /></div>
                                  </div>
                                  {/* H2 skeleton */}
                                  <div className="h-8 w-3/4 bg-black/10 dark:bg-white/10 rounded border-b-4 border-black/5 dark:border-white/5" />
                                  {/* Paragraph skeletons */}
                                  <div className="space-y-3">
                                    <div className="h-4 w-full bg-black/8 dark:bg-white/8 rounded" />
                                    <div className="h-4 w-5/6 bg-black/8 dark:bg-white/8 rounded" />
                                    <div className="h-4 w-4/5 bg-black/8 dark:bg-white/8 rounded" />
                                  </div>
                                  {/* H3 skeleton */}
                                  <div className="h-6 w-1/2 bg-black/10 dark:bg-white/10 rounded mt-4" />
                                  {/* More paragraphs */}
                                  <div className="space-y-3">
                                    <div className="h-4 w-full bg-black/8 dark:bg-white/8 rounded" />
                                    <div className="h-4 w-11/12 bg-black/8 dark:bg-white/8 rounded" />
                                    <div className="h-4 w-3/4 bg-black/8 dark:bg-white/8 rounded" />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Verdict footer — only when complete */}
                            {session.stage === WorkflowStage.COMPLETED && session.synthesis && (
                              <div className="px-6 md:px-12 py-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-700 flex items-center gap-2">
                                <CircleCheck className="w-4 h-4 text-green-500 shrink-0" />
                                <span className="text-xs font-black uppercase tracking-widest text-black dark:text-white/40">
                                  Klaar — {config.activeCouncil.length} AI-modellen gehoord · Voorzitter Victor heeft geoordeeld
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {session.stage === WorkflowStage.COMPLETED && (
                          <div className="flex flex-col items-center gap-4 pt-8 pb-4">
                            {/* Copy & share actions */}
                            <div className="flex gap-2 mb-2">
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(session.synthesis || '');
                                }}
                                className="btn-ghost text-xs"
                              >
                                Kopieer eindoordeel
                              </button>
                              {typeof navigator.share === 'function' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const title = `FAINL Eindoordeel: ${session.query.slice(0, 50)}…`;
                                    const text = (session.synthesis || '').slice(0, 200) + '… Lees het volledige oordeel op fainl.com';
                                    navigator.share({ title, text, url: 'https://fainl.com' }).catch(() => {});
                                  }}
                                  className="btn-ghost text-xs"
                                >
                                  Deel
                                </button>
                              )}
                            </div>

                            <FeedbackWidget sessionId={session.id} />

                            {/* Account conversion banner for anonymous first-session users */}
                            {!authSession && config.turnsUsed <= 2 && (
                              <div className="w-full max-w-lg bg-zinc-50 dark:bg-zinc-900 border-2 border-black/10 dark:border-white/10 p-4 text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <p className="text-sm font-bold text-black dark:text-white mb-2">Je eerste AI-raadsoordeel!</p>
                                <p className="text-xs text-black/60 dark:text-white/50 mb-3">Maak een gratis account aan om dit op te slaan en meer sessies te ontgrendelen.</p>
                                <button
                                  type="button"
                                  onClick={() => navigate('/login')}
                                  className="px-6 py-2 bg-black dark:bg-[var(--action)] text-white dark:text-black text-xs font-black uppercase tracking-widest hover:bg-[var(--action)] hover:text-black transition-all"
                                >
                                  Gratis account aanmaken
                                </button>
                              </div>
                            )}

                            <p className="text-xs text-zinc-400 dark:text-zinc-600 uppercase tracking-widest font-bold">
                              Sessie opgeslagen in Mijn FAINL's
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setSession({
                                    id: crypto.randomUUID(),
                                    stage: WorkflowStage.IDLE,
                                    query: '',
                                    councilResponses: [],
                                    debateMessages: [],
                                    reviews: [],
                                    synthesis: ''
                                  });
                                  setInput('');
                                  navigate('/');
                                }}
                                className="btn-send"
                              >
                                <ArrowRight className="w-4 h-4" />
                                Nieuwe vraag stellen
                              </button>
                              <button
                                type="button"
                                onClick={() => navigate('/cookbook')}
                                 className="flex items-center gap-3 px-6 py-3 md:px-8 md:py-4 border-2 border-black/20 dark:border-white/20 text-black dark:text-white/50 rounded-none font-black text-xs sm:text-sm uppercase tracking-widest hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-all shadow-[2px_2px_0_0_black/5] md:shadow-[4px_4px_0_0_black/5]"
                              >
                                Voorbeeldvragen bekijken
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
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
                onDeleteSessions={(ids) => setHistory(h => h.filter(s => !ids.includes(s.id)))}
                onArchiveSessions={(ids) => setHistory(h => h.map(s => ids.includes(s.id) ? { ...s, isArchived: true } : s))}
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
