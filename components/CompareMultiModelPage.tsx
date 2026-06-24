import { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, GitMerge, AlertCircle, Layers, CheckCircle2, BarChart3, Cpu } from 'lucide-react';
import { SEO } from './SEO';

const MODELS = [
  {
    name: 'GPT-4 (OpenAI)',
    strength: 'Sterke redenering, breed ingezet, grote kennisbasis',
    weakness: 'Kan overtuigend klinken ook bij onjuiste informatie',
  },
  {
    name: 'Claude (Anthropic)',
    strength: 'Genuanceerde taal, sterk in analyse en lange context',
    weakness: 'Soms voorzichtiger dan nodig bij scherpe stellingnames',
  },
  {
    name: 'Gemini (Google)',
    strength: 'Actuele informatie, sterk in feitelijke grounding',
    weakness: 'Varieert per taak; soms minder diep in argumentatie',
  },
];

const PROBLEMS = [
  {
    icon: AlertCircle,
    title: 'Het hallucinatieprobleem',
    desc: 'Elk AI-model kan informatie verzinnen die overtuigend klinkt maar feitelijk onjuist is. Eén model checkt zichzelf niet. Drie modellen die elkaars output bekritiseren reduceren dit risico aanzienlijk.',
  },
  {
    icon: BarChart3,
    title: 'Het perspectiefprobleem',
    desc: 'Modellen zijn getraind op verschillende data met verschillende prioriteiten. GPT-4 en Claude zullen op dezelfde vraag soms tegengestelde accenten leggen. Dat is geen fout — dat is waardevolle informatie die je mist als je maar één model raadpleegt.',
  },
  {
    icon: Cpu,
    title: 'Het aannameprobeem',
    desc: 'Elk model maakt impliciete aannames bij het beantwoorden van een vraag. Die aannames zijn binnen één model onzichtbaar. Wanneer meerdere modellen onafhankelijk antwoorden en daarna elkaars redenering toetsen, worden verborgen aannames zichtbaar.',
  },
  {
    icon: GitMerge,
    title: 'Het synthesesprobleem',
    desc: 'Als je GPT-4, Claude en Gemini apart bevraagt, krijg je drie losse antwoorden. Je moet ze dan zelf vergelijken, wegen en samenvatten. FAINL doet dat automatisch: één synthese die het sterkste uit elke bijdrage behoudt.',
  },
];

const FAQS = [
  {
    q: 'Wat is het verschil tussen modellen apart bevragen en FAINL gebruiken?',
    a: 'Als je GPT-4, Claude en Gemini apart bevraagt, krijg je drie losse antwoorden die je zelf moet wegen en combineren. FAINL laat de modellen eerst onafhankelijk antwoorden, daarna elkaars redenering kritisch beoordelen, en synthetiseert vervolgens één gewogen eindantwoord. Het debatproces zelf — de onderlinge toetsing — voegt de echte waarde toe.',
  },
  {
    q: 'Zijn GPT-4, Claude en Gemini echt zo verschillend?',
    a: 'Ja, op meerdere vlakken. Ze zijn getraind op andere datasets, door andere teams met andere prioriteiten, en ze scoren systematisch anders op uiteenlopende taaktypen. GPT-4 scoort vaak sterk op redenering, Claude op genuanceerde taal en veiligheid, Gemini op feitelijke grounding. Op complexe vragen geven ze aantoonbaar verschillende accenten — en die divergentie is precies wat FAINL benut.',
  },
  {
    q: 'Welk model is het beste?',
    a: 'Er is geen universeel antwoord. Het hangt af van de taak. Dat is ook het punt van FAINL: in plaats van zelf te moeten kiezen welk model het beste is voor jouw vraag, laat je meerdere toonaangevende modellen samenwerken en consensus bereiken. Het systeem compenseert automatisch de zwaktes van individuele modellen.',
  },
  {
    q: 'Werkt FAINL ook voor eenvoudige vragen?',
    a: 'Ja, maar de meerwaarde is het grootst bij complexe, meerstapsige of gevoelige vragen. Voor een eenvoudige definitie of een snelle samenvatting is één model prima. Voor een strategische beslissing, juridische afweging of financiële analyse — waar fouten consequenties hebben — levert de consensus-aanpak aantoonbaar robuustere output.',
  },
];

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      headline: 'AI Modellen Vergelijken: GPT-4, Claude en Gemini Tegelijk Inzetten',
      description: 'Waarom GPT-4, Claude en Gemini elk sterke en zwakke punten hebben — en hoe FAINL deze modellen tegelijk inzet voor één robuust eindantwoord via AI-consensus.',
      url: 'https://fainl.com/vergelijken/ai-modellen-vergelijken',
      datePublished: '2026-03-13',
      dateModified: '2026-03-13',
      author: { '@type': 'Organization', name: 'FAINL', url: 'https://fainl.com' },
      publisher: { '@type': 'Organization', name: 'FAINL', logo: { '@type': 'ImageObject', url: 'https://fainl.com/favicon.png' } },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://fainl.com/' },
        { '@type': 'ListItem', position: 2, name: 'Vergelijken', item: 'https://fainl.com/vergelijken' },
        { '@type': 'ListItem', position: 3, name: 'AI Modellen Vergelijken', item: 'https://fainl.com/vergelijken/ai-modellen-vergelijken' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQS.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ],
};

