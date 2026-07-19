import { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, XCircle, MinusCircle, Scale, Brain, ShieldCheck, Layers } from 'lucide-react';
import { SEO } from './SEO';

const COMPARISON = [
  {
    kenmerk: 'Aantal AI-modellen per vraag',
    fainl: { label: 'Drie modellen tegelijk', positive: true },
    chatgpt: { label: 'Één model', positive: false },
  },
  {
    kenmerk: 'Modellen toetsen elkaars output',
    fainl: { label: 'Ja — live debat', positive: true },
    chatgpt: { label: 'Nee', positive: false },
  },
  {
    kenmerk: 'Blinde vlekken in de analyse',
    fainl: { label: 'Sterk gereduceerd', positive: true },
    chatgpt: { label: 'Aanwezig (één perspectief)', positive: false },
  },
  {
    kenmerk: 'Risico op hallucinaties',
    fainl: { label: 'Lager door cross-verificatie', positive: true },
    chatgpt: { label: 'Aanwezig zonder externe check', positive: false },
  },
  {
    kenmerk: 'Eén helder eindantwoord',
    fainl: { label: 'Ja — gesynthetiseerd', positive: true },
    chatgpt: { label: 'Ja — enkelvoudig', positive: true },
  },
  {
    kenmerk: 'Gratis proberen',
    fainl: { label: 'Twee sessies gratis', positive: true },
    chatgpt: { label: 'Gratis basisversie', positive: true },
  },
  {
    kenmerk: 'Afweging van tegenstrijdige perspectieven',
    fainl: { label: 'Kernfunctie', positive: true },
    chatgpt: { label: 'Niet ingebouwd', positive: false },
  },
  {
    kenmerk: 'Geschikt voor complexe beslissingen',
    fainl: { label: 'Sterk — meerdere lenzen', positive: true },
    chatgpt: { label: 'Beperkt — één lens', positive: null },
  },
];

const SCENARIOS = [
  {
    icon: Scale,
    title: 'Wanneer FAINL sterker is',
    items: [
      'Juridische, financiële of strategische vraagstukken waarbij fouten kostbaar zijn',
      'Beslissingen waarbij je wilt weten of er tegenstrijdige visies bestaan',
      'Analyses waarbij één AI aantoonbaar blinde vlekken kan hebben',
      'Situaties waar je een gewogen conclusie nodig hebt, niet een mening',
    ],
    accent: 'border-black dark:border-white/20',
  },
  {
    icon: Brain,
    title: 'Wanneer ChatGPT voldoet',
    items: [
      'Snelle schrijftaken, herschrijven of vertalen',
      'Eenvoudige informatievragen zonder hoge nauwkeurigheidseis',
      'Brainstormen waarbij snelheid belangrijker is dan diepgang',
      'Conversationele taken zonder zwaarwegend beslismoment',
    ],
    accent: 'border-black/30 dark:border-white/10',
  },
];

const FAQS = [
  {
    q: 'Is FAINL beter dan ChatGPT?',
    a: "Niet per se beter — anders ingezet. ChatGPT is snel en breed bruikbaar. FAINL is ontworpen voor situaties waar één AI-perspectief onvoldoende is: complexe vraagstukken, strategische beslissingen of analyses waarbij blinde vlekken en hallucinaties serieuze risico's vormen. De meerwaarde van FAINL zit in de consensuslaag, niet in de individuele modellen.",
  },
  {
    q: 'Gebruikt FAINL ook GPT-4 van OpenAI?',
    a: 'FAINL orkestreert modellen van toonaangevende aanbieders waaronder OpenAI, Anthropic en Google. De exacte samenstelling wordt afgestemd op het type vraag. Je hoeft zelf niet te kiezen welk model je gebruikt — dat is precies het punt.',
  },
  {
    q: 'Kan ik ChatGPT niet gewoon meerdere keren bevragen?',
    a: 'Je kunt hetzelfde model meerdere keren bevragen, maar het blijft één model met dezelfde aannames, dezelfde trainingsdata en dezelfde blinde vlekken. FAINL brengt fundamenteel andere modellen samen — modellen die op andere data zijn getraind en andere prioriteiten stellen. Dat levert echte divergentie op, geen schijnvariatie.',
  },
  {
    q: 'Wat kost FAINL in vergelijking met ChatGPT Plus?',
    a: 'FAINL start gratis met twee sessies zonder account. Daarna betaal je per credit, vanaf €2,99. Je hoeft geen maandabonnement af te sluiten. Voor gebruikers die FAINL alleen bij complexe beslissingen inzetten, is dat vaak voordeliger dan een vast maandtarief.',
  },
];

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      headline: 'FAINL vs ChatGPT: Wanneer Heb je Meer dan Één AI Nodig?',
      description: 'Een eerlijke vergelijking tussen FAINL (multi-model AI-consensus) en ChatGPT (single-model). Ontdek wanneer meerdere AI\'s samenbrengen meer oplevert dan één chatbot.',
      url: 'https://www.fainl.com/vergelijken/fainl-vs-chatgpt',
      datePublished: '2026-03-13',
      dateModified: '2026-03-13',
      author: { '@type': 'Organization', name: 'FAINL', url: 'https://www.fainl.com' },
      publisher: { '@type': 'Organization', name: 'FAINL', logo: { '@type': 'ImageObject', url: 'https://www.fainl.com/favicon.png' } },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.fainl.com/' },
        { '@type': 'ListItem', position: 2, name: 'Vergelijken', item: 'https://www.fainl.com/vergelijken' },
        { '@type': 'ListItem', position: 3, name: 'FAINL vs ChatGPT', item: 'https://www.fainl.com/vergelijken/fainl-vs-chatgpt' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQS.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ],
};

