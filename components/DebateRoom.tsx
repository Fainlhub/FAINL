import { FC, useState, useEffect, useRef, useCallback } from 'react';

// Minimal Web Speech API typings (vendor-prefixed, not yet in standard DOM lib)
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;
type WindowWithSpeechRecognition = Window & {
  SpeechRecognition?: SpeechRecognitionCtor;
  webkitSpeechRecognition?: SpeechRecognitionCtor;
};
import ReactMarkdown from 'react-markdown';
import {
  X, Mic, MicOff, Volume2, VolumeX, Pause, Play, Gavel,
  Send, Timer, Users, Zap, StopCircle
} from 'lucide-react';
import { SessionState, CouncilMember, DebateMessage, AppConfig } from '../types';
import { UnifiedCouncilService } from '../services/councilService';
import { NodeLoader, loaderShapeForIndex } from './NodeLoader';

interface DebateRoomProps {
  isOpen: boolean;
  session: SessionState;
  config: AppConfig;
  councilService: UnifiedCouncilService;
  onClose: () => void;
  onEndDebate: (debateMessages: DebateMessage[]) => void;
  onAddDebateMessage: (msg: DebateMessage) => void;
}

// Google Chirp 3 HD voices — one per node for distinct characters
// Voice names: https://cloud.google.com/text-to-speech/docs/chirp3-hd
const CHIRP_VOICES = [
  { name: 'nl-NL-Chirp3-HD-Charon', rate: 1.05 },  // Perplexi Pieter — kalm, helder
  { name: 'nl-NL-Chirp3-HD-Fenrir', rate: 1.08 },  // Claudette van Rijn — analytisch, zeker
  { name: 'nl-NL-Chirp3-HD-Aoede',  rate: 1.12 },  // Open Aïsha — expressief, vlot
  { name: 'nl-NL-Chirp3-HD-Orus',   rate: 1.05 },
  { name: 'nl-NL-Chirp3-HD-Puck',   rate: 1.1  },
  { name: 'nl-NL-Chirp3-HD-Kore',   rate: 1.08 },
];

// Browser TTS fallback profiles (used when Chirp API is unavailable)
const VOICE_PROFILES = [
  { pitch: 1.0,  rate: 1.12 },
  { pitch: 0.92, rate: 1.08 },
  { pitch: 1.1,  rate: 1.18 },
  { pitch: 0.96, rate: 1.1  },
  { pitch: 1.05, rate: 1.15 },
  { pitch: 1.0,  rate: 1.1  },
];

const PREFERRED_NL_VOICE_NAMES = [
  'Microsoft Lotte', 'Microsoft Femke', 'Microsoft Frank',
  'Google Nederlands', 'nl-NL-Standard',
];

const PREGEN_DISPLAY_DELAY_MS = 120;
const TURN_LOOP_DELAY_MS = 250;

const DURATION_OPTIONS = [
  { label: '1 min',  seconds: 60 },
  { label: '5 min',  seconds: 300 },
  { label: '10 min', seconds: 600 },
  { label: '∞',      seconds: -1 },
];

function getVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise(resolve => {
    const voices = window.speechSynthesis?.getVoices() ?? [];
    if (voices.length > 0) { resolve(voices); return; }
    const handler = () => resolve(window.speechSynthesis.getVoices());
    window.speechSynthesis?.addEventListener('voiceschanged', handler, { once: true });
    setTimeout(() => resolve(window.speechSynthesis?.getVoices() ?? []), 2000);
  });
}