export const CompareMultiModelPage: FC = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <SEO
        title="AI Modellen Vergelijken: GPT-4, Claude en Gemini Tegelijk Inzetten"
        description="GPT-4, Claude en Gemini hebben elk sterke en zwakke punten. Ontdek waarom je ze niet apart moet bevragen maar tegelijk — en hoe FAINL dat voor je regelt. Twee sessies gratis."
        canonical="/vergelijken/ai-modellen-vergelijken"
        keywords="AI modellen vergelijken, GPT-4 vs Claude vs Gemini, beste AI model 2026, multi-model AI Nederland, AI vergelijken, ChatGPT Gemini Claude vergelijking"
        ogTitle="GPT-4, Claude en Gemini Vergelijken — Gebruik Ze Tegelijk"
        ogDescription="Elk AI-model heeft blinde vlekken. FAINL laat GPT-4, Claude en Gemini samen werken en elkaars redenering toetsen — voor één robuust eindantwoord."
        jsonLd={JSON_LD}
      />

      <nav aria-label="Breadcrumb" className="max-w-4xl mx-auto px-5 sm:px-8 pt-6">
        <ol className="flex items-center gap-2 text-base font-black uppercase tracking-widest text-black/50 dark:text-white/50">
          <li><button type="button" onClick={() => navigate('/')} className="hover:text-black dark:hover:text-white transition-colors">Home</button></li>
          <li>/</li>
          <li className="text-black dark:text-white/50">Vergelijken</li>
          <li>/</li>
          <li className="text-black dark:text-white">AI Modellen Vergelijken</li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-5 sm:px-8 pt-10 pb-14 md:pt-14 md:pb-20">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-black dark:bg-[var(--action)] text-white dark:text-black text-lg font-black uppercase tracking-[0.25em] rounded-none mb-6">
          Vergelijking — AI Modellen
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black uppercase tracking-tighter text-black dark:text-white leading-[1.05] mb-6">
          GPT-4, Claude & Gemini:{' '}
          <span className="text-[var(--ink)]">sterk apart, sterker samen.</span>
        </h1>
        <p className="text-xl sm:text-2xl text-black dark:text-white/80 leading-relaxed max-w-2xl mb-8">
          Elk toonaangevend AI-model heeft systematische sterktes én blinde vlekken.
          Wie ze apart bevraagt, mist de helft van het verhaal. FAINL laat de modellen
          samenwerken — en levert één gewogen antwoord dat meer perspectieven heeft overleefd.{' '}
          <strong className="text-black dark:text-[var(--ink)]">Dat is het difference tussen één mening en consensus.</strong>
        </p>
        <button type="button" onClick={() => navigate('/mission')}
          className="inline-flex items-center gap-4 px-10 py-5 bg-black dark:bg-[var(--action)] text-white dark:text-black font-black text-lg md:text-xl uppercase tracking-widest rounded-none hover:bg-[var(--action)] hover:text-black dark:hover:bg-white transition-all shadow-lg">
          Probeer de consensusaanpak — gratis
          <ArrowRight className="w-5 h-5" />
        </button>
      </section>

      {/* Model profiles */}
      <section aria-label="AI model profielen" className="max-w-4xl mx-auto px-5 sm:px-8 pb-16">
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black dark:text-white mb-6">De drie modellen in profiel</h2>
        <div className="space-y-6">
          {MODELS.map((model, i) => (
            <div key={i} className="border-4 border-black dark:border-[var(--line)] rounded-none p-8 bg-white dark:bg-black shadow-md dark:shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                <div className="shrink-0">
                  <span className="inline-block px-5 py-2 bg-black dark:bg-[var(--action)] text-white dark:text-black text-lg font-black uppercase tracking-widest rounded-none">
                    {model.name}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row gap-6 flex-1">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-[var(--ink)] shrink-0" />
                      <span className="text-lg font-black uppercase tracking-widest text-black/40 dark:text-white/40">Sterk in</span>
                    </div>
                    <p className="text-xl text-black dark:text-white/80 leading-relaxed font-bold">{model.strength}</p>
                  </div>
                  <div className="w-px bg-black/10 dark:bg-white/20 hidden sm:block" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                      <span className="text-lg font-black uppercase tracking-widest text-black/40 dark:text-white/40">Let op</span>
                    </div>
                    <p className="text-xl text-black dark:text-white/60 leading-relaxed">{model.weakness}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-base text-black/40 dark:text-white/30 leading-relaxed">
          Profielen gebaseerd op breed gepubliceerd onafhankelijk onderzoek naar LLM-prestaties (MMLU, HumanEval, BIG-Bench) en publiek beschikbare benchmarks.
        </p>
      </section>

      {/* Problems solved */}
      <section aria-label="Problemen die multi-model aanpak oplost" className="max-w-4xl mx-auto px-5 sm:px-8 pb-16">
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black dark:text-white mb-6">Vier problemen die één model niet oplost</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PROBLEMS.map(p => (
            <div key={p.title} className="border-2 border-black dark:border-white/20 rounded-2xl p-6 bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_1px_rgba(255,255,255,0.1)]">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-black dark:bg-white rounded-lg">
                  <p.icon className="w-4 h-4 text-white dark:text-black" />
                </div>
                <h3 className="font-black text-base uppercase tracking-tight text-black dark:text-white">{p.title}</h3>
              </div>
              <p className="text-base text-black dark:text-white/50 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How FAINL resolves it */}
      <section aria-label="Hoe FAINL dit oplost" className="max-w-4xl mx-auto px-5 sm:px-8 pb-16">
        <div className="border-4 border-black dark:border-[var(--line)] rounded-none p-10 md:p-12 bg-white dark:bg-black shadow-md dark:shadow-lg">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-black dark:bg-[var(--action)] rounded-none">
              <Layers className="w-7 h-7 text-white dark:text-black" />
            </div>
            <h2 className="font-black text-3xl uppercase tracking-tight text-black dark:text-white">Hoe FAINL dit oplost</h2>
          </div>
          <ol className="space-y-10">
            {[
              { step: 'Één', label: 'Onafhankelijke analyse', desc: 'Elk model beantwoordt jouw vraag zonder de output van de andere modellen te kennen. Zo vermijd je groepsdenken en behoud je echte divergentie.' },
              { step: 'Twee', label: 'Onderlinge toetsing', desc: 'De modellen beoordelen elkaars antwoorden. Zwakke argumenten, ontbrekende nuances en feitelijke inconsistenties worden hier zichtbaar — vóór je het eindantwoord ziet.' },
              { step: 'Drie', label: 'Synthese tot één antwoord', desc: 'FAINL combineert de sterkste elementen uit elke bijdrage tot één gewogen eindantwoord. Geen drie losse outputs die je zelf moet wegen — één gecheckte conclusie.' },
            ].map(s => (
              <li key={s.step} className="flex gap-6 items-start">
                <span className="text-4xl font-black text-[var(--ink)] shrink-0 leading-none mt-1">{s.step}</span>
                <div>
                  <p className="font-black text-2xl uppercase tracking-tight text-black dark:text-white mb-2">{s.label}</p>
                  <p className="text-xl text-black dark:text-white/80 leading-relaxed">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section aria-label="CTA" className="max-w-4xl mx-auto px-5 sm:px-8 pb-16">
        <div className="bg-black dark:bg-white rounded-2xl p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)]">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white dark:text-black mb-4">
            Eén vraag.{' '}
            <span className="text-black">Drie modellen. Één antwoord.</span>
          </h2>
          <p className="text-white/70 dark:text-black leading-relaxed text-base md:text-lg mb-8">
            Stop met kiezen welk AI-model je vertrouwt. Laat ze samenwerken en elkaars redenering
            toetsen — zodat jij de sterkste conclusie krijgt, niet de luidste.
          </p>
          <button type="button" onClick={() => navigate('/mission')}
            className="inline-flex items-center gap-3 px-8 py-4 bg-black text-white font-black text-base uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg">
            Start gratis — twee sessies, geen account nodig
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* FAQ */}
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