export const CompareVsChatGPTPage: FC = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <SEO
        title="FAINL vs ChatGPT: Wanneer Heb je Meer dan Één AI Nodig?"
        description="Eerlijke vergelijking tussen FAINL (multi-model AI-consensus) en ChatGPT (single-model). Ontdek wanneer meerdere AI's samenbrengen meer oplevert dan één chatbot. Twee sessies gratis."
        canonical="/vergelijken/fainl-vs-chatgpt"
        keywords="FAINL vs ChatGPT, ChatGPT alternatief Nederland, meerdere AI modellen vergelijken, AI consensus vs chatbot, beste AI tool 2026, multi-model AI vergelijking"
        ogTitle="FAINL vs ChatGPT — Één Model of AI-Consensus?"
        ogDescription="Wanneer is meer dan één AI-model nodig? Vergelijk FAINL en ChatGPT op modellen, cross-verificatie, hallucinaties en geschiktheid voor complexe beslissingen."
        jsonLd={JSON_LD}
      />

      <nav aria-label="Breadcrumb" className="max-w-4xl mx-auto px-5 sm:px-8 pt-6">
        <ol className="flex items-center gap-2 text-base font-black uppercase tracking-widest text-black dark:text-white/30">
          <li><button type="button" onClick={() => navigate('/')} className="hover:text-black dark:hover:text-white transition-colors">Home</button></li>
          <li>/</li>
          <li className="text-black dark:text-white/50">Vergelijken</li>
          <li>/</li>
          <li className="text-black dark:text-white">FAINL vs ChatGPT</li>
        </ol>
      </nav>

      {/* Hero */}
    <section className="max-w-4xl mx-auto px-5 sm:px-8 pt-10 pb-14 md:pt-14 md:pb-20">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-black dark:bg-[var(--action)] text-white dark:text-black text-lg font-black uppercase tracking-[0.25em] rounded-none mb-6">
          Vergelijking — FAINL vs ChatGPT
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black uppercase tracking-tighter text-black dark:text-white leading-[1.05] mb-6">
          Één AI of consensus?{' '}
          <span className="text-[var(--ink)]">dat hangt af van de inzet.</span>
        </h1>
        <p className="text-xl sm:text-2xl text-black dark:text-white/80 leading-relaxed max-w-2xl mb-8">
          ChatGPT is snel en veelzijdig. FAINL laat meerdere AI-modellen tegelijk meedenken,
          elkaars aannames toetsen en één gewogen antwoord formuleren. Hier zie je objectief
          wanneer welke aanpak past.{' '}
          <strong className="text-black dark:text-[var(--ink)]">Geen reclame — een eerlijke vergelijking.</strong>
        </p>
        <button type="button" onClick={() => navigate('/mission')}
          className="inline-flex items-center gap-4 px-10 py-5 bg-black dark:bg-[var(--action)] text-white dark:text-black font-black text-lg md:text-xl uppercase tracking-widest rounded-none hover:bg-[var(--action)] hover:text-black dark:hover:bg-white transition-all shadow-lg">
          Probeer zelf het verschil — gratis
          <ArrowRight className="w-5 h-5" />
        </button>
      </section>

      {/* Comparison table */}
      <section aria-label="Vergelijkingstabel FAINL vs ChatGPT" className="max-w-4xl mx-auto px-5 sm:px-8 pb-16">
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black dark:text-white mb-6">Hoofd­kenmerken vergeleken</h2>
        <div className="border-4 border-black dark:border-[var(--line)] rounded-none overflow-hidden bg-white dark:bg-black shadow-md dark:shadow-lg">
          {/* Header row */}
          <div className="grid grid-cols-3 bg-black dark:bg-[var(--action)] text-white dark:text-black">
            <div className="px-5 py-5 text-lg font-black uppercase tracking-widest">Kenmerk</div>
            <div className="px-5 py-5 text-lg font-black uppercase tracking-widest border-l-4 border-white/20 dark:border-black/20 text-[var(--ink)] dark:text-black">FAINL</div>
            <div className="px-5 py-5 text-lg font-black uppercase tracking-widest border-l-4 border-white/20 dark:border-black/20">ChatGPT</div>
          </div>
          {/* Data rows */}
          {COMPARISON.map((row, i) => (
            <div key={i} className={`grid grid-cols-3 border-t-2 border-black/10 dark:border-[var(--line)]/20 ${i % 2 === 0 ? 'bg-white dark:bg-black' : 'bg-black/[0.02] dark:bg-white/[0.05]'}`}>
              <div className="px-5 py-5 text-lg font-bold text-black dark:text-white/80 leading-snug">{row.kenmerk}</div>
              <div className="px-5 py-5 border-l-2 border-black/10 dark:border-[var(--line)]/20 flex items-start gap-3">
                {row.fainl.positive === true && <CheckCircle2 className="w-5 h-5 text-[var(--ink)] shrink-0 mt-0.5" />}
                {row.fainl.positive === false && <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
                {row.fainl.positive === null && <MinusCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />}
                <span className="text-lg font-black text-black dark:text-[var(--ink)] leading-snug">{row.fainl.label}</span>
              </div>
              <div className="px-5 py-5 border-l-2 border-black/10 dark:border-[var(--line)]/20 flex items-start gap-3">
                {row.chatgpt.positive === true && <CheckCircle2 className="w-5 h-5 text-[var(--ink)] shrink-0 mt-0.5" />}
                {row.chatgpt.positive === false && <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
                {row.chatgpt.positive === null && <MinusCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />}
                <span className="text-lg font-bold text-black/60 dark:text-white/60 leading-snug">{row.chatgpt.label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* When to use which */}
      <section aria-label="Wanneer welke tool" className="max-w-4xl mx-auto px-5 sm:px-8 pb-16">
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black dark:text-white mb-6">Wanneer gebruik je wat?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SCENARIOS.map(sc => (
            <div key={sc.title} className={`border-4 border-black dark:border-[var(--line)] rounded-none p-8 bg-white dark:bg-black shadow-md dark:shadow-lg`}>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-black dark:bg-[var(--action)] rounded-none">
                  <sc.icon className="w-6 h-6 text-white dark:text-black" />
                </div>
                <h3 className="font-black text-xl uppercase tracking-tight text-black dark:text-white">{sc.title}</h3>
              </div>
              <ul className="space-y-4">
                {sc.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-2 w-2 h-2 rounded-none bg-[var(--action)] shrink-0" />
                    <span className="text-lg text-black/60 dark:text-white/70 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Callout */}
      <section aria-label="Kernverschil" className="max-w-4xl mx-auto px-5 sm:px-8 pb-16">
        <div className="border-4 border-black dark:border-[var(--line)] rounded-none p-8 md:p-10 bg-white dark:bg-black flex gap-6 items-start shadow-md dark:shadow-lg">
          <div className="p-3 bg-black dark:bg-[var(--action)] rounded-none shrink-0">
            <ShieldCheck className="w-7 h-7 text-white dark:text-black" />
          </div>
          <div>
            <p className="font-black text-xl uppercase tracking-tight text-black dark:text-white mb-3">Het kernverschil in één zin</p>
            <p className="text-xl text-black dark:text-white/80 leading-relaxed">
              ChatGPT geeft je <strong className="text-black dark:text-[var(--ink)]">één mening van één model</strong>.
              FAINL geeft je <strong className="text-black dark:text-[var(--ink)]">een gewogen conclusie op basis van meerdere modellen die elkaars redenering hebben bekritiseerd</strong> —
              zodat je weet dat het eindantwoord meer perspectieven heeft overleefd.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section aria-label="CTA" className="max-w-4xl mx-auto px-5 sm:px-8 pb-16">
        <div className="bg-black dark:bg-white rounded-2xl p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)]">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white dark:text-black mb-4">
            Klaar om het{' '}
            <span className="text-black">zelf te ervaren?</span>
          </h2>
          <p className="text-white/70 dark:text-black/60 leading-relaxed text-base md:text-lg mb-8">
            Stel dezelfde vraag die je normaal aan ChatGPT stelt — en zie wat er gebeurt als drie
            AI-modellen onafhankelijk antwoorden en elkaars conclusies bekritiseren.
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