// Extract first 1-2 sentences for TTS (short = fast, snappy debate pace)
function extractTTSText(text: string): string {
  const stripped = text.replace(/[#*`_>~\[\]]/g, '').replace(/\s+/g, ' ').trim();
  return stripped.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ').substring(0, 180);
}

// Play base64 MP3 audio — resolves when playback ends or after 30s max
function playBase64Audio(base64: string): Promise<void> {
  return new Promise(resolve => {
    const audio = new Audio(`data:audio/mp3;base64,${base64}`);
    const timeout = setTimeout(() => { audio.pause(); resolve(); }, 30_000);
    const done = () => { clearTimeout(timeout); resolve(); };
    audio.onended = done;
    audio.onerror = done;
    audio.play().catch(done);
  });
}

// Browser TTS fallback
function speakBrowser(
  ttsText: string,
  nodeIdx: number,
  voices: SpeechSynthesisVoice[],
  profile: { pitch: number; rate: number }
): Promise<void> {
  return new Promise(resolve => {
    if (!window.speechSynthesis || !ttsText) { resolve(); return; }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(ttsText);
    utter.lang = 'nl-NL';
    const nlVoices = voices.filter(v => v.lang.startsWith('nl'));
    const pool = nlVoices.length > 0 ? nlVoices : voices;
    const preferred = pool.filter(v => PREFERRED_NL_VOICE_NAMES.some(n => v.name.includes(n)));
    const voicePool = preferred.length >= 2 ? preferred : pool;
    if (voicePool.length > 0) utter.voice = voicePool[nodeIdx % voicePool.length];
    utter.pitch  = profile.pitch;
    utter.rate   = profile.rate + (Math.random() - 0.5) * 0.08;
    utter.volume = 1;
    utter.onend  = () => resolve();
    utter.onerror = () => resolve();
    window.speechSynthesis.speak(utter);
  });
}

// Main speak function: tries Google Chirp 3 HD first, falls back to browser TTS
async function speakNL(
  text: string,
  nodeIdx: number,
  voices: SpeechSynthesisVoice[],
  _profile: { pitch: number; rate: number },
  councilSvc: import('../services/councilService').UnifiedCouncilService
): Promise<void> {
  const ttsText = extractTTSText(text);
  if (!ttsText) return;

  const chirp = CHIRP_VOICES[nodeIdx % CHIRP_VOICES.length];
  try {
    const audioContent = await councilSvc.synthesizeSpeech(ttsText, chirp.name, chirp.rate);
    if (audioContent) {
      await playBase64Audio(audioContent);
      return;
    }
  } catch (err) { console.warn('Chirp TTS failed, falling back to browser TTS:', err instanceof Error ? err.message : err); }

  // Fallback: browser Web Speech API
  const fallbackProfile = VOICE_PROFILES[nodeIdx % VOICE_PROFILES.length];
  await speakBrowser(ttsText, nodeIdx, voices, fallbackProfile);
}

export const DebateRoom: FC<DebateRoomProps> = ({
  isOpen, session, config, councilService,
  onClose, onEndDebate, onAddDebateMessage,
}) => {
  const [showIntro, setShowIntro]             = useState(() => !localStorage.getItem('fainl_debate_intro_seen'));
  const [showSummary, setShowSummary]         = useState(false);
  const [summaryData, setSummaryData]         = useState<{ count: number; participants: string[]; duration: number } | null>(null);
  const [messages, setMessages]               = useState<DebateMessage[]>([]);
  const [userInput, setUserInput]             = useState('');
  const [isPaused, setIsPaused]               = useState(false);
  const [isGenerating, setIsGenerating]       = useState(false);
  const [generatingSpeaker, setGeneratingSpeaker] = useState<CouncilMember | null>(null);
  const [streamingText, setStreamingText]     = useState('');
  const [voiceEnabled, setVoiceEnabled]       = useState(true);
  const [micActive, setMicActive]             = useState(false);
  const [duration, setDuration]               = useState(300);
  const [timeLeft, setTimeLeft]               = useState(300);
  const [phase, setPhase]                     = useState<'pick' | 'live'>('pick');
  const [cachedVoices, setCachedVoices]       = useState<SpeechSynthesisVoice[]>([]);
  const streamingTextRef                      = useRef('');

  const messagesRef         = useRef<DebateMessage[]>([]);
  const speakerIdxRef       = useRef(0);
  const isRunningRef        = useRef(false);
  const isPausedRef         = useRef(false);
  const voiceEnabledRef     = useRef(true);
  const isMountedRef        = useRef(true);
  const scrollRef           = useRef<HTMLDivElement>(null);
  const loopTimerRef        = useRef<NodeJS.Timeout | null>(null);
  const countdownRef        = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef      = useRef<SpeechRecognitionLike | null>(null);
  // Pre-generated next turn (ready while current TTS plays)
  const preGenRef           = useRef<{ memberIdx: number; response: string } | null>(null);
  const isPreGenningRef     = useRef(false);
  const preGenAbortRef      = useRef<AbortController | null>(null);

  const readyMembers = councilService.getReadyMembers(config.activeCouncil);

  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { voiceEnabledRef.current = voiceEnabled; }, [voiceEnabled]);

  useEffect(() => {
    isMountedRef.current = true;
    getVoices().then(v => { if (isMountedRef.current) setCachedVoices(v); });
    return () => {
      isMountedRef.current = false;
      stopLoop();
      window.speechSynthesis?.cancel();
      recognitionRef.current?.stop();
      preGenAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setMessages([]);
    messagesRef.current = [];
    setUserInput('');
    setIsPaused(false);
    isPausedRef.current = false;
    setIsGenerating(false);
    setPhase('pick');
    speakerIdxRef.current = 0;
    isRunningRef.current = false;
    preGenRef.current = null;
    isPreGenningRef.current = false;
    window.speechSynthesis?.cancel();
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isGenerating]);

  // ── Core turn runner — streams response, pre-generates next during TTS ──────
  const runNextTurn = useCallback(async () => {
    if (!isRunningRef.current || isPausedRef.current) {
      if (isRunningRef.current) loopTimerRef.current = setTimeout(runNextTurn, 500);
      return;
    }
    if (!isMountedRef.current) return;

    const currentIdx = speakerIdxRef.current % readyMembers.length;
    const speaker = readyMembers[currentIdx];

    // ── Check for pre-generated response (silently prepared during last TTS) ──
    const preGen = preGenRef.current;
    const hasPreGen = preGen && preGen.memberIdx === currentIdx;

    setIsGenerating(true);
    setGeneratingSpeaker(speaker);
    streamingTextRef.current = '';
    setStreamingText('');

    let response = '';
    try {
      if (hasPreGen) {
        // Instant — no API wait, simulate brief "thinking" flicker
        response = preGen!.response;
        preGenRef.current = null;
        // Show text immediately as streaming for visual continuity
        setStreamingText(response);
        streamingTextRef.current = response;
        await new Promise(r => setTimeout(r, PREGEN_DISPLAY_DELAY_MS));
      } else {
        // Normal streaming generation
        response = await councilService.generateDebateResponseStream(
          session.query, speaker, session.councilResponses,
          messagesRef.current, readyMembers,
          (chunk) => {
            if (!isMountedRef.current || !isRunningRef.current) return;
            streamingTextRef.current += chunk;
            setStreamingText(streamingTextRef.current);
          }
        );
      }

      if (!isMountedRef.current || !isRunningRef.current) return;

      setStreamingText('');
      streamingTextRef.current = '';

      const msg: DebateMessage = {
        id: `${Date.now()}-${Math.random()}`,
        memberId: speaker.id,
        content: response,
        timestamp: Date.now(),
      };

      messagesRef.current = [...messagesRef.current, msg];
      setMessages([...messagesRef.current]);
      onAddDebateMessage(msg);
      speakerIdxRef.current += 1;

      // ── Pre-generate NEXT speaker's response while TTS plays ──────────────
      const nextIdx = speakerIdxRef.current % readyMembers.length;
      const nextSpeaker = readyMembers[nextIdx];
      if (isRunningRef.current && !isPausedRef.current && !isPreGenningRef.current) {
        isPreGenningRef.current = true;
        preGenAbortRef.current?.abort();
        preGenAbortRef.current = new AbortController();
        const snapshotMessages = [...messagesRef.current];
        councilService.generateDebateResponseStream(
          session.query, nextSpeaker, session.councilResponses,
          snapshotMessages, readyMembers,
          () => {} // silent — no streaming UI for pre-gen
        ).then(r => {
          if (isMountedRef.current && isRunningRef.current && !isPausedRef.current) {
            preGenRef.current = { memberIdx: nextIdx, response: r };
          }
        }).catch(() => {}).finally(() => {
          isPreGenningRef.current = false;
          preGenAbortRef.current = null;
        });
      }

      // ── TTS ───────────────────────────────────────────────────────────────
      if (voiceEnabledRef.current) {
        const profile = VOICE_PROFILES[currentIdx % VOICE_PROFILES.length];
        await speakNL(response, currentIdx, cachedVoices, profile, councilService);
      }

    } catch (err: unknown) {
      console.error('Debatfout:', err instanceof Error ? err.message : String(err));
    } finally {
      if (isMountedRef.current) {
        setIsGenerating(false);
        setGeneratingSpeaker(null);
        setStreamingText('');
        streamingTextRef.current = '';
      }
    }

    // Short pause after TTS — pre-gen likely already done
    if (isRunningRef.current && isMountedRef.current) {
      loopTimerRef.current = setTimeout(runNextTurn, TURN_LOOP_DELAY_MS);
    }
  }, [readyMembers, session, councilService, cachedVoices, onAddDebateMessage]);

  const handleEndRef = useRef<() => void>(() => {});

  const handleEnd = useCallback(() => {
    isRunningRef.current = false;
    if (loopTimerRef.current)  { clearTimeout(loopTimerRef.current);  loopTimerRef.current = null; }
    if (countdownRef.current)  { clearTimeout(countdownRef.current);  countdownRef.current = null; }
    window.speechSynthesis?.cancel();
    recognitionRef.current?.stop();
    preGenAbortRef.current?.abort();
    preGenAbortRef.current = null;

    const msgs = [...messagesRef.current];
    const participants = [...new Set(msgs.map(m => {
      const member = readyMembers.find(rm => rm.id === m.memberId);
      return member?.name || 'Jij';
    }))];
    const elapsed = duration - timeLeft;
    setSummaryData({ count: msgs.length, participants, duration: elapsed });
    setShowSummary(true);
    setTimeout(() => {
      setShowSummary(false);
      onEndDebate(msgs);
    }, 2500);
  }, [onEndDebate, readyMembers, duration, timeLeft]);

  useEffect(() => { handleEndRef.current = handleEnd; }, [handleEnd]);

  const startCountdown = useCallback((seconds: number) => {
    if (seconds < 0) return;
    setTimeLeft(seconds);
    const tick = () => {
      setTimeLeft(prev => {
        if (prev <= 1) { handleEndRef.current(); return 0; }
        countdownRef.current = setTimeout(tick, 1000);
        return prev - 1;
      });
    };
    countdownRef.current = setTimeout(tick, 1000);
  }, []);

  const stopLoop = () => {
    isRunningRef.current = false;
    if (loopTimerRef.current)  { clearTimeout(loopTimerRef.current);  loopTimerRef.current = null; }
    if (countdownRef.current)  { clearTimeout(countdownRef.current);  countdownRef.current = null; }
  };

  const handleStart = () => {
    isRunningRef.current = true;
    isPausedRef.current  = false;
    setIsPaused(false);
    setPhase('live');
    startCountdown(duration);
    loopTimerRef.current = setTimeout(runNextTurn, 200);
  };

  const togglePause = () => {
    const next = !isPausedRef.current;
    isPausedRef.current = next;
    setIsPaused(next);
    window.speechSynthesis?.cancel();
    if (next) {
      preGenRef.current = null; // discard stale pre-gen on pause
    } else if (isRunningRef.current) {
      loopTimerRef.current = setTimeout(runNextTurn, 200);
    }
  };

  const handleSend = useCallback(() => {
    const text = userInput.trim();
    if (!text) return;
    const msg: DebateMessage = {
      id: `user-${Date.now()}`,
      memberId: 'user',
      content: text,
      timestamp: Date.now(),
    };
    window.speechSynthesis?.cancel();
    messagesRef.current = [...messagesRef.current, msg];
    setMessages([...messagesRef.current]);
    onAddDebateMessage(msg);
    setUserInput('');
    if (isPausedRef.current) { isPausedRef.current = false; setIsPaused(false); }
    if (isRunningRef.current) {
      if (loopTimerRef.current) clearTimeout(loopTimerRef.current);
      loopTimerRef.current = setTimeout(runNextTurn, 300);
    }
  }, [userInput, onAddDebateMessage, runNextTurn]);

  const toggleMic = useCallback(() => {
    const SR = (window as WindowWithSpeechRecognition).SpeechRecognition
            ?? (window as WindowWithSpeechRecognition).webkitSpeechRecognition;
    if (!SR) { alert('Spraakherkenning niet ondersteund — gebruik Chrome of Edge.'); return; }

    if (micActive) {
      recognitionRef.current?.stop();
      setMicActive(false);
      return;
    }

    const r = new SR();
    r.lang = 'nl-NL';
    r.continuous = false;
    r.interimResults = false;
    r.onresult = (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => {
      const t = e.results[0]?.[0]?.transcript?.trim();
      if (t) {
        const msg: DebateMessage = { id: `user-${Date.now()}`, memberId: 'user', content: t, timestamp: Date.now() };
        window.speechSynthesis?.cancel();
        messagesRef.current = [...messagesRef.current, msg];
        setMessages([...messagesRef.current]);
        onAddDebateMessage(msg);
        if (isRunningRef.current) {
          if (loopTimerRef.current) clearTimeout(loopTimerRef.current);
          loopTimerRef.current = setTimeout(runNextTurn, 300);
        }
      }
      setMicActive(false);
    };
    r.onerror = () => setMicActive(false);
    r.onend   = () => setMicActive(false);
    recognitionRef.current = r;
    r.start();
    setMicActive(true);
  }, [micActive, onAddDebateMessage, runNextTurn]);

  if (!isOpen) return null;

  const fmtTime = (s: number) => {
    if (s < 0) return '∞';
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  };

  const nlVoiceCount = cachedVoices.filter(v => v.lang.startsWith('nl')).length;

  const ACCENT = [
    'border-l-blue-400', 'border-l-purple-400', 'border-l-amber-400',
    'border-l-emerald-400', 'border-l-rose-400', 'border-l-cyan-400',
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-xl">
      <div className="w-full max-w-3xl h-[100dvh] sm:h-[92vh] bg-white dark:bg-black border-0 sm:border-4 border-black dark:border-[var(--line)]/40 sm:rounded-none flex flex-col overflow-hidden shadow-2xl">

        {/* ── Intro overlay for first-time visitors ─────────────── */}
        {showIntro && (
          <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="max-w-md text-center text-white space-y-6">
              <div className="w-16 h-16 bg-[var(--action)] rounded-full flex items-center justify-center mx-auto">
                <Zap className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight">Welkom in de Debatruimte</h3>
              <div className="space-y-3 text-sm font-bold text-white/70 leading-relaxed">
                <p>De AI-raadsleden gaan nu live met elkaar in debat over jouw vraag.</p>
                <p>Je kunt meekijken, maar ook zelf deelnemen door je eigen argumenten in te typen of in te spreken.</p>
                <p>Wanneer je genoeg hebt gezien, sluit je het debat af en gaat Victor aan de slag met het eindoordeel.</p>
              </div>
              <button
                type="button"
                onClick={() => { setShowIntro(false); localStorage.setItem('fainl_debate_intro_seen', '1'); }}
                className="px-8 py-4 bg-[var(--action)] text-black font-black uppercase tracking-widest text-sm hover:scale-105 active:scale-95 transition-all"
              >
                Start het debat
              </button>
            </div>
          </div>
        )}

        {/* ── Summary overlay ─────────────────────────────────── */}
        {showSummary && summaryData && (
          <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="max-w-sm text-center text-white space-y-4">
              <Users className="w-10 h-10 text-[var(--action)] mx-auto" />
              <h3 className="text-xl font-black uppercase tracking-tight">Debat Afgerond</h3>
              <div className="text-sm font-bold text-white/70 space-y-1">
                <p>{summaryData.count} berichten uitgewisseld</p>
                <p>{summaryData.participants.length} deelnemers: {summaryData.participants.join(', ')}</p>
                <p>Duur: {Math.floor(summaryData.duration / 60)}:{(summaryData.duration % 60).toString().padStart(2, '0')}</p>
              </div>
              <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Victor bereidt het eindoordeel voor…</p>
            </div>
          </div>
        )}

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="bg-black border-b-4 border-[var(--line)] text-white px-3 py-3 sm:px-6 sm:py-5 flex items-center gap-2 sm:gap-4 shrink-0">
          <Zap className="w-5 h-5 shrink-0 text-[var(--ink)] animate-pulse" />
          <div className="flex-1 min-w-0">
            <p className="font-black text-xs sm:text-base uppercase tracking-[0.2em] sm:tracking-[0.35em] text-[var(--ink)]">Live Debat</p>
            <p className="font-bold text-base sm:text-xl truncate text-white leading-tight">"{session.query}"</p>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {phase === 'live' && (
              <>
                <span className={`font-mono font-black text-lg tabular-nums ${duration >= 0 && timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-white/70'}`}>
                  {fmtTime(timeLeft)}
                </span>
                <button type="button" onClick={() => { setVoiceEnabled(v => !v); if (voiceEnabledRef.current) window.speechSynthesis?.cancel(); voiceEnabledRef.current = !voiceEnabledRef.current; }}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" title={voiceEnabled ? 'Geluid uit' : 'Geluid aan'}>
                  {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 opacity-40" />}
                </button>
                <button type="button" onClick={togglePause} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" title={isPaused ? 'Hervatten' : 'Pauzeren'}>
                  {isPaused ? <Play className="w-4 h-4 text-green-400" /> : <Pause className="w-4 h-4" />}
                </button>
                <button type="button" onClick={handleEnd} className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-green-500 hover:bg-green-400 text-white font-black text-xs sm:text-base uppercase tracking-widest rounded-lg transition-all" title="Debat beëindigen en oordeel ophalen">
                  <Gavel className="w-4 h-4" /> <span className="hidden sm:inline">Oordeel</span>
                </button>
              </>
            )}
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors ml-1" title="Debatruimte sluiten">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Duurkiezer ─────────────────────────────────────────── */}
        {phase === 'pick' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 sm:gap-8 p-4 sm:p-8">
            <div className="text-center">
              <Timer className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 text-[var(--ink)]" />
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-black uppercase tracking-tighter text-black dark:text-white">Hoe lang?</h2>
              <p className="text-sm sm:text-xl text-black dark:text-white/60 mt-2 sm:mt-3 font-bold">Je kunt het debat altijd vroegtijdig beëindigen.</p>
            </div>
            <div className="grid grid-cols-4 gap-3 w-full max-w-sm">
              {DURATION_OPTIONS.map(opt => (
                <button type="button" key={opt.label} onClick={() => setDuration(opt.seconds)}
                  className={`py-5 rounded-none border-4 font-black text-base uppercase transition-all ${
                    duration === opt.seconds
                      ? 'bg-black text-white border-black scale-105 shadow-md'
                      : 'bg-white text-black border-black/10 hover:border-[var(--line)] hover:text-[var(--ink)]'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-lg font-black uppercase tracking-widest text-[var(--ink)] text-center">
              <span>{readyMembers.length} analisten</span>
              <span>·</span>
              <span className="hidden sm:inline">{nlVoiceCount > 0 ? `${nlVoiceCount} NL stemmen` : 'Standaard stemmen'}</span>
            </div>
            <button type="button" onClick={handleStart}
              className="px-8 py-4 sm:px-16 sm:py-6 bg-black text-white font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-lg sm:text-xl rounded-none border-2 sm:border-4 border-black hover:bg-[var(--action)] hover:text-black transition-all shadow-md sm:shadow-lg">
              Debat starten
            </button>
          </div>
        )}

        {/* ── Chat ──────────────────────────────────────────────── */}
        {phase === 'live' && (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-4 bg-white dark:bg-black">
              {isPaused && (
                <div className="sticky top-0 text-center py-2 bg-[var(--action)] border-2 border-black rounded-none text-base font-black uppercase tracking-[0.3em] text-black shadow-[6px_6px_0_0_black]">
                  ⏸ Gepauzeerd — hervat of typ hieronder
                </div>
              )}

              {messages.map((msg, i) => {
                const isUser  = msg.memberId === 'user';
                const member  = isUser ? null : config.activeCouncil.find(m => m.id === msg.memberId);
                const nodeIdx = isUser ? -1 : readyMembers.findIndex(m => m.id === msg.memberId);
                const accent  = nodeIdx >= 0 ? ACCENT[nodeIdx % ACCENT.length] : '';

                return (
                  <div key={msg.id} className={`flex gap-2.5 items-end [animation-delay:${Math.min(i * 20, 200)}ms] ${isUser ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full shrink-0 overflow-hidden border-2 ${isUser ? 'border-black dark:border-white bg-black dark:bg-white' : 'border-zinc-300 dark:border-zinc-600'} flex items-center justify-center`}>
                      {isUser
                        ? <Users className="w-4 h-4 text-white dark:text-black" />
                        : <img src={member?.avatar} alt={member?.name ?? ''} className="w-full h-full object-cover" />}
                    </div>
                    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                      <span className="text-sm font-black uppercase tracking-widest text-[var(--ink)] mb-1 px-1">
                        {isUser ? 'Jij' : member?.name}
                      </span>
                      <div
                        className={`px-4 py-3 sm:px-6 sm:py-4 rounded-none text-base sm:text-xl leading-relaxed font-bold ${
                          isUser
                            ? 'bg-black text-white border-2 sm:border-4 border-black shadow-sm sm:shadow-md'
                            : `bg-white dark:bg-black text-black dark:text-white border-2 sm:border-4 border-black border-l-4 sm:border-l-8 ${accent} cursor-pointer hover:shadow-sm sm:hover:shadow-md transition-all shadow-md`
                        }`}
                        onClick={() => !isUser && setUserInput(prev => `${prev}> ${member?.name}: "${msg.content.substring(0, 60)}..."\n\n`)}
                        title={!isUser ? 'Klik om te citeren' : ''}
                      >
                        <ReactMarkdown disallowedElements={['script', 'iframe', 'object', 'embed']} unwrapDisallowed>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                );
              })}

              {isGenerating && !isPaused && (
                <div className="flex gap-2.5 items-end">
                  <div className="w-8 h-8 rounded-full shrink-0 overflow-hidden border-2 border-zinc-300 dark:border-zinc-600">
                    {generatingSpeaker
                      ? <img src={generatingSpeaker.avatar} alt={generatingSpeaker.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-zinc-200 dark:bg-zinc-700 animate-pulse" />}
                  </div>
                  <div className="flex flex-col items-start max-w-[85%]">
                    {generatingSpeaker && (
                      <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-[var(--ink)] mb-1 px-1 animate-pulse">
                        {generatingSpeaker.name} aan het woord...
                      </span>
                    )}
                    <div className="px-4 py-3 sm:px-6 sm:py-4 rounded-none bg-white dark:bg-black border-2 sm:border-4 border-black border-l-4 sm:border-l-8 border-l-zinc-400 shadow-md/20 sm:shadow-md/20 text-base sm:text-xl leading-relaxed text-black dark:text-white min-h-[3rem] sm:min-h-[4rem] font-bold">
                      {streamingText ? (
                        <span>{streamingText}<span className="inline-block w-1 h-5 sm:h-6 bg-[var(--action)] animate-pulse ml-1 align-middle" /></span>
                      ) : (
                        <div className="flex items-center h-12 sm:h-16 px-2">
                          <NodeLoader shape={loaderShapeForIndex(
                            generatingSpeaker
                              ? readyMembers.findIndex(m => m.id === generatingSpeaker.id)
                              : 0
                          )} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {messages.length === 0 && !isGenerating && (
                <div className="text-center py-12 text-black/20 dark:text-white/20">
                  <p className="font-black text-base uppercase tracking-widest animate-pulse">Deelnemers formuleren hun openingsstandpunt...</p>
                </div>
              )}
            </div>

            {/* ── Invoerbalk ─────────────────────────────────────── */}
            <div className="bg-white dark:bg-black border-t-2 sm:border-t-4 border-black px-2 py-3 sm:px-4 sm:py-6 flex gap-2 sm:gap-3 items-center shrink-0">
              <button type="button" onClick={toggleMic}
                className={`p-3 sm:p-4 rounded-none border-2 sm:border-4 border-black transition-all shrink-0 ${micActive ? 'bg-[var(--action)] text-black shadow-lg animate-pulse' : 'bg-white text-black hover:bg-[var(--action)] shadow-[4px_4px_0_0_black] sm:shadow-[6px_6px_0_0_black]'}`}
                title={micActive ? 'Stop opname' : 'Spreek in'}>
                {micActive ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <input type="text" value={userInput}
                onChange={e => setUserInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Doe mee..."
                className="flex-1 bg-white dark:bg-black border-2 sm:border-4 border-black rounded-none px-4 py-3 sm:px-6 sm:py-4 text-sm sm:text-xl font-black text-black dark:text-white placeholder:text-black/20 focus:shadow-sm sm:focus:shadow-md outline-none transition-all" />

              <button type="button" onClick={handleSend} disabled={!userInput.trim()} title="Verstuur bericht"
                className="p-3 sm:p-4 rounded-none bg-black text-white border-2 sm:border-4 border-black hover:bg-[var(--action)] hover:text-black disabled:opacity-20 transition-all shrink-0 shadow-[4px_4px_0_0_black] sm:shadow-[6px_6px_0_0_black]">
                <Send className="w-5 h-5" />
              </button>
              <button type="button" onClick={handleEnd}
                className="p-3 sm:p-4 rounded-none bg-green-500 hover:bg-green-400 text-white border-2 sm:border-4 border-black transition-all shrink-0 shadow-[4px_4px_0_0_black] sm:shadow-[6px_6px_0_0_black]" title="Beëindigen en samenvatten">
                <StopCircle className="w-5 h-5" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
