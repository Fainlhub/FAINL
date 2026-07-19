import { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, TrendingUp, PieChart, AlertTriangle, DollarSign } from 'lucide-react';
import { SEO } from './SEO';

const USE_CASES = [
  {
    icon: TrendingUp,
    title: 'Investeringsbeslissingen & business cases',
    desc: 'Drie AI-modellen beoordelen een investering of business case elk vanuit een andere financiële lens: rendement, risico en strategische fit. Conflicterende conclusies wijzen op onderschatte risico\'s.',
    example: '"Analyseer de haalbaarheid van een investering van €500.000 in het uitbreiden van ons salesteam met drie personen bij een huidige ARR van €1,2M."',
  },
  {
    icon: AlertTriangle,
    title: 'Risicoanalyse & scenario planning',
    desc: 'Laat modellen onafhankelijk de financiële risico\'s van een beslissing in kaart brengen. Elk model benoemt andere kwetsbaarheden — samen vormen ze een robuust risicoplaatje.',
    example: '"Beschrijf drie scenario\'s (best case, base case, worst case) voor de cashflow van ons bedrijf bij een rentestijging van 2% in 2026."',
  },
  {
    icon: PieChart,
    title: 'Financiële KPI\'s & rapportage',
    desc: 'Gebruik multi-model AI om financiële rapportages te interpreteren, KPI-dashboards te ontwerpen of managementinformatie te structureren. Drie modellen signaleren elk andere verbeterpunten.',
    example: '"Welke KPI\'s zijn het meest relevant voor een SaaS-bedrijf in de groeifase met €2M ARR en 120% netto retentie?"',
  },
  {
    icon: DollarSign,
    title: 'Financieringsstrategie & pitchvoorbereiding',
    desc: 'Voorbereiding op een investeringsronde, bankgesprek of aandeelhoudersvergadering. Drie modellen beoordelen je pitch op zwakke argumenten, ontbrekende data en strategische overtuigingskracht.',
    example: '"Beoordeel onze investeerdersdeck op de sterkte van de marktonderbouwing, het team-argument en de financiële projecties."',
  },
];

const FAQS = [
  {
    q: 'Hoe gebruik ik AI voor financiële analyse?',
    a: 'AI is bijzonder sterk in het structureren van financiële vraagstukken: scenario\'s opstellen, KPI\'s prioriteren, business cases toetsen en rapportages interpreteren. Met FAINL krijg je drie onafhankelijke financiële perspectieven die elkaars aannames toetsen — wat blinde vlekken in je analyse blootlegt.',
  },
  {
    q: 'Kan AI financiële risico\'s inschatten?',
    a: 'AI kan systematisch risicoscenario\'s opstellen en financiële kwetsbaarheden benoemen op basis van de informatie die je aanlevert. FAINL\'s multi-model aanpak is hier extra waardevol: drie modellen signaleren elk andere risico\'s, waardoor je een completer risicoplaatje krijgt dan met één model.',
  },
  {
    q: 'Vervangt FAINL een CFO of financieel adviseur?',
    a: 'Nee. FAINL is een analytisch hulpmiddel dat complexe financiële vraagstukken structureert en meerdere perspectieven samenbrengt. Het vervangt geen gekwalificeerde financieel adviseur, accountant of CFO. Gebruik de output als onderbouwing voor gesprekken, niet als definitieve beslissing.',
  },
  {
    q: 'Is multi-model AI beter voor financiële vragen dan één ChatGPT-gesprek?',
    a: 'Bij financiële vraagstukken zijn blinde vlekken kostbaar. Eén model geeft één perspectief — dat consistent dezelfde aannames maakt. Drie modellen die elkaars redenering bekritiseren, produceren robuustere analyses. FAINL synthetiseert vervolgens de meest onderbouwde conclusie.',
  },
];

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      headline: 'AI voor Financiële Analyse: Scherpere Beslissingen met Multi-Model AI',
      description: 'Gebruik multi-model AI voor investeringsanalyse, risicomodellering en financiële strategie. FAINL synthetiseert drie financiële perspectieven tot één gewogen advies.',
      url: 'https://www.fainl.com/gebruik/financiele-analyse-ai',
      datePublished: '2026-03-13',
      dateModified: '2026-03-13',
      author: { '@type': 'Organization', name: 'FAINL', url: 'https://www.fainl.com' },
      publisher: { '@type': 'Organization', name: 'FAINL', logo: { '@type': 'ImageObject', url: 'https://www.fainl.com/favicon.png' } },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.fainl.com/' },
        { '@type': 'ListItem', position: 2, name: 'Gebruik', item: 'https://www.fainl.com/gebruik' },
        { '@type': 'ListItem', position: 3, name: 'Financiële Analyse', item: 'https://www.fainl.com/gebruik/financiele-analyse-ai' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQS.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ],
};

