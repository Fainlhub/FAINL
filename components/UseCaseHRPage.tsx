import { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Users, ClipboardList, Search, BarChart2 } from 'lucide-react';
import { SEO } from './SEO';

const USE_CASES = [
  {
    icon: Search,
    title: 'Functieprofiel & vacaturetekst',
    desc: 'Drie AI-modellen stellen elk een functieprofiel op vanuit een andere invalshoek: strategisch, operationeel en kandidaatgericht. FAINL synthetiseert de sterkste elementen tot één scherpe vacaturetekst.',
    example: '"Schrijf een vacaturetekst voor een Senior Product Manager bij een Nederlandse SaaS-scale-up met focus op inclusieve taal."',
  },
  {
    icon: ClipboardList,
    title: 'Interviewvragen & beoordeling',
    desc: 'Multi-model AI genereert gestructureerde interviewvragen per competentie. Modellen toetsen elkaars vragen op bias, volledigheid en relevantie — zodat je kandidaten eerlijk en compleet beoordeelt.',
    example: '"Genereer vijf competentiegerichte interviewvragen voor een salesfunctie, gericht op het testen van veerkracht en klantgerichtheid."',
  },
  {
    icon: Users,
    title: 'Organisatiecultuur & onboarding',
    desc: 'Laat drie modellen onafhankelijk je onboardingprogramma analyseren op lacunes, inconsistenties en verbeterkansen. Elk model signaleert andere risico\'s voor vroeg verloop.',
    example: '"Geef feedback op ons 30-60-90-dagenplan voor nieuwe salesmedewerkers en benoem de drie grootste risico\'s voor vroegtijdig verloop."',
  },
  {
    icon: BarChart2,
    title: 'Arbeidsmarktanalyse & loonstrategie',
    desc: 'Stel strategische HR-vragen over salarisniveaus, schaarse functiegroepen en arbeidsmarkttrends. Drie modellen geven elk hun interpretatie — FAINL benoemt de meest onderbouwde conclusie.',
    example: '"Wat zijn realistische salarisbandbreedtes voor een senior data engineer in Nederland in 2026 en hoe verhoudt zich dat tot de markt?"',
  },
];

const FAQS = [
  {
    q: 'Hoe gebruik ik AI voor HR en recruitment?',
    a: 'AI is het sterkst in HR wanneer je het inzet voor het structureren van processen: vacatureteksten, interviewvragen, functieprofielen en onboardingprogramma\'s. Met FAINL krijg je drie onafhankelijke perspectieven die elkaars aannames toetsen — wat bias vermindert en kwaliteit verhoogt.',
  },
  {
    q: 'Kan AI helpen bij het verminderen van bias in recruitment?',
    a: 'Ja, mits bewust ingezet. FAINL laat meerdere modellen elkaars vacatureteksten en interviewvragen beoordelen op bias. Dit levert systematisch betere resultaten dan één model — dat zijn eigen vooroordelen niet ziet. Menselijke controle blijft essentieel.',
  },
  {
    q: 'Is AI-gegenereerde HR-content betrouwbaar voor gebruik?',
    a: 'AI levert sterke structuur, frameworks en taalinspiratie — maar de specifieke context van jouw organisatie, sector en cultuur moet je zelf toevoegen. FAINL\'s consensus-aanpak verhoogt betrouwbaarheid doordat modellen elkaars output kritisch toetsen.',
  },
  {
    q: 'Wat maakt FAINL anders dan andere AI-tools voor HR?',
    a: 'De meeste HR-tools zijn gebaseerd op één AI-model. FAINL laat drie modellen tegelijk werken, ze debatteren over elkaars output en een Voorzitter synthetiseert het sterkste advies. Dit levert diepgaandere analyse dan een enkelvoudige AI-assistent.',
  },
];

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      headline: 'AI voor HR & Recruitment: Scherpere Wervingsprocessen met Multi-Model AI',
      description: 'Gebruik multi-model AI voor vacatureteksten, interviewvragen en onboarding. FAINL synthetiseert drie HR-perspectieven tot één gewogen advies.',
      url: 'https://www.fainl.com/gebruik/hr-recruitment-ai',
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
        { '@type': 'ListItem', position: 3, name: 'HR & Recruitment', item: 'https://www.fainl.com/gebruik/hr-recruitment-ai' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQS.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ],
};

