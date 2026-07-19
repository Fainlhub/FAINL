import { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Target, TrendingUp, Users, Megaphone } from 'lucide-react';
import { SEO } from './SEO';

const USE_CASES = [
  {
    icon: Target,
    title: 'Campagnestrategie',
    desc: 'Drie AI-modellen analyseren je doelgroep, positionering en boodschap vanuit verschillende strategische invalshoeken. Het resultaat: een strategie getoetst op consistentie en blinde vlekken.',
    example: '"Ontwikkel een campagnestrategie voor de lancering van onze SaaS-tool bij MKB-bedrijven in Nederland."',
  },
  {
    icon: Users,
    title: 'Doelgroepanalyse',
    desc: 'Laat meerdere modellen je doelgroep definiëren, segmenteren en prioriteren. Conflicterende inzichten tussen modellen wijzen op nuances die je strategie scherper maken.',
    example: '"Beschrijf drie buyer personas voor een premium thuisfitnessproduct voor drukke professionals."',
  },
  {
    icon: TrendingUp,
    title: 'Contentstrategie',
    desc: 'Van SEO-strategie tot content-kalender: drie modellen brengen elk andere content-kansen in kaart. FAINL synthetiseert de sterkste elementen tot een samenhangend plan.',
    example: '"Welke contentpijlers en formats werken het beste voor een B2B SaaS-blog gericht op HR-managers?"',
  },
  {
    icon: Megaphone,
    title: 'Merkpositionering',
    desc: 'Sterke positionering vereist externe perspectieven. Drie modellen beoordelen onafhankelijk je propositie en geven kritisch commentaar op onderscheidend vermogen.',
    example: '"Hoe positioneren wij ons als premium alternatief voor Mailchimp in de Nederlandse markt?"',
  },
];

const FAQS = [
  {
    q: 'Hoe gebruik ik AI voor marketingstrategie?',
    a: 'Stel je strategische vraag zo concreet mogelijk: doelgroep, product, markt en doel. AI-modellen zijn het sterkst als je context geeft. Met FAINL krijg je drie strategische perspectieven in één sessie, die elkaars zwakke punten blootleggen.',
  },
  {
    q: 'Is AI-gegenereerde marketingcontent betrouwbaar?',
    a: "AI is sterk in structuur, frameworks en brede inzichten — maar mist actuele marktdata en lokale nuance. FAINL's multi-model aanpak vergroot de betrouwbaarheid doordat modellen elkaars aannames toetsen. Gebruik de output als startpunt, niet als eindproduct.",
  },
  {
    q: 'Kan ik FAINL gebruiken voor SEO-strategie?',
    a: 'Ja. FAINL is bijzonder effectief voor zoekwoordstrategie, contentstrategie en het analyseren van concurrenten. Drie modellen geven elk andere zoekwoordclusters, contentideeën en SEO-kansen — wat een volledigere strategie oplevert.',
  },
  {
    q: 'Hoe verhoudt FAINL zich tot andere AI-marketingtools?',
    a: 'De meeste AI-marketingtools zijn gebouwd op één model. FAINL combineert drie van de krachtigste modellen (ChatGPT, Gemini, Claude) in één sessie met live debat en een gewogen eindoordeel. Geen specialisatie, maar breedte en diepte tegelijk.',
  },
];

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      headline: 'AI voor Marketing Strategie: Scherpere Campagnes met Multi-Model AI',
      description: 'Gebruik ChatGPT, Gemini en Claude samen voor campagnestrategie, doelgroepanalyse en contentplanning. FAINL synthetiseert drie marketingperspectieven in één eindadvies.',
      url: 'https://www.fainl.com/gebruik/marketing-strategie-ai',
      datePublished: '2026-03-11',
      dateModified: '2026-03-11',
      author: { '@type': 'Organization', name: 'FAINL', url: 'https://www.fainl.com' },
      publisher: { '@type': 'Organization', name: 'FAINL', logo: { '@type': 'ImageObject', url: 'https://www.fainl.com/favicon.png' } },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.fainl.com/' },
        { '@type': 'ListItem', position: 2, name: 'Gebruik', item: 'https://www.fainl.com/gebruik' },
        { '@type': 'ListItem', position: 3, name: 'Marketing Strategie', item: 'https://www.fainl.com/gebruik/marketing-strategie-ai' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQS.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ],
};