export const UseCaseFinancePage: FC = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <SEO
        title="AI voor Financiële Analyse: Scherpere Beslissingen met Multi-Model AI"
        description="Gebruik meerdere AI-modellen voor investeringsanalyse, risicomodellering en financiële strategie. FAINL combineert drie perspectieven tot één gewogen financieel advies. Twee sessies gratis."
        canonical="/gebruik/financiele-analyse-ai"
        keywords="AI financiële analyse, AI voor finance Nederland, AI investeringsanalyse, AI risicoanalyse, kunstmatige intelligentie financieel, AI business case, multi-model AI finance"
        ogTitle="AI voor Financiële Analyse — Drie Modellen, Eén Scherp Financieel Advies"
        ogDescription="Laat meerdere AI-modellen samenwerken voor betere investeringsanalyses, scenario planning en financiële strategie. Minder blinde vlekken, meer diepgang."
        jsonLd={JSON_LD}
      />

      <nav aria-label="Breadcrumb" className="max-w-4xl mx-auto px-5 sm:px-8 pt-6">
        <ol className="flex items-center gap-2 text-base font-black uppercase tracking-widest text-black dark:text-white/30">
          <li><button type="button" onClick={() => navigate('/')} className="hover:text-black dark:hover:text-white transition-colors">Home</button></li>
          <li>/</li>
          <li className="text-black dark:text-white/50">Gebruik</li>
          <li>/</li>
          <li className="text-black dark:text-white">Financiële Analyse</li>
        </ol>
      </nav>

      <section className="max-w-4xl mx-auto px-5 sm:px-8 pt-10 pb-14 md:pt-14 md:pb-20">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-black dark:bg-[var(--action)] text-white dark:text-black text-lg font-black uppercase tracking-[0.25em] rounded-none mb-6">
          Use case — Finance
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black uppercase tracking-tighter text-black dark:text-white leading-[1.05] mb-6">
          AI voor finance:{' '}
          <span className="text-[var(--ink)]">geen blinde vlekken meer.</span>
        </h1>
        <p className="text-xl sm:text-2xl text-black dark:text-white/80 leading-relaxed max-w-2xl mb-8">
          Financiële beslissingen zijn te belangrijk voor één perspectief. Drie AI-modellen analyseren
          onafhankelijk je investering, risico of strategie vanuit hun eigen financiële lens.{' '}
          <strong className="text-black dark:text-[var(--ink)]">FAINL legt tegenstrijdigheden bloot en synthetiseert het meest onderbouwde financiële advies.</strong>
        </p>
        <button type="button" onClick={() => navigate('/mission')}
          className="inline-flex items-center gap-4 px-10 py-5 bg-black dark:bg-[var(--action)] text-white dark:text-black font-black text-lg md:text-xl uppercase tracking-widest rounded-none hover:bg-[var(--action)] hover:text-black dark:hover:bg-white transition-all shadow-lg">
          Analyseer je financiële vraag — gratis starten
          <ArrowRight className="w-5 h-5" />
        </button>
      </section>

      <section aria-label="Finance toepassingen" className="max-w-4xl mx-auto px-5 sm:px-8 pb-16">
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black dark:text-white mb-6">Toepassingen</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {USE_CASES.map(uc => (
            <div key={uc.title} className="border-4 border-black dark:border-[var(--line)] rounded-none p-8 bg-white dark:bg-black shadow-md dark:shadow-lg">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-black dark:bg-[var(--action)] rounded-none">
                  <uc.icon className="w-6 h-6 text-white dark:text-black" />
                </div>
                <h3 className="font-black text-xl uppercase tracking-tight text-black dark:text-white">{uc.title}</h3>
              </div>
              <p className="text-lg text-black dark:text-white/70 leading-relaxed mb-6">{uc.desc}</p>
              <div className="bg-black/5 dark:bg-[var(--action)]/10 rounded-none px-6 py-4 border-l-4 border-black dark:border-[var(--line)]">
                <p className="text-sm font-black uppercase tracking-widest text-[var(--ink)] dark:text-[var(--ink)] mb-1">Voorbeeldvraag</p>
                <p className="text-lg text-black dark:text-white/80 italic leading-relaxed font-bold">"{uc.example}"</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section aria-label="CTA" className="max-w-4xl mx-auto px-5 sm:px-8 pb-16">
        <div className="bg-black dark:bg-[var(--action)] rounded-none p-10 md:p-16 shadow-lg dark:shadow-lg">
          <h2 className="text-2xl md:text-5xl font-black uppercase tracking-tight text-white dark:text-black mb-6 leading-tight">
            Betere financiële beslissingen{' '}
            <span className="text-[var(--ink)] dark:text-black">beginnen met consensus.</span>
          </h2>
          <p className="text-white/80 dark:text-black/80 leading-relaxed text-xl md:text-2xl mb-10">
            Stel je financiële vraag aan FAINL. Drie modellen analyseren onafhankelijk, bekritiseren
            elkaars aannames op risico en onderbouwing, en Victor synthetiseert het sterkste
            financiële advies — in één sessie.
          </p>
          <button type="button" onClick={() => navigate('/mission')}
            className="inline-flex items-center gap-4 px-10 py-5 bg-[var(--action)] dark:bg-black text-black dark:text-white font-black text-lg md:text-xl uppercase tracking-widest rounded-none hover:bg-white hover:text-black transition-all shadow-lg">
            Start gratis — twee sessies, geen account nodig
            <ArrowRight className="w-5 h-5" />
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
                <span className="text-black dark:text-white/40 text-xl leading-none mt-0.5 shrink-0">{openFaq === i ? '−' : '+'}</span>
              </button>
              {openFaq === i && <p className="pb-5 text-base text-black dark:text-white/60 leading-relaxed">{faq.a}</p>}
            </div>
          ))}
        </div>
      </section>
    </>
  );
};
