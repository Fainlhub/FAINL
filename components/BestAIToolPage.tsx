import { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, X, Crown } from 'lucide-react';
import { SEO } from './SEO';

const TOOLS = [
  {
    name: 'ChatGPT',
    tagline: 'De bekendste AI-assistent ter wereld',
    pros: ['Enorm trainingskorpus', 'Sterk in creatief schrijven', 'GPT-4o multimodaal', 'Groot plugin-ecosysteem'],
    cons: ['Eén perspectief per sessie', 'Kan zelfverzekerd fouten maken', 'Geen debat of kruistoetsing'],
    price: 'Gratis / €20 p/m (Plus)',
    best: 'Snelle taken, tekst genereren',
    highlight: false,
  },
  {
    name: 'Gemini',
    tagline: 'Google\'s AI — sterk in actuele informatie',
    pros: ['Gekoppeld aan Google Search', 'Actuele webdata', 'Gratis 1M-token contextvenster', 'Sterk in multimodale taken'],
    cons: ['Eén perspectief per sessie', 'Variabele consistentie', 'Geen debat of verificatie'],
    price: 'Gratis / €22 p/m (Advanced)',
    best: 'Research, actuele feiten',
    highlight: false,
  },
  {
    name: 'Claude',
    tagline: 'Anthropic\'s model — nauwkeurig en veilig',
    pros: ['Uitzonderlijk sterk in analyse', 'Groot contextvenster (200K)', 'Zeer nauwkeurige instructieopvolging', 'Minst hallucinerende model'],
    cons: ['Eén perspectief per sessie', 'Geen internettoegang (basis)', 'Geen kruistoetsing'],
    price: 'Gratis / €20 p/m (Pro)',
    best: 'Analyse, lange documenten',
    highlight: false,
  },
  {
    name: 'FAINL',
    tagline: 'Alle drie tegelijk — één gewogen eindadvies',
    pros: ['ChatGPT + Gemini + Claude parallel', 'Live debat tussen modellen', 'Gewogen eindoordeel', 'Blinde vlekken blootgelegd'],
    cons: ['Geen directe ChatGPT-integratie (proxy)', 'Momenteel alleen tekst'],
    price: 'Gratis (twee sessies) / tokens',
    best: 'Strategische en complexe vragen',
    highlight: true,
  },
];

const CRITERIA = [
  { label: 'Meerdere perspectieven', chatgpt: false, gemini: false, claude: false, fainl: true },
  { label: 'Live debat tussen modellen', chatgpt: false, gemini: false, claude: false, fainl: true },
  { label: 'Gewogen eindoordeel', chatgpt: false, gemini: false, claude: false, fainl: true },
  { label: 'Gratis te gebruiken', chatgpt: true, gemini: true, claude: true, fainl: true },
  { label: 'Actuele webdata', chatgpt: false, gemini: true, claude: false, fainl: false },
  { label: 'Multimodaal (beeld)', chatgpt: true, gemini: true, claude: true, fainl: false },
  { label: 'Groot contextvenster', chatgpt: false, gemini: true, claude: true, fainl: false },
];

const FAQS = [
  {
    q: 'Wat is de beste AI-tool voor zakelijk gebruik in Nederland?',
    a: 'Voor zakelijk gebruik hangt het af van de taak. Voor strategische beslissingen en complexe analyses is FAINL het sterkst omdat meerdere AI-modellen parallel redeneren en elkaars aannames toetsen. Voor snelle teksttaken volstaat ChatGPT; voor research met actuele data is Gemini sterk.',
  },
  {
    q: 'Wat zijn de verschillen tussen ChatGPT, Gemini en Claude?',
    a: 'ChatGPT is het meest veelzijdig en heeft een groot plugin-ecosysteem. Gemini koppelt aan Google Search voor actuele informatie. Claude is het nauwkeurigst in analyse en volgt instructies het best op. Alle drie geven echter één perspectief per sessie — FAINL combineert ze voor een vollediger beeld.',
  },
  {
    q: 'Is FAINL gratis te gebruiken?',
    a: 'Ja. FAINL biedt twee gratis sessies zonder account. Daarna kun je tokens kopen om door te gaan. Er is geen abonnement vereist.',
  },
  {
    q: 'Waarom is multi-model AI beter dan één model?',
    a: 'Elk AI-model heeft andere trainingsdata, andere sterktes en andere blinde vlekken. Door drie modellen parallel te laten redeneren en elkaars antwoorden te bekritiseren, krijg je een genuanceerder en betrouwbaarder eindadvies dan welk enkel model ook kan geven.',
  },
  {
    q: 'Welke AI-tool is het beste voor SEO en contentmarketing?',
    a: 'Voor SEO en contentmarketing combineert FAINL de creatieve breedte van ChatGPT, de zoekdata-inzichten van Gemini en de analytische precisie van Claude. Zo krijg je een contentstrategie die is getoetst vanuit meerdere invalshoeken.',
  },
];

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      headline: 'Beste AI-tool in Nederland 2026: ChatGPT, Gemini, Claude of FAINL?',
      description: 'Vergelijking van de beste AI-tools voor Nederland: ChatGPT, Gemini, Claude en FAINL. Welke AI-assistent past bij jouw gebruik? Met vergelijkingstabel en gebruikscases.',
      url: 'https://www.fainl.com/vergelijk/beste-ai-tool-nederland',
      datePublished: '2026-03-11',
      dateModified: '2026-03-11',
      author: { '@type': 'Organization', name: 'FAINL', url: 'https://www.fainl.com' },
      publisher: { '@type': 'Organization', name: 'FAINL', logo: { '@type': 'ImageObject', url: 'https://www.fainl.com/favicon.png' } },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.fainl.com/' },
        { '@type': 'ListItem', position: 2, name: 'Vergelijk', item: 'https://www.fainl.com/vergelijk' },
        { '@type': 'ListItem', position: 3, name: 'Beste AI-tool Nederland', item: 'https://www.fainl.com/vergelijk/beste-ai-tool-nederland' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQS.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ],
};

