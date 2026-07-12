  import { FC, useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2, Eye, Swords, Brain,
  Lock, ChevronDown, Mic, BarChart3,
  BookOpen, Lightbulb,
} from "lucide-react";
import { SEO } from "./SEO";
import { PRICING } from "../constants";

// ── FAQ Data ────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: "Hoe werkt FAINL?",
    a: "FAINL stuurt jouw vraag tegelijk naar meerdere AI-modellen (Gemini, GPT-4, Claude, Llama en meer). Elk model analyseert de vraag onafhankelijk en geeft zijn eigen perspectief. Vervolgens debatteren ze live met elkaar — en jij kunt zelfs meedoen. De Voorzitter Victor synthetiseert alle inzichten tot één gewogen, gezaghebbend eindoordeel.",
  },
  {
    q: "Welke AI-modellen gebruikt FAINL?",
    a: "Standaard zijn er altijd 3 Google Gemini-nodes actief (gratis, geen sleutel nodig). Met de uitgebreide modus voeg je GPT-4, Anthropic Claude, Meta Llama via Groq, Mistral, DeepSeek en meer toe. Je kunt ook je eigen API-sleutels invoegen voor maximale controle.",
  },
  {
    q: "Is FAINL gratis te gebruiken?",
    a: "Ja! Nieuwe bezoekers krijgen twee volledige FAINL-sessies gratis — zonder account, zonder creditcard. Daarna kies je een creditpakket (vanaf €2,99 per credit) of een maandelijks abonnement.",
  },
  {
    q: "Waarom is FAINL beter dan één AI gebruiken?",
    a: "AI levert sterke structuur, frameworks en taalinspiratie — maar de specifieke context van jouw organisatie, sector en cultuur moet je zelf toevoegen. FAINL's gezamenlijke aanpak verhoogt betrouwbaarheid doordat modellen elkaars output kritisch toetsen, elkaars fouten corrigeren en argumenten uitwisselen. Het resultaat is dieper, gebalanceerder en aantoonbaar betrouwbaarder dan welk single-model antwoord ook.",
  },
  {
    q: "Worden mijn vragen en gegevens opgeslagen?",
    a: "Nee. Alle data wordt uitsluitend lokaal in jouw browser opgeslagen via localStorage. Er wordt niets naar onze servers gestuurd — tenzij je een account aanmaakt voor cloud-sessiehistorie. FAINL is privacy-first gebouwd.",
  },
  {
    q: "Kan ik zelf deelnemen aan het AI-debat?",
    a: "Absoluut. In de Live Debate Room kun je real-time meeschrijven of -spreken via je microfoon. De AI-nodes reageren direct op jouw input, adresseren jouw argumenten en passen hun redenering aan. Jij bent een volwaardige deelnemer.",
  },
  {
    q: "Voor wie is FAINL bedoeld?",
    a: "FAINL is ontworpen voor iedereen die complexe vragen stelt: ondernemers die strategische beslissingen nemen, studenten die onderzoek doen, journalisten die feiten checken, professionals die juridische of medische kwesties verkennen, en nieuwsgierige mensen die de diepste antwoorden willen.",
  },
];