export const UseCaseHRPage: FC = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <SEO
        title="AI voor HR & Recruitment: Betere Werving met Multi-Model AI"
        description="Gebruik meerdere AI-modellen voor vacatureteksten, interviewvragen en onboarding. FAINL combineert drie HR-perspectieven tot één gewogen advies. Twee sessies gratis."
        canonical="/gebruik/hr-recruitment-ai"
        keywords="AI voor HR, AI recruitment Nederland, AI vacaturetekst, AI interviewvragen, kunstmatige intelligentie HR, AI onboarding, multi-model AI HR tool"
        ogTitle="AI voor HR & Recruitment — Drie Modellen, Eén Scherp HR-Advies"
        ogDescription="Laat meerdere AI-modellen samenwerken voor betere vacatureteksten, interviewvragen en HR-strategie. Minder bias, meer diepgang."
        jsonLd={JSON_LD}
      />

      <nav aria-label="Breadcrumb" className="max-w-4xl mx-auto px-5 sm:px-8 pt-6">
        <ol className="flex items-center gap-2 text-base font-black uppercase tracking-widest text-black dark:text-white/30">
          <li><button type="button" onClick={() => navigate('/')} className="hover:text-black dark:hover:text-white transition-colors">Home</button></li>
          <li>/</li>
          <li className="text-black dark:text-white/50">Gebruik</li>
          <li>/</li>
          <li className="text-black dark:text-white">HR & Recruitment</li>
        </ol>
      </nav>

      <section className="max-w-4xl mx-auto px-5 sm:px-8 pt-10 pb-14 md:pt-14 md:pb-20">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-black dark:bg-[var(--action)] text-white dark:text-black text-lg font-black uppercase tracking-[0.25em] rounded-none mb-6">
          Use case — HR & Recruitment
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black uppercase tracking-tighter text-black dark:text-white leading-[1.05] mb-6">
          AI voor HR:{' '}
          <span className="text-[var(--ink)]">minder bias, betere kandidaten.</span>
        </h1>
        <p className="text-xl sm:text-2xl text-black dark:text-white/80 leading-relaxed max-w-2xl mb-8">
          Wervingsprocessen zijn gebaat bij meerdere invalshoeken — niet één mening van één model.
          Drie AI-modellen analyseren onafhankelijk je functieprofiel, interviewvragen en onboardingprogramma.{' '}
          <strong className="text-black dark:text-[var(--ink)]">FAINL legt de blinde vlekken bloot en levert een scherper HR-advies.</strong>
        </p>
        <button type="button" onClick={() => navigate('/mission')}
          className="inline-flex items-center gap-4 px-10 py-5 bg-black dark:bg-[var(--action)] text-white dark:text-black font-black text-lg md:text-xl uppercase tracking-widest rounded-none hover:bg-[var(--action)] hover:text-black dark:hover:bg-white transition-all shadow-lg">
          Analyseer je HR-vraag — gratis starten
          <ArrowRight className="w-5 h-5" />
        </button>
      </section>

      <section aria-label="HR toepassingen" className="max-w-4xl mx-auto px-5 sm:px-8 pb-16">
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
            Betere werving begint met{' '}
            <span className="text-[var(--ink)] dark:text-black">meerdere perspectieven.</span>
          </h2>
          <p className="text-white/80 dark:text-black/80 leading-relaxed text-xl md:text-2xl mb-10">
            Stel je HR-vraag aan FAINL. Drie modellen analyseren onafhankelijk, bekritiseren elkaars
            aannames op bias en kwaliteit, en Victor synthetiseert het sterkste HR-advies — in één sessie.
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
