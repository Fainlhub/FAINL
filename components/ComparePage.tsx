import { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import { SEO } from './SEO';

// ── Types ─────────────────────────────────────────────────────────────────────
type Rating = 1 | 2 | 3 | 4 | 5;

interface ModelCard {
  name: string;
  maker: string;
  headerBg: string;
  headerText: string;
  logo: string;
  tagline: string;
  strengths: string[];
  weaknesses: string[];
}

interface TableRow {
  criterium: string;
  chatgpt: Rating;
  gemini: Rating;
  claude: Rating;
}

// ── Data ──────────────────────────────────────────────────────────────────────
const MODELS: ModelCard[] = [
  {
    name: 'ChatGPT',
    maker: 'OpenAI',
    headerBg: 'bg-black',
    headerText: 'text-white',
    logo: '/ai-logos/openai.svg',
    tagline: 'De pionier. Breed inzetbaar, sterk in creativiteit en code.',
    strengths: [
      'Creatief schrijven & brainstorm',
      'Code genereren & debuggen',
      'Brede algemene kennisbasis',
      'Uitgebreid plugins-ecosysteem',
    ],
    weaknesses: [
      'Hallucinaties bij feitelijke vragen',
      'Minder sterk in lange documenten',
      'Kennis beperkt tot trainingsdata',
    ],
  },
  {
    name: 'Gemini',
    maker: 'Google',
    headerBg: 'bg-blue-600',
    headerText: 'text-white',
    logo: '/ai-logos/gemini-color.svg',
    tagline: 'De data-machine. Actueel, multimodaal, Google-geïntegreerd.',
    strengths: [
      'Actuele informatie via Google Search',
      'Multimodale input (beeld, audio)',
      'Sterk in feitelijke zoekopdrachten',
      'Diep geïntegreerd met Google Workspace',
    ],
    weaknesses: [
      'Soms te voorzichtig en repetitief',
      'Minder diepgang op niche-topics',
      'Inconsistent bij complexe redeneringen',
    ],
  },
  {
    name: 'Claude',
    maker: 'Anthropic',
    headerBg: 'bg-amber-500',
    headerText: 'text-black',
    logo: '/ai-logos/claude.svg',
    tagline: 'De analist. Veilig, genuanceerd, sterk op lange documenten.',
    strengths: [
      'Lange documenten analyseren',
      'Genuanceerde & veilige antwoorden',
      'Hoge feitelijke nauwkeurigheid',
      'Sterk in redeneren & ethische afwegingen',
    ],
    weaknesses: [
      'Soms te voorzichtig / terughoudend',
      'Minder creatief dan ChatGPT',
      'Kleinere bruikbare context bij zware taken',
    ],
  },
];

const TABLE_ROWS: TableRow[] = [
  { criterium: 'Creativiteit & schrijven',       chatgpt: 5, gemini: 3, claude: 4 },
  { criterium: 'Feitelijke nauwkeurigheid',       chatgpt: 3, gemini: 4, claude: 5 },
  { criterium: 'Lange documenten analyseren',     chatgpt: 3, gemini: 4, claude: 5 },
  { criterium: 'Actuele informatie',              chatgpt: 3, gemini: 5, claude: 3 },
  { criterium: 'Code genereren & debuggen',       chatgpt: 5, gemini: 4, claude: 4 },
  { criterium: 'Nuance & veiligheid',             chatgpt: 3, gemini: 4, claude: 5 },
  { criterium: 'Snelheid',                        chatgpt: 4, gemini: 5, claude: 4 },
  { criterium: 'Multimodale input (beeld/audio)', chatgpt: 4, gemini: 5, claude: 3 },
];

const FAQS = [
  {
    q: 'Is ChatGPT beter dan Gemini?',
    a: 'Voor creatieve taken en code scoort ChatGPT doorgaans hoger. Gemini heeft een voordeel bij actuele informatie dankzij Google Search-integratie. Voor nuance en lange documenten is Claude sterker. Het antwoord hangt af van je vraag — daarom combineert FAINL alle drie.',
  },
  {
    q: 'Welke AI is het meest nauwkeurig?',
    a: "Nauwkeurigheid varieert sterk per vraagtype. Claude scoort hoog op feitelijke consistentie, maar geen enkel model is altijd het beste. FAINL's multi-model consensus reduceert foutmarges doordat modellen elkaars antwoorden toetsen.",
  },
  {
    q: 'Kan ik ChatGPT, Gemini en Claude gratis proberen?',
    a: 'Alle drie bieden gratis basisversies. Met FAINL krijg je twee gratis sessies waarin alle modellen parallel werken — zonder dat je drie aparte accounts nodig hebt.',
  },
  {
    q: 'Wat als de modellen het niet eens zijn?',
    a: "Juist dat is waardevol. Meningsverschillen signaleren onzekerheid of complexiteit. FAINL's Chairman's Verdict weegt de argumenten en geeft een gemotiveerd eindoordeel — inclusief de kanttekeningen.",
  },
  {
    q: 'Maakt FAINL gebruik van de gratis of betaalde modelversies?',
    a: 'FAINL gebruikt de officiële API\'s van OpenAI, Google en Anthropic — dezelfde modellen als de betaalde tiers van ChatGPT Plus, Gemini Advanced en Claude Pro.',
  },
];

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      headline: 'ChatGPT vs Gemini vs Claude: Welke AI wint in 2026?',
      description:
        'Vergelijk ChatGPT (OpenAI), Google Gemini en Anthropic Claude op creativiteit, nauwkeurigheid, snelheid en kosten. Inclusief vergelijkingstabel en FAINL als multi-model alternatief.',
      url: 'https://www.fainl.com/vergelijk/chatgpt-vs-gemini-vs-claude',
      datePublished: '2026-03-11',
      dateModified: '2026-03-11',
      author: { '@type': 'Organization', name: 'FAINL', url: 'https://www.fainl.com' },
      publisher: {
        '@type': 'Organization',
        name: 'FAINL',
        logo: { '@type': 'ImageObject', url: 'https://www.fainl.com/favicon.png' },
      },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home',    item: 'https://www.fainl.com/' },
        { '@type': 'ListItem', position: 2, name: 'Vergelijk', item: 'https://www.fainl.com/vergelijk' },
        { '@type': 'ListItem', position: 3, name: 'ChatGPT vs Gemini vs Claude', item: 'https://www.fainl.com/vergelijk/chatgpt-vs-gemini-vs-claude' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQS.map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ],
};