// ── JSON-LD ─────────────────────────────────────────────────────────────────
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: "FAINL",
      url: "https://fainl.com",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      browserRequirements: "Requires JavaScript",
      description:
        "AI-platform dat meerdere AI-modellen (Gemini, GPT-4, Claude, Llama) tegelijk inzet voor diepgaande analyse, live debat en gewogen eindoordelen.",
      featureList: [
        "Multi-model Gezamenlijk Oordeel",
        "Live AI debatroom",
        "Spraakherkenning",
        "Chairman's Verdict synthese",
        "Lokale sessie-opslag",
        "Geen account vereist",
      ],
      offers: {
        "@type": "AggregateOffer",
        lowPrice: "0",
        highPrice: "119.99",
        priceCurrency: "EUR",
        offerCount: "5",
      },
    },
    {
      "@type": "Organization",
      name: "FAINL",
      url: "https://fainl.com",
      logo: "https://fainl.com/favicon.png",
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

// ── FAQItem ─────────────────────────────────────────────────────────────────
const FAQItem: FC<{ q: string; a: string }> = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-black/10 dark:border-white/10 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-5 text-left gap-4 group"
      >
        <span className="font-black text-base md:text-xl uppercase tracking-tight text-black dark:text-white group-hover:text-black transition-colors">
          {q}
        </span>
        <ChevronDown
          className={`w-6 h-6 shrink-0 text-black/40 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <p className="pb-5 text-lg md:text-xl text-black dark:text-white/80 leading-relaxed">
          {a}
        </p>
      )}
    </div>
  );
};

// ── AI Ticker Models ─────────────────────────────────────────────────────────
const AI_MODELS = [
  { name: "Google Gemini",    icon: <img src="/ai-logos/gemini-color.svg" alt="Google Gemini"    className="w-6 h-6 flex-shrink-0 object-contain" /> },
  { name: "OpenAI GPT",       icon: <img src="/ai-logos/openai.svg"        alt="OpenAI"           className="w-6 h-6 flex-shrink-0 object-contain" /> },
  { name: "Anthropic Claude", icon: <img src="/ai-logos/claude.svg"        alt="Anthropic Claude" className="w-6 h-6 flex-shrink-0 object-contain" /> },
  { name: "Mistral AI",       icon: <img src="/ai-logos/mistral.svg"       alt="Mistral AI"       className="w-6 h-6 flex-shrink-0 object-contain" /> },
  { name: "DeepSeek",         icon: <img src="/ai-logos/deepseek.svg"      alt="DeepSeek"         className="w-6 h-6 flex-shrink-0 object-contain" /> },
  { name: "Groq (Llama)",     icon: <img src="/ai-logos/groq.svg"          alt="Groq"             className="w-6 h-6 flex-shrink-0 object-contain" /> },
];




// ── Static Comparison Banner ────────────────────────────────────────────────
const HeroComparisonBanner: FC = () => {
  const bannerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const el = bannerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setIsVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={bannerRef} className="relative w-full max-w-6xl mx-auto px-4 md:px-8 mb-12 md:mb-20">
      <div className={`relative grid grid-cols-1 md:grid-cols-2 border-2 border-black overflow-hidden shadow-[12px_12px_0_0_rgba(0,0,0,0.1)] transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        
        {/* Central arrow badge — desktop only */}
        <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-white border-[3px] border-[#3B82F6] rounded-full items-center justify-center z-20">
          <ArrowRight className="w-6 h-6 text-[#3B82F6]" />
        </div>

        {/* ── Left: Single AI (problem) ── */}
        <div className="bg-white flex flex-col p-8 md:p-14 lg:p-16 border-b-2 md:border-b-0 md:border-r-2 border-black">
          {/* Box Header */}
          <div className="w-full flex-1 flex flex-col items-center text-center">
            {/* Icon */}
            <div className="h-28 flex items-center justify-center mb-2">
              <div className="relative w-16 h-16">
                <div className="absolute top-2 left-2 w-full h-full bg-[#E5E7EB]"></div>
                <div className="absolute top-0 left-0 w-full h-full bg-black flex items-center justify-center">
                  <Lightbulb className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
            
            <div className="h-24 flex flex-col items-center justify-center mb-6">
              <h3 className="text-3xl md:text-3xl lg:text-4xl font-black uppercase tracking-tighter text-black mb-2 leading-none whitespace-nowrap">
                Beperkte Visie
              </h3>
              <p className="text-[#3B82F6] font-bold text-[10px] md:text-xs uppercase tracking-[0.2em] whitespace-nowrap">
                Single AI-Model Beperking
              </p>
            </div>
            
            <div className="h-28 flex items-start justify-center">
              <p className="text-sm md:text-base font-bold text-black italic text-left max-w-[280px] w-full leading-snug">
                "Eén model klinkt overtuigend, maar blijft een geïsoleerde mening — gevoelig voor fouten en onvolledigheid."
              </p>
            </div>
          </div>

          {/* List Items */}
          <div className="w-full flex justify-center">
            <div className="w-full max-w-[280px] border-t-2 border-black pt-6 md:pt-8 space-y-4 text-left">
              {[
                ["01", "Hallucinatie Risico"],
                ["02", "Gebrek aan verificatie"],
                ["03", "Inconsistente logica"]
              ].map(([n, text]) => (
                <div key={n} className="flex items-center gap-4">
                  <span className="w-6 h-6 bg-black text-white text-[10px] sm:text-xs font-black shrink-0 flex items-center justify-center rounded-[2px]">
                    {n}
                  </span>
                  <span className="text-sm font-black text-black uppercase tracking-widest leading-none mt-0.5">
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: FAINL (solution) ── */}
        <div className="bg-[#05050A] flex flex-col p-8 md:p-14 lg:p-16">
          {/* Box Header */}
          <div className="w-full flex-1 flex flex-col items-center text-center">
            {/* Icon */}
            <div className="h-28 flex items-center justify-center mb-2">
              <div className="flex items-center">
                <div className="w-10 h-10 border border-white/20 flex items-center justify-center mr-0 relative right-[-2px] z-0">
                  <Lightbulb className="w-5 h-5 text-white/40" />
                </div>
                <div className="bg-zinc-900 w-20 h-20 md:w-24 md:h-24 flex flex-col items-center justify-center relative z-10">
                  <span className="font-black text-white text-2xl md:text-3xl leading-none tracking-tighter">
                    3x
                  </span>
                  <span className="font-extrabold text-white text-[9px] uppercase tracking-[0.25em] mt-1 ml-1">
                    Perspectief
                  </span>
                </div>
                <div className="w-10 h-10 border border-white/20 flex items-center justify-center ml-0 relative left-[-2px] z-0">
                  <Brain className="w-5 h-5 text-white/40" />
                </div>
              </div>
            </div>

            <div className="h-24 flex flex-col items-center justify-center mb-6">
              <h3 className="text-3xl md:text-3xl lg:text-4xl font-black uppercase tracking-tighter text-white mb-2 leading-none whitespace-nowrap">
                De FAINL Standaard
              </h3>
              <p className="text-white font-bold text-[10px] md:text-xs uppercase tracking-[0.2em] whitespace-nowrap">
                Maximale Validatie Protocol
              </p>
            </div>

            <div className="h-28 flex items-start justify-center">
              <p className="text-sm md:text-base font-bold text-white text-left max-w-[280px] w-full leading-snug">
                Activeer meerdere parallelle intelligenties. Laat ze debatteren. Krijg het best haalbare, gevalideerde antwoord.
              </p>
            </div>
          </div>

          {/* List Items */}
          <div className="w-full flex justify-center">
            <div className="w-full max-w-[280px] border-t-2 border-[#3B82F6] pt-6 md:pt-8 space-y-4 text-left">
              {[
                "Maximale Validatie",
                "Autonome Correctie",
                "Gegarandeerde Focus"
              ].map((text) => (
                <div key={text} className="flex items-center gap-4">
                  <span className="w-6 h-6 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-[#3B82F6]" />
                  </span>
                  <span className="text-sm font-black text-white uppercase tracking-widest leading-none mt-0.5">
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// ── Brand Break Line ──────────────────────────────────────────────────────────
const BrandBreakLine: FC = () => (
  <div className="w-full flex justify-center bg-transparent py-0 relative z-20">
    <div className="w-32 md:w-72 h-1.5 md:h-2 bg-black border-2 border-black shadow-sm"></div>
  </div>
);

// ── Hero Slides ──────────────────────────────────────────────────────────────
const HERO_SLIDES = [
  { top: "AI GEEFT EEN ANTWOORD.", bottomRest: "NL GEEFT HELDERHEID UIT MEERDERE AI'S." },
  { top: "AI GEEFT EEN MENING.", bottomRest: "NL GEEFT EEN HELDER EINDOORDEEL." },
  { top: "AI ANTWOORDT.", bottomRest: "NL WEEGT AF EN MAAKT HET HELDER." },
  { top: "ÉÉN MODEL REAGEERT.", bottomRest: "NL MAAKT HET GLASHELDER." },
  { top: "AI OP ZICHZELF IS BEPERKT.", bottomRest: "NL MAAKT COLLECTIEVE INTELLIGENTIE HELDER." },
];

// ── Main Component ───────────────────────────────────────────────────────────
export const LandingPage: FC = () => {
  const navigate = useNavigate();
  const [heroInput, setHeroInput] = useState('');
  const [isHeroFocused, setIsHeroFocused] = useState(false);
  const [heroSlideIdx, setHeroSlideIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setHeroSlideIdx((prev) => (prev + 1) % HERO_SLIDES.length);
        setFade(true);
      }, 500); // Wait for fade out
    }, 4500); // 4.5s total cycle
    return () => clearInterval(interval);
  }, []);

  const handleHeroSubmit = () => {
    const q = heroInput.trim();
    if (q) {
      navigate('/mission', { state: { autoQuery: q } });
    } else {
      navigate('/mission');
    }
  };

  return (
    <>
      <SEO
        title="FAINL — AI Eindoordeel Engine | Meerdere AI's. Één Antwoord."
        description="FAINL laat Gemini, GPT-4, Claude en Llama tegelijk jouw vraag analyseren, live debatteren en samen één scherp, gewogen eindoordeel geven. Twee sessies gratis, geen account nodig."
        canonical="/"
        keywords="AI eindoordeel engine, meerdere AI modellen vergelijken, AI debat tool, ChatGPT alternatief Nederland, Gemini GPT-4 Claude samen, AI beslissingstool, kunstmatige intelligentie tool gratis, multi-model AI"
        ogTitle="FAINL — Laat meerdere AI's voor jou debatteren"
        ogDescription="Gemini, GPT-4, Claude én Llama analyseren tegelijk jouw vraag en debatteren live. FAINL synthetiseert het scherpste AI-oordeel. Gratis proberen."
        jsonLd={JSON_LD}
      />

      {/* ══ HERO ══ */}
      <section
        aria-label="Introductie"
        className="relative w-full overflow-hidden bg-white text-[#0d1322] pt-20 md:pt-32 pb-6 md:pb-12 flex flex-col items-center group/hero"
      >

        <h1 className={`relative z-10 text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.95] text-center max-w-7xl mx-auto mb-6 sm:mb-10 text-black transition-opacity duration-500 ease-in-out ${fade ? 'opacity-100' : 'opacity-0'}`}>
          {HERO_SLIDES[heroSlideIdx].top}<br className="hidden md:block mb-2" />
          F<span className="text-[var(--ink)]">AI</span>{HERO_SLIDES[heroSlideIdx].bottomRest}
        </h1>

        {/* Action Buttons — prominent, directly under H1 */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4 w-full max-w-2xl mx-auto mb-5 sm:mb-8">
          <button
            type="button"
            onClick={() => navigate("/mission")}
            className="w-full sm:w-80 h-14 md:h-16 flex items-center justify-center bg-[var(--action)] text-white font-black text-sm md:text-lg uppercase tracking-[0.2em] border-2 md:border-4 border-black hover:bg-black hover:text-white transition-all duration-300 group shadow-[4px_4px_0_0_black] md:shadow-[8px_8px_0_0_black] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
          >
            Start gratis sessie
            <ArrowRight className="inline-block ml-3 w-5 h-5 md:w-6 md:h-6 transition-transform group-hover:translate-x-1" />
          </button>

          <Link
            to="/cookbook"
            className="w-full sm:w-80 h-14 md:h-16 flex items-center justify-center bg-white text-black font-black text-sm md:text-lg uppercase tracking-[0.2em] border-2 md:border-4 border-black hover:bg-[var(--action)] hover:text-white transition-all duration-300 text-center shadow-[4px_4px_0_0_black] md:shadow-[8px_8px_0_0_black] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
          >
            Voorbeeldvragen
          </Link>
        </div>

        {/* Inline Hero Input — remove friction, start directly from landing page */}
        <div className="relative z-10 w-full max-w-2xl mx-auto px-4 mb-8 md:mb-12">
          <div className={`relative bg-white border-2 md:border-4 border-black transition-all duration-200 ${isHeroFocused ? 'shadow-md' : 'shadow-[4px_4px_0_0_black]'}`}>
            <input
              type="text"
              value={heroInput}
              onChange={(e) => setHeroInput(e.target.value.slice(0, 300))}
              onFocus={() => setIsHeroFocused(true)}
              onBlur={() => setIsHeroFocused(false)}
              onKeyDown={(e) => e.key === 'Enter' && handleHeroSubmit()}
              placeholder="Stel je vraag direct... bijv. 'Is kernenergie de oplossing?'"
              aria-label="Stel je vraag aan de AI-raad"
              className="w-full bg-transparent border-none px-4 py-3 md:px-6 md:py-4 text-sm md:text-xl font-bold text-black placeholder-black/30 focus:ring-0 pr-14 md:pr-20"
            />
            <button
              type="button"
              onClick={handleHeroSubmit}
              aria-label="Vraag starten"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 bg-[var(--action)] text-white hover:bg-black transition-colors border-2 border-black"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          <p className="text-center text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-black/40 mt-3 md:mt-4">
            Twee sessies gratis · Geen account nodig
          </p>
        </div>

        {/* Text moved to H1 above */}

        {/* Brand break line */}
        <div className="relative z-10 w-32 md:w-72 mx-auto h-1.5 md:h-2 bg-black border-2 border-black shadow-sm mb-6 md:mb-12"></div>

        {/* Static Comparison Banner */}
        <HeroComparisonBanner />
      </section>

      {/* ══ FAINL BREAKDOWN ══ */}
      <BrandBreakLine />
      <section className="w-full bg-white pt-8 md:pt-16 pb-8 md:pb-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="mb-12 md:mb-20 max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-black uppercase tracking-tighter text-black mb-6 md:mb-8 leading-[0.9]">
              Van Twijfelachtig naar Zekerheid:<br />
              <span className="text-[var(--ink)]">AI Zonder Fratsen.</span>
            </h2>
            <p className="text-lg md:text-2xl font-bold text-black leading-relaxed max-w-2xl mx-auto">
              De enige standaard voor wie geen genoegen neemt met "waarschijnlijk waar".
            </p>
          </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
              <div className="group">
                <div className="text-5xl md:text-7xl font-black text-black group-hover:text-[var(--ink)] transition-colors duration-500 mb-2 md:mb-4">01</div>
                <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-black mb-2 md:mb-4">De Limiet van Eén</h3>
                <p className="text-base md:text-lg font-bold text-black leading-relaxed">
                  Eén AI-model is een tunnelvisie. Zelfs de beste modellen hallucineren. FAINL doorbreekt de isolatie van single-model antwoorden.
                </p>
              </div>
              <div className="group">
                <div className="text-5xl md:text-7xl font-black text-black group-hover:text-[var(--ink)] transition-colors duration-500 mb-2 md:mb-4">02</div>
                <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-black mb-2 md:mb-4">Collectieve Kracht</h3>
                <p className="text-base md:text-lg font-bold text-black leading-relaxed">
                  Wij zetten tot 6 top-modellen parallel aan het werk. Geen beïnvloeding, maar pure, rauwe intelligentie uit verschillende bronnen.
                </p>
              </div>
              <div className="group">
                <div className="text-5xl md:text-7xl font-black text-black group-hover:text-[var(--ink)] transition-colors duration-500 mb-2 md:mb-4">03</div>
                <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-black mb-2 md:mb-4">Het FAINL Protocol</h3>
                <p className="text-base md:text-lg font-bold text-black leading-relaxed">
                  Debat en verificatie zitten in ons DNA. Modellen corrigeren elkaar live, nog voordat jij het antwoord ziet.
                </p>
              </div>
              <div className="group">
                <div className="text-5xl md:text-7xl font-black text-black group-hover:text-[var(--ink)] transition-colors duration-500 mb-2 md:mb-4">04</div>
                <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-black mb-2 md:mb-4">Gevalideerde Antwoorden</h3>
                <p className="text-base md:text-lg font-bold text-black leading-relaxed">
                  Meerdere modellen corrigeren elkaars fouten en blinde vlekken. Het resultaat: dieper gewogen en beter onderbouwde antwoorden.
                </p>
              </div>
          </div>
        </div>
      </section>

      {/* ══ AI TICKER ══ */}
      <section
        aria-label="Ondersteunde AI-modellen"
        className="relative w-full border-y border-black/5 dark:border-white/5 bg-white dark:bg-zinc-900/50 py-5 overflow-hidden"
      >
        <style>{`
          @keyframes ai-ticker {
            from { transform: translateX(0); }
            to   { transform: translateX(-50%); }
          }
          .ai-ticker-track {
            animation: ai-ticker 40s linear infinite;
            will-change: transform;
          }
          .ai-ticker-track:hover { animation-play-state: paused; }
        `}</style>
        <div className="pointer-events-none absolute left-0 inset-y-0 w-16 bg-gradient-to-r from-white dark:from-zinc-900 to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 inset-y-0 w-16 bg-gradient-to-l from-white dark:from-zinc-900 to-transparent z-10" />
        <div className="flex overflow-hidden">
          <div className="ai-ticker-track flex items-center min-w-max">
            {[...AI_MODELS, ...AI_MODELS].map((model, i) => (
              <div key={i} className="flex items-center gap-2.5 px-7">
                {model.icon}
                <span className="text-lg font-black uppercase tracking-[0.18em] text-black dark:text-white/60 whitespace-nowrap">
                  {model.name}
                </span>
                <span className="ml-4 text-black dark:text-white/30 select-none text-lg">·</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOE HET WERKT ══ */}
      <div className="w-full bg-white dark:bg-black pt-8 md:pt-12"><BrandBreakLine /></div>
      <section
        aria-label="Hoe FAINL werkt"
        className="w-full max-w-5xl mx-auto px-4 md:px-6 pt-4 md:pt-8 pb-8 md:pb-16"
      >
        <h2 className="text-center text-3xl sm:text-4xl md:text-6xl font-black uppercase tracking-tighter text-black dark:text-white mb-4 sm:mb-6">
          HOE WERKT HET?
        </h2>
        <p className="text-center text-lg md:text-2xl text-black dark:text-white/60 font-bold mb-12 md:mb-24 max-w-2xl mx-auto leading-relaxed">
          Van jouw vraag tot het ultieme eindoordeel — in vijf geavanceerde, geautomatiseerde stappen door het FAINL protocol.
        </p>

        <ol className="grid grid-cols-1 gap-6">
          {[
            {
              img: "/general icons/question-icon.png",
              title: "Stel je vraag",
              desc: "Zakelijk, juridisch of strategisch. Het maakt niet uit. Onze engine herkent de diepste context van je input.",
            },
            {
              img: "/general icons/AI-Analyse-icon.png",
              title: "Parallelle Analyse",
              desc: "Tot 6 AI-modellen worden tegelijk geactiveerd. Ze analyseren je vraag onafhankelijk van elkaar om tunnelvisie te voorkomen.",
            },
            {
              img: "/general icons/reading-icon.png",
              title: "Volledige Transparantie",
              desc: "Zie live wat elk model concludeert. Wij filteren niets. Jij hebt de controle over wie wat zegt.",
            },
            {
              img: "/general icons/live-debate-icon.png",
              title: "Live Debat Protocol",
              desc: "De modellen vallen elkaars logica aan. Zwakke argumenten worden verworpen, sterke inzichten blijven staan.",
            },
            {
              img: "/general icons/verdict-icon.png",
              title: "Het Eindoordeel",
              desc: "Voorzitter Victor weegt alle argumenten en levert één messcherpe, onderbouwde conclusie.",
            },
          ].map(({ img, title, desc }, idx) => (
            <li
              key={title}
              className="group flex flex-col md:flex-row items-center md:items-start gap-8 p-8 md:p-12 bg-white dark:bg-black border-2 border-black rounded-none hover:border-[var(--line)] hover:shadow-lg transition-all duration-300"
            >
              <div className="flex-shrink-0 w-20 h-20 flex items-center justify-center bg-black text-white relative">
                 <span className="absolute -top-3 -left-3 w-8 h-8 bg-[var(--action)] text-white font-black flex items-center justify-center text-sm">0{idx+1}</span>
                <img src={img} alt={title} className="w-10 h-10 object-contain invert" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-black dark:text-white mb-4">
                  {title}
                </h3>
                <p className="text-lg md:text-xl font-bold text-black dark:text-white/60 leading-relaxed">
                  {desc}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ══ WAAROM FAINL ══ */}
      <BrandBreakLine />
      <section
        aria-label="Kernfuncties van FAINL"
        className="w-full bg-white dark:bg-black pt-8 md:pt-16 pb-8 md:pb-16"
      >
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-black uppercase tracking-tighter text-black dark:text-white mb-4 sm:mb-6 text-center">
            WAAROM FAINL?
          </h2>
          <p className="text-center text-lg md:text-2xl text-black dark:text-white/60 font-bold mb-12 md:mb-24 max-w-2xl mx-auto leading-relaxed">
            Gebouwd voor wie niet genoeg heeft aan een "waarschijnlijk" antwoord. Expertise door collectie.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "Multimodel Protocol",
                desc: "Geen enkel model heeft altijd gelijk. FAINL bundelt Gemini, Claude, GPT en Llama in één slim protocol dat antwoorden vergelijkt en aanscherpt.",
              },
              {
                icon: Swords,
                title: "Live Debatruimte",
                desc: "Laat AI-modellen live met elkaar in discussie gaan. Elk argument wordt in real time getest, bevraagd en aangescherpt door de concurrentie.",
              },
              {
                icon: Mic,
                title: "Spraakherkenning",
                desc: "Spreek je input eenvoudig in. FAINL zet je woorden direct om naar tekst en brengt ze meteen in het live debat voor snelle interactie.",
              },
              {
                icon: Eye,
                title: "Volledige Transparantie",
                desc: "Zie exact hoe ieder model redeneert. Geen verborgen filters. Jij ziet de afzonderlijke output en bepaalt welk inzicht het sterkst is.",
              },
              {
                icon: Lock,
                title: "Privacy Architectuur",
                desc: "Jouw sessies blijven lokaal. Vragen worden anoniem via onze proxy verstuurd, zonder accountkoppeling of onnodige profilering.",
              },
              {
                icon: BarChart3,
                title: "Gewogen Eindoordeel",
                desc: "Voorzitter Victor synthetiseert alle inzichten tot één helder en onderbouwd eindoordeel, gericht op scherpte en direct toepasbare actie.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <article
                key={title}
                className="bg-white dark:bg-black border-2 border-black rounded-none p-6 sm:p-8 md:p-10 hover:border-[var(--line)] hover:shadow-md md:hover:shadow-lg transition-all duration-300 group"
              >
                <div className="w-12 h-12 md:w-16 md:h-16 bg-black flex items-center justify-center mb-6 md:mb-8 group-hover:bg-[var(--action)] transition-colors duration-500">
                  <Icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <h3 className="font-black text-xl md:text-2xl uppercase tracking-tighter text-black dark:text-white mb-4 md:mb-6">
                  {title}
                </h3>
                <p className="text-base md:text-lg font-bold text-black dark:text-white/50 leading-relaxed">{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SOCIAL PROOF ══ */}
      <BrandBreakLine />
      <section className="max-w-5xl mx-auto px-5 sm:px-8 py-16 md:py-24">
        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-black dark:text-white text-center mb-4">
          Wat gebruikers zeggen
        </h2>
        <p className="text-center text-sm font-bold text-black/50 dark:text-white/40 uppercase tracking-widest mb-12">
          Binnenkort: echte gebruikerservaringen
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { quote: "Eindelijk een tool die niet één mening geeft, maar me laat zien waar de experts het over eens zijn.", name: "M. de Vries", role: "Ondernemer", stars: 5 },
            { quote: "Het live debat is fascinerend. Je ziet letterlijk hoe AI-modellen elkaars argumenten aanscherpen.", name: "L. Bakker", role: "Consultant", stars: 5 },
            { quote: "Ik gebruik FAINL voor strategische beslissingen. Het eindoordeel is altijd genuanceerder dan wat één AI levert.", name: "J. Smit", role: "Startup Founder", stars: 5 },
          ].map(({ quote, name, role, stars }) => (
            <div key={name} className="bg-white dark:bg-black border-2 border-black/10 dark:border-white/10 p-6 md:p-8 flex flex-col gap-4">
              <div className="flex gap-0.5">
                {Array.from({ length: stars }).map((_, i) => (
                  <span key={i} className="text-[var(--action)] text-sm">★</span>
                ))}
              </div>
              <p className="text-base font-bold text-black dark:text-white/80 leading-relaxed italic">"{quote}"</p>
              <div className="mt-auto pt-2 border-t border-black/5 dark:border-white/5">
                <p className="text-sm font-black text-black dark:text-white">{name}</p>
                <p className="text-xs font-bold text-black/50 dark:text-white/40">{role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ VERGELIJKING ══ */}
      <BrandBreakLine />
      <section
        aria-label="FAINL versus gewone AI-tools"
        className="w-full bg-white dark:bg-black pt-8 md:pt-16 pb-8 md:pb-16"
      >
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-black uppercase tracking-tighter text-black dark:text-white mb-4 sm:mb-6 text-center">
            FAINL <span className="text-[var(--ink)]">VS.</span> GEWONE AI
          </h2>
          <p className="text-center text-lg md:text-2xl text-black dark:text-white/60 font-bold mb-10 md:mb-24 leading-relaxed">
            Waarom is één model nooit genoeg voor kritische vragen?
          </p>

          <div className="border-2 border-black dark:border-white/20 overflow-hidden shadow-md md:shadow-lg">
            {/* Column headers */}
            <div className="grid grid-cols-[1fr_80px_80px] sm:grid-cols-[1fr_140px_140px] bg-black text-white px-6 py-6 gap-4">
              <span className="font-black uppercase tracking-[0.2em] text-sm text-text-black">Protocol Check</span>
              <span className="font-black uppercase tracking-[0.2em] text-sm text-center text-text-black">Single AI</span>
              <span className="font-black uppercase tracking-[0.2em] text-sm text-center text-[var(--ink)]">FAINL</span>
            </div>

            {/* Rows */}
            <div className="divide-y-2 divide-black/5 bg-white dark:bg-black">
              {([
                ["Parallelle Intelligentie (Tot 6 Modellen)", false, true],
                ["Live Adversarial Debat", false, true],
                ["Autonome Foutcorrectie", false, true],
                [" Chairman's Verdict Synthese", false, true],
                ["Volledige Bron Transparantie", false, true],
                ["Privacy-First Proxy Layer", "Beperkt", true],
                ["Gegarandeerd Eindoordeel", false, true],
              ] as [string, boolean | string, boolean][]).map(([label, single, fainl]) => (
                <div
                  key={label}
                  className="grid grid-cols-[1fr_80px_80px] sm:grid-cols-[1fr_140px_140px] items-center px-4 py-4 sm:px-6 sm:py-6 gap-2 sm:gap-4 hover:bg-zinc-50 dark:hover:bg-[var(--action)]/5 transition-colors duration-200"
                >
                  <span className="font-black uppercase tracking-tight text-sm sm:text-lg md:text-xl text-black dark:text-white">
                    {label}
                  </span>
                  <span className="flex items-center justify-center">
                    {single === true ? (
                      <CheckCircle2 className="w-6 h-6 text-[var(--ink)]" />
                    ) : single === false ? (
                      <span className="w-6 h-6 flex items-center justify-center bg-black/5 text-black/20 font-black text-xs">✕</span>
                    ) : (
                      <span className="text-[10px] font-black uppercase text-black text-center leading-tight">{single}</span>
                    )}
                  </span>
                  <span className="flex items-center justify-center">
                    {fainl ? (
                      <CheckCircle2 className="w-8 h-8 text-[var(--ink)] drop-shadow-[0_0_10px_rgba(3,179,144,0.3)]" />
                    ) : (
                      <span className="w-6 h-6 flex items-center justify-center bg-black/5 text-black/20 font-black text-xs">✕</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ FAQ ══ */}
      <BrandBreakLine />
      <section
        aria-label="FAQ over FAINL"
        className="w-full bg-white dark:bg-black pt-8 md:pt-16 pb-8 md:pb-16"
      >
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-black uppercase tracking-tighter text-black dark:text-white mb-4 sm:mb-6 text-center">
            FAQ
          </h2>
          <p className="text-center text-lg md:text-2xl text-black dark:text-white/60 font-bold mb-10 md:mb-24 leading-relaxed">
            Alles wat je moet weten over het FAINL Protocol.
          </p>

          <div className="bg-white dark:bg-black border-2 border-black rounded-none px-6 md:px-12 divide-y-2 divide-black/5">
            {FAQS.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>

          <p className="text-center mt-12 text-lg font-black uppercase tracking-widest text-[var(--ink)]">
            Meer vragen?{" "}
            <Link to="/faq" className="underline hover:text-black transition-colors">Bekijk volledige FAQ</Link>
            {" "}of{" "}
            <Link to="/contact" className="underline hover:text-black transition-colors">Neem contact op</Link>
          </p>
        </div>
      </section>

      {/* ══ PRIJZEN ══ */}
      <BrandBreakLine />
      <section
        aria-label="Prijzen en abonnementen"
        className="w-full bg-white dark:bg-black pt-8 md:pt-16 pb-8 md:pb-16"
      >
        <div className="max-w-6xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-black uppercase tracking-tighter text-black dark:text-white mb-4 sm:mb-6">
            EERLIJKE PRIJS
          </h2>
          <p className="text-lg md:text-2xl text-black dark:text-white/60 font-bold mb-12 md:mb-24 leading-relaxed max-w-2xl mx-auto">
            Geen verborgen kosten. Betaal voor wat je gebruikt. Start vandaag met twee gratis sessies.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {PRICING.CREDITS.slice(0, 3).map((pkg) => (
              <button
                key={pkg.count}
                type="button"
                onClick={() => navigate('/tokens')}
                className="flex flex-col items-center justify-center p-6 sm:p-10 bg-white dark:bg-black border-2 md:border-4 border-black rounded-none hover:border-[var(--line)] hover:shadow-md md:hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="text-5xl sm:text-6xl font-black mb-2 text-black dark:text-white">{pkg.count}</div>
                <div className="text-lg font-black uppercase tracking-[0.3em] text-[var(--ink)] mb-6">
                  CREDITS
                </div>
                <div className="text-4xl font-black text-black dark:text-white">€{pkg.price}</div>
              </button>
            ))}

            <button
              type="button"
              onClick={() => navigate('/tokens')}
              className="flex flex-col items-center justify-center p-10 bg-black text-white border-2 border-black rounded-none hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative group"
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[var(--action)] text-black text-sm font-black uppercase tracking-[0.2em] whitespace-nowrap">
                Abonnement
              </div>
              <div className="text-3xl font-black uppercase tracking-tighter mb-2 text-white">
                {PRICING.SUBSCRIPTIONS[0].name}
              </div>
              <div className="text-lg font-black uppercase tracking-[0.3em] text-[var(--ink)] mb-6">
                {PRICING.SUBSCRIPTIONS[0].creditsPerMonth} CREDITS/MO
              </div>
              <div className="text-4xl font-black text-white">€{PRICING.SUBSCRIPTIONS[0].price}</div>
              <div className="text-lg font-black text-white/40 mt-2 uppercase tracking-widest">
                per maand
              </div>
            </button>
          </div>

          <p className="text-center text-lg font-black uppercase tracking-widest text-black/50">
            <Link to="/tokens" className="inline-flex items-center gap-3 underline hover:text-[var(--ink)] transition-colors">
              Bekijk alle pakketten
              <ArrowRight className="w-5 h-5" />
            </Link>
          </p>
        </div>
      </section>

      {/* ══ FINAL CTA ══ */}
      <BrandBreakLine />
      <section
        aria-label="Aan de slag met FAINL"
        className="w-full bg-white dark:bg-black pt-12 md:pt-20 pb-12 sm:pb-24 md:pb-32 flex flex-col items-center text-center"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-4xl sm:text-5xl md:text-8xl font-black uppercase tracking-tighter text-black dark:text-white leading-[0.8] mb-6 md:mb-10">
            Klaar voor de<br /><span className="text-[var(--ink)]">Waarheid?</span>
          </h2>
          <p className="text-lg sm:text-xl md:text-3xl font-bold text-black dark:text-white/60 mb-10 md:mb-16 max-w-2xl mx-auto leading-tight italic">
            "Stel je vraag. Laat de modellen strijden. Ontvang het enige antwoord dat telt."
          </p>

          <button
            type="button"
            onClick={() => navigate("/mission")}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-3 sm:gap-4 px-8 py-5 sm:px-16 sm:py-8 bg-black text-white font-black text-base sm:text-xl uppercase tracking-[0.2em] md:tracking-[0.3em] border-2 sm:border-4 border-black hover:bg-white hover:text-black transition-all duration-500 group shadow-md md:shadow-lg hover:shadow-none hover:translate-x-2 hover:translate-y-2"
          >
            Start Gratis Sessie
            <ArrowRight className="w-8 h-8 transition-transform group-hover:translate-x-4" />
          </button>
          
          <p className="mt-8 text-xs font-black uppercase tracking-[0.4em] text-black">
            Twee sessies gratis — Geen creditcard vereist.
          </p>
        </div>
      </section>
    </>
  );
};