export const BestAIToolPage: FC = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <SEO
        title="Beste AI-tool in Nederland 2026: ChatGPT, Gemini, Claude of FAINL?"
        description="Vergelijk de beste AI-tools voor Nederlands gebruik: ChatGPT, Gemini, Claude en FAINL. Welke AI-assistent past het best bij jouw situatie? Inclusief vergelijkingstabel."
        canonical="/vergelijk/beste-ai-tool-nederland"
        keywords="beste AI tool Nederland, ChatGPT vs Gemini vs Claude, AI vergelijking Nederland, beste AI assistent 2026, AI tools vergelijken, kunstmatige intelligentie Nederland"
        ogTitle="Beste AI-tool in Nederland 2026 — Vergelijking ChatGPT, Gemini, Claude & FAINL"
        ogDescription="Welke AI-tool past het best bij jouw gebruik? Vergelijk ChatGPT, Gemini, Claude en FAINL op prijs, kwaliteit en toepassingen."
        jsonLd={JSON_LD}
      />

      <nav aria-label="Breadcrumb" className="max-w-4xl mx-auto px-5 sm:px-8 pt-6">
        <ol className="flex items-center gap-2 text-base font-black uppercase tracking-widest text-black/50 dark:text-white/50">
          <li><button type="button" onClick={() => navigate('/')} className="hover:text-black dark:hover:text-white transition-colors">Home</button></li>
          <li>/</li>
          <li className="text-black dark:text-white/50">Vergelijk</li>
          <li>/</li>
          <li className="text-black dark:text-white">Beste AI-tool Nederland</li>
        </ol>
      </nav>

      <section className="max-w-4xl mx-auto px-5 sm:px-8 pt-10 pb-14 md:pt-14 md:pb-20">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-black dark:bg-[var(--action)] text-white dark:text-black text-lg font-black uppercase tracking-[0.25em] rounded-none mb-6">
          Vergelijking — Lokale SEO
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black uppercase tracking-tighter text-black dark:text-white leading-[1.05] mb-6">
          Best AI tool Nederland:{' '}
          <span className="text-[var(--ink)]">ChatGPT, Gemini, Claude of FAINL?</span>
        </h1>
        <p className="text-xl sm:text-2xl text-black dark:text-white/80 leading-relaxed max-w-2xl mb-8">
          De markt voor AI-tools groeit snel — maar welke past het best bij jouw gebruik?
          ChatGPT, Gemini en Claude zijn elk sterk op eigen terrein.{' '}
          <strong className="text-black dark:text-[var(--ink)]">FAINL combineert alle drie in één sessie voor het best haalbare antwoord.</strong>
        </p>
        <button type="button" onClick={() => navigate('/mission')}
          className="inline-flex items-center gap-4 px-10 py-5 bg-black dark:bg-[var(--action)] text-white dark:text-black font-black text-lg md:text-xl uppercase tracking-widest rounded-none hover:bg-[var(--action)] hover:text-black dark:hover:bg-white transition-all shadow-lg">
          Probeer FAINL gratis
          <ArrowRight className="w-5 h-5" />
        </button>
      </section>

      <section aria-label="AI tools vergelijking" className="max-w-4xl mx-auto px-5 sm:px-8 pb-16">
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black dark:text-white mb-6">De tools vergeleken</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TOOLS.map(tool => (
            <div key={tool.name}
              className={`border-4 rounded-none p-8 bg-white dark:bg-black relative ${
                tool.highlight
                  ? 'border-[var(--line)] shadow-lg'
                  : 'border-black dark:border-white/40 shadow-md dark:shadow-lg'
              }`}>
              {tool.highlight && (
                <div className="absolute -top-4 left-6 flex items-center gap-2 px-4 py-1.5 bg-[var(--action)] text-black">
                  <Crown className="w-4 h-4" />
                  <span className="text-lg font-black uppercase tracking-widest">Aanbevolen</span>
                </div>
              )}
              <h3 className={`font-black text-2xl uppercase tracking-tight mb-2 ${tool.highlight ? 'text-[var(--ink)]' : 'text-black dark:text-white'}`}>{tool.name}</h3>
              <p className="text-lg text-black dark:text-white/50 mb-6">{tool.tagline}</p>

              <div className="space-y-3 mb-6">
                {tool.pros.map(p => (
                  <div key={p} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[var(--ink)] shrink-0 mt-0.5" />
                    <span className="text-lg text-black dark:text-white/80">{p}</span>
                  </div>
                ))}
                {tool.cons.map(c => (
                  <div key={c} className="flex items-start gap-3">
                    <X className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <span className="text-lg text-black dark:text-white/40">{c}</span>
                  </div>
                ))}
              </div>

              <div className="bg-black/5 dark:bg-white/5 rounded-xl px-4 py-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-base font-black uppercase tracking-widest text-black/50 dark:text-white/50">Prijs</span>
                  <span className="text-base font-bold text-black dark:text-white">{tool.price}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base font-black uppercase tracking-widest text-black/50 dark:text-white/50">Beste voor</span>
                  <span className="text-base text-black dark:text-white/50">{tool.best}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section aria-label="Vergelijkingstabel" className="max-w-4xl mx-auto px-5 sm:px-8 pb-16">
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black dark:text-white mb-6">Vergelijkingstabel</h2>
        <div className="overflow-x-auto rounded-none border-4 border-black dark:border-[var(--line)]">
          <table className="w-full text-lg bg-white dark:bg-black">
            <thead>
              <tr className="border-b-4 border-black dark:border-[var(--line)]">
                <th className="text-left px-6 py-5 font-black uppercase tracking-tight text-lg text-black dark:text-white/40">Eigenschap</th>
                {['ChatGPT', 'Gemini', 'Claude', 'FAINL'].map(name => (
                  <th key={name} className={`px-4 py-5 font-black uppercase tracking-tight text-lg text-center ${name === 'FAINL' ? 'text-[var(--ink)]' : 'text-black dark:text-white'}`}>{name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CRITERIA.map((row, i) => (
                <tr key={row.label} className={`border-b border-black/10 dark:border-white/10 last:border-0 ${i % 2 === 0 ? '' : 'bg-black/[0.02] dark:bg-white/[0.02]'}`}>
                  <td className="px-5 py-3.5 text-base font-medium text-black dark:text-white/60">{row.label}</td>
                  {[row.chatgpt, row.gemini, row.claude, row.fainl].map((val, j) => (
                    <td key={j} className="px-4 py-3.5 text-center">
                      {val
                        ? <Check className={`w-4 h-4 mx-auto ${j === 3 ? 'text-black' : 'text-green-600 dark:text-green-400'}`} />
                        : <X className="w-4 h-4 mx-auto text-black/20 dark:text-white/20" />
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-label="CTA" className="max-w-4xl mx-auto px-5 sm:px-8 pb-16">
        <div className="bg-black dark:bg-white rounded-2xl p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)]">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white dark:text-black mb-4">
            Niet kiezen. <span className="text-black">Alles tegelijk.</span>
          </h2>
          <p className="text-white/70 dark:text-black leading-relaxed text-base md:text-lg mb-8">
            Met FAINL hoef je niet te kiezen tussen ChatGPT, Gemini en Claude.
            Stel één vraag — ontvang drie perspectieven, een live debat en één gewogen eindadvies.
            Gratis starten, geen account nodig.
          </p>
          <button type="button" onClick={() => navigate('/mission')}
            className="inline-flex items-center gap-3 px-8 py-4 bg-black text-white font-black text-base uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg">
            Start gratis — twee sessies, geen account nodig
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      <section aria-label="FAQ" className="max-w-4xl mx-auto px-5 sm:px-8 pb-24">
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black dark:text-white mb-6">FAQ</h2>
        <div className="border-2 border-black dark:border-white/20 rounded-2xl px-6 bg-white dark:bg-zinc-900">
          {FAQS.map((faq, i) => (
            <div key={i} className="border-b border-black/10 dark:border-white/10 last:border-0">
              <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-start justify-between py-5 text-left gap-4 group">
                <span className="font-black text-base md:text-lg uppercase tracking-tight text-black dark:text-white group-hover:text-black transition-colors">{faq.q}</span>
                <span className="text-black/40 dark:text-white/40 text-xl leading-none mt-0.5 shrink-0">{openFaq === i ? '−' : '+'}</span>
              </button>
              {openFaq === i && <p className="pb-5 text-base text-black dark:text-white/60 leading-relaxed">{faq.a}</p>}
            </div>
          ))}
        </div>
      </section>
    </>
  );
};