export const UseCaseMarketingPage: FC = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <SEO
        title="AI voor Marketing Strategie: Scherpere Campagnes met Multi-Model AI"
        description="Gebruik ChatGPT, Gemini en Claude samen voor campagnestrategie, doelgroepanalyse en contentstrategie. FAINL combineert drie marketingperspectieven in één gewogen eindadvies."
        canonical="/gebruik/marketing-strategie-ai"
        keywords="AI marketing strategie, AI voor marketing Nederland, ChatGPT marketing, AI campagnestrategie, kunstmatige intelligentie marketing, AI contentmarketing, AI doelgroepanalyse"
        ogTitle="AI voor Marketing Strategie — Drie Modellen, Eén Scherp Advies"
        ogDescription="Laat ChatGPT, Gemini en Claude samen je marketingstrategie ontwikkelen. Meer perspectieven, betere beslissingen."
        jsonLd={JSON_LD}
      />

      <nav aria-label="Breadcrumb" className="max-w-4xl mx-auto px-5 sm:px-8 pt-6">
        <ol className="flex items-center gap-2 text-base font-black uppercase tracking-widest text-black dark:text-white/30">
          <li><button type="button" onClick={() => navigate('/')} className="hover:text-black dark:hover:text-white transition-colors">Home</button></li>
          <li>/</li>
          <li className="text-black dark:text-white/50">Gebruik</li>
          <li>/</li>
          <li className="text-black dark:text-white">Marketing Strategie</li>
        </ol>
      </nav>

      <section className="max-w-4xl mx-auto px-5 sm:px-8 pt-10 pb-14 md:pt-14 md:pb-20">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-black dark:bg-[var(--action)] text-white dark:text-black text-lg font-black uppercase tracking-[0.25em] rounded-none mb-6">
          Use case — Marketing
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black uppercase tracking-tighter text-black dark:text-white leading-[1.05] mb-6">
          AI voor marketing:{' '}
          <span className="text-[var(--ink)]">drie perspectieven, één strategie.</span>
        </h1>
        <p className="text-xl sm:text-2xl text-black dark:text-white/80 leading-relaxed max-w-2xl mb-8">
          Marketingstrategie vereist meerdere invalshoeken — niet één mening van één model.
          ChatGPT denkt creatief, Gemini kent de trends, Claude analyseert kritisch.{' '}
          <strong className="text-black dark:text-[var(--ink)]">FAINL laat ze debatteren en synthetiseert het scherpste strategisch advies.</strong>
        </p>
        <button type="button" onClick={() => navigate('/mission')}
          className="inline-flex items-center gap-4 px-10 py-5 bg-black dark:bg-[var(--action)] text-white dark:text-black font-black text-lg md:text-xl uppercase tracking-widest rounded-none hover:bg-[var(--action)] hover:text-black dark:hover:bg-white transition-all shadow-lg">
          Ontwikkel je strategie — gratis starten
          <ArrowRight className="w-5 h-5" />
        </button>
      </section>

      <section aria-label="Marketing toepassingen" className="max-w-4xl mx-auto px-5 sm:px-8 pb-16">
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
            Stop met gissen. <span className="text-[var(--ink)] dark:text-black">Start met consensus.</span>
          </h2>
          <p className="text-white/80 dark:text-black/80 leading-relaxed text-xl md:text-2xl mb-10">
            Stel je marketingvraag aan FAINL. ChatGPT, Gemini én Claude leveren elk hun strategisch
            perspectief, bekritiseren elkaars aannames en FAINL synthetiseert het sterkste,
            meest onderbouwde marketingadvies — in één sessie.
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