// ── Sub-components ────────────────────────────────────────────────────────────
const Dots: FC<{ rating: Rating }> = ({ rating }) => (
  <div className="flex items-center gap-1.5 justify-center" aria-label={`${rating} van 5`}>
    {([1, 2, 3, 4, 5] as Rating[]).map(i => (
      <div
        key={i}
        className={`w-3.5 h-3.5 rounded-full ${i <= rating ? 'bg-[var(--ink)]' : 'bg-black/10 dark:bg-white/20'}`}
      />
    ))}
  </div>
);

// ── Page ──────────────────────────────────────────────────────────────────────
export const ComparePage: FC = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <SEO
        title="ChatGPT vs Gemini vs Claude: Welke AI wint in 2026?"
        description="Vergelijk ChatGPT, Google Gemini en Anthropic Claude op creativiteit, nauwkeurigheid, snelheid en kosten. Inclusief vergelijkingstabel. Of gebruik FAINL en laat ze samenwerken."
        canonical="/vergelijk/chatgpt-vs-gemini-vs-claude"
        keywords="ChatGPT vs Gemini, ChatGPT vs Claude, beste AI model 2026, AI vergelijking Nederland, Gemini vs Claude, welke AI is het beste, AI modellen vergelijken"
        ogTitle="ChatGPT vs Gemini vs Claude — Welke AI is het beste?"
        ogDescription="Diepgaande vergelijking van de drie populairste AI-modellen op creativiteit, nauwkeurigheid en snelheid. Of gebruik FAINL en laat ze samenwerken."
        jsonLd={JSON_LD}
      />

      {/* ── Breadcrumb ── */}
      <nav aria-label="Breadcrumb" className="max-w-4xl mx-auto px-5 sm:px-8 pt-6">
        <ol className="flex items-center gap-2 text-base font-black uppercase tracking-widest text-black dark:text-white/30">
          <li>
            <button type="button" onClick={() => navigate('/')} className="hover:text-black dark:hover:text-white transition-colors">
              Home
            </button>
          </li>
          <li>/</li>
          <li className="text-black dark:text-white/50">Vergelijk</li>
          <li>/</li>
          <li className="text-black dark:text-white">ChatGPT vs Gemini vs Claude</li>
        </ol>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-4xl mx-auto px-5 sm:px-8 pt-10 pb-14 md:pt-14 md:pb-20">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-black dark:bg-[var(--ink)] text-white dark:text-black text-lg font-black uppercase tracking-[0.25em] rounded-none mb-6">
          Vergelijking 2026
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black uppercase tracking-tighter text-black dark:text-white leading-[1.05] mb-6">
          ChatGPT, Gemini of Claude:{' '}
          <span className="text-[var(--ink)]">welke AI wint?</span>
        </h1>
        <p className="text-xl sm:text-2xl text-black dark:text-white/80 leading-relaxed max-w-2xl mb-8">
          De drie populairste AI-modellen geven elk een ander antwoord op dezelfde vraag.
          ChatGPT scoort op creativiteit, Gemini op actuele data, Claude op nuance en veiligheid.{' '}
          <strong className="text-black dark:text-[var(--ink)]">
            De eerlijke conclusie: het beste model hangt af van je vraag.
          </strong>
        </p>
        <button
          type="button"
          onClick={() => navigate('/mission')}
          className="inline-flex items-center gap-4 px-10 py-5 bg-black dark:bg-[var(--ink)] text-white dark:text-black font-black text-lg md:text-xl uppercase tracking-widest rounded-none hover:bg-[var(--ink)] hover:text-black dark:hover:bg-white transition-all shadow-lg"
        >
          Probeer gratis — alle drie tegelijk
          <ArrowRight className="w-5 h-5" />
        </button>
      </section>

      {/* ── Model Cards ── */}
      <section aria-label="Model overzicht" className="max-w-4xl mx-auto px-5 sm:px-8 pb-16">
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black dark:text-white mb-6">
          De drie modellen op een rij
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MODELS.map(model => (
            <div
              key={model.name}
              className="border-4 border-black dark:border-[var(--ink)] rounded-none overflow-hidden shadow-md dark:shadow-md"
            >
              <div className={`${model.headerBg} px-5 py-4 flex items-center gap-3`}>
                <img src={model.logo} alt={model.name} className="w-7 h-7 object-contain shrink-0" />
                <div>
                  <p className={`font-black text-lg leading-none ${model.headerText}`}>{model.name}</p>
                  <p className={`text-base font-bold uppercase tracking-widest opacity-60 ${model.headerText}`}>{model.maker}</p>
                </div>
              </div>
              <div className="bg-white dark:bg-black px-5 py-6">
                <p className="text-lg text-black dark:text-white/50 leading-relaxed mb-6 italic">"{model.tagline}"</p>
                <div className="space-y-3 mb-4">
                  {model.strengths.map(s => (
                    <div key={s} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[var(--ink)] shrink-0 mt-0.5" />
                      <span className="text-lg text-black dark:text-white/80 leading-snug">{s}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t-2 border-black/10 dark:border-[var(--ink)]/20 pt-4 space-y-3">
                  {model.weaknesses.map(w => (
                    <div key={w} className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <span className="text-lg text-black dark:text-white/40 leading-snug">{w}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Comparison Table ── */}
      <section aria-label="Vergelijkingstabel" className="max-w-4xl mx-auto px-5 sm:px-8 pb-16">
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black dark:text-white mb-6">
          Vergelijkingstabel
        </h2>
        <div className="overflow-x-auto rounded-none border-4 border-black dark:border-[var(--ink)] shadow-md dark:shadow-md">
          <table className="w-full text-lg">
            <thead>
              <tr className="bg-black dark:bg-[var(--ink)]">
                <th className="text-left px-6 py-5 text-white dark:text-black text-lg font-black uppercase tracking-widest w-1/2">Criterium</th>
                <th className="px-4 py-5 text-white dark:text-black text-lg font-black uppercase tracking-widest text-center">ChatGPT</th>
                <th className="px-4 py-5 text-white dark:text-black text-lg font-black uppercase tracking-widest text-center">Gemini</th>
                <th className="px-4 py-5 text-white dark:text-black text-lg font-black uppercase tracking-widest text-center">Claude</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 dark:divide-white/10 bg-white dark:bg-zinc-900">
              {TABLE_ROWS.map(row => (
                <tr key={row.criterium} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-black dark:text-white">{row.criterium}</td>
                  <td className="px-4 py-3.5"><Dots rating={row.chatgpt} /></td>
                  <td className="px-4 py-3.5"><Dots rating={row.gemini} /></td>
                  <td className="px-4 py-3.5"><Dots rating={row.claude} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-lg text-black dark:text-white/40 font-bold uppercase tracking-widest">
          Scores gebaseerd op onafhankelijke benchmarks en gebruikerservaringen. Geen enkel model is altijd het beste — het hangt af van de vraag.
        </p>
      </section>

      {/* ── FAINL CTA block ── */}
      <section aria-label="Waarom FAINL" className="max-w-4xl mx-auto px-5 sm:px-8 pb-16">
        <div className="bg-black dark:bg-[var(--ink)] rounded-none p-10 md:p-16 shadow-lg dark:shadow-lg">
          <div className="flex items-start gap-6 mb-10">
            <MinusCircle className="w-10 h-10 text-white dark:text-black shrink-0 mt-1" />
            <div>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white dark:text-black mb-4 leading-tight">
                Waarom kiezen als je alles kunt combineren?
              </h2>
              <p className="text-white/80 dark:text-black leading-relaxed text-xl md:text-2xl">
                Eén model kiezen betekent de zwaktes van dat model accepteren.
                FAINL laat ChatGPT, Gemini én Claude tegelijk werken — ze analyseren
                parallel, bevragen elkaars redenering en worden samengevat tot één
                gewogen eindoordeel.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            {[
              { step: '01', label: 'Stel je vraag',    desc: 'Één keer typen, drie modellen aan het werk' },
              { step: '02', label: 'Live debat',        desc: 'Modellen bekritiseren elkaars redenering' },
              { step: '03', label: "Chairman's Verdict", desc: 'Eén gewogen eindoordeel met nuance' },
            ].map(item => (
              <div key={item.step} className="bg-white/10 dark:bg-black/10 p-6 border-2 border-white/20 dark:border-black/20">
                <p className="text-[var(--ink)] dark:text-black font-black text-xl uppercase tracking-[0.3em] mb-2">{item.step}</p>
                <p className="font-black text-xl uppercase tracking-tight text-white dark:text-black mb-2">{item.label}</p>
                <p className="text-white/60 dark:text-black text-lg leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => navigate('/mission')}
            className="inline-flex items-center gap-4 px-10 py-5 bg-[var(--ink)] dark:bg-black text-black dark:text-white font-black text-lg md:text-xl uppercase tracking-widest rounded-none hover:bg-white hover:text-black transition-all shadow-lg"
          >
            Start gratis — twee sessies, geen account nodig
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section aria-label="FAQ" className="max-w-4xl mx-auto px-5 sm:px-8 pb-24">
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black dark:text-white mb-6">
          FAQ
        </h2>
        <div className="border-2 border-black dark:border-white/20 rounded-2xl px-6 bg-white dark:bg-zinc-900">
          {FAQS.map((faq, i) => (
            <div key={i} className="border-b border-black/10 dark:border-white/10 last:border-0">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-start justify-between py-5 text-left gap-4 group"
              >
                <span className="font-black text-base md:text-lg uppercase tracking-tight text-black dark:text-white group-hover:text-black transition-colors">
                  {faq.q}
                </span>
                <span className="text-black dark:text-white/40 text-xl leading-none mt-0.5 shrink-0">
                  {openFaq === i ? '−' : '+'}
                </span>
              </button>
              {openFaq === i && (
                <p className="pb-5 text-base text-black dark:text-white/60 leading-relaxed">{faq.a}</p>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
};
