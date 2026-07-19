import { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Scale, FileText, Shield, AlertTriangle } from 'lucide-react';
import { SEO } from './SEO';

const USE_CASES = [
  {
    icon: FileText,
    title: 'Contractreview',
    desc: 'Laat drie AI-modellen parallel een contract analyseren. Elk model signaleert andere risico-clausules, ontbrekende bepalingen en ongunstige voorwaarden.',
    example: '"Analyseer dit huurcontract op onredelijke clausules en ontbrekende huurdersrechten."',
  },
  {
    icon: Scale,
    title: 'Juridische onderzoeksvragen',
    desc: 'Bij vragen over wetgeving, jurisprudentie of rechtspositie bieden drie modellen drie invalshoeken — waarna FAINL het meest gewogen antwoord synthetiseert.',
    example: '"Wat zijn mijn rechten als werknemer bij een loonsverhoging die mondeling is toegezegd?"',
  },
  {
    icon: Shield,
    title: 'Compliance & AVG',
    desc: 'Beoordeel of bedrijfsprocessen voldoen aan wet- en regelgeving. Multi-model consensus reduceert blinde vlekken die één model over het hoofd ziet.',
    example: '"Voldoet onze cookiebanner aan de AVG-vereisten voor expliciete toestemming?"',
  },
  {
    icon: AlertTriangle,
    title: 'Risico-inschatting',
    desc: 'Bij strategische beslissingen met juridische gevolgen geeft multi-model debat inzicht in conflicterende interpretaties en een gewogen eindadvies.',
    example: '"Wat zijn de juridische risico\'s van deze samenwerkingsovereenkomst zonder notariële vastlegging?"',
  },
];

const FAQS = [
  {
    q: 'Kan ik AI gebruiken voor juridisch advies in Nederland?',
    a: 'AI is een krachtig hulpmiddel voor juridisch onderzoek, contractreview en het verkennen van rechtsvragen. Het vervangt geen advocaat — maar helpt je beter voorbereid een gesprek in te gaan en juridische documenten te begrijpen.',
  },
  {
    q: 'Waarom is multi-model AI beter voor juridische vragen?',
    a: 'Juridische vragen kennen vaak meerdere interpretaties. Eén AI-model geeft één perspectief. Drie modellen die elkaars redenering toetsen, signaleren tegenstrijdigheden en blinde vlekken — wat leidt tot een genuanceerder eindoordeel.',
  },
  {
    q: 'Hoe betrouwbaar zijn AI-antwoorden op juridische vragen?',
    a: "AI-modellen kunnen fouten maken, verouderde informatie bevatten of wetgeving verkeerd interpreteren. FAINL's multi-model aanpak reduceert dit risico doordat modellen elkaars antwoorden bekritiseren. Raadpleeg altijd een jurist voor bindende beslissingen.",
  },
  {
    q: 'Is FAINL AVG-compliant voor zakelijk gebruik?',
    a: 'FAINL slaat sessiegeschiedenis lokaal in je browser op. Je vragen worden via een beveiligde proxy verwerkt. Verwerk geen persoonsgegevens van derden in je AI-vragen.',
  },
];

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      headline: 'AI voor Juridisch Advies: Waarom Multi-Model Beter Werkt',
      description: 'Hoe meerdere AI-modellen samen contracten reviewen, rechtsvragen analyseren en compliance toetsen. Inclusief voorbeeldvragen en gebruik voor Nederlandse rechtspraktijk.',
      url: 'https://www.fainl.com/gebruik/juridisch-advies-ai',
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
        { '@type': 'ListItem', position: 3, name: 'Juridisch Advies', item: 'https://www.fainl.com/gebruik/juridisch-advies-ai' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQS.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ],
};

export const UseCaseLegalPage: FC = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <SEO
        title="AI voor Juridisch Advies: Waarom Multi-Model Beter Werkt"
        description="Gebruik meerdere AI-modellen voor contractreview, rechtsvragen en compliance. FAINL laat ChatGPT, Gemini en Claude elkaars juridische redenering toetsen voor een betrouwbaarder advies."
        canonical="/gebruik/juridisch-advies-ai"
        keywords="AI juridisch advies, AI contractreview, AI voor recht Nederland, ChatGPT juridisch, kunstmatige intelligentie recht, AVG compliance AI, AI rechtsadvies"
        ogTitle="AI voor Juridisch Advies — Multi-Model Geeft Betrouwbaarder Inzicht"
        ogDescription="Laat ChatGPT, Gemini en Claude samen juridische vragen analyseren. Meer invalshoeken, minder blinde vlekken."
        jsonLd={JSON_LD}
      />

      <nav aria-label="Breadcrumb" className="max-w-4xl mx-auto px-5 sm:px-8 pt-6">
        <ol className="flex items-center gap-2 text-base font-black uppercase tracking-widest text-black dark:text-white/30">
          <li><button type="button" onClick={() => navigate('/')} className="hover:text-black dark:hover:text-white transition-colors">Home</button></li>
          <li>/</li>
          <li className="text-black dark:text-white/50">Gebruik</li>
          <li>/</li>
          <li className="text-black dark:text-white">Juridisch Advies</li>
        </ol>
      </nav>

      <section className="max-w-4xl mx-auto px-5 sm:px-8 pt-10 pb-14 md:pt-14 md:pb-20">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-black dark:bg-[var(--action)] text-white dark:text-black text-lg font-black uppercase tracking-[0.25em] rounded-none mb-6">
          Use case — Juridisch
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black uppercase tracking-tighter text-black dark:text-white leading-[1.05] mb-6">
          AI voor juridisch advies:{' '}
          <span className="text-[var(--ink)]">drie modellen zien meer.</span>
        </h1>
        <p className="text-xl sm:text-2xl text-black dark:text-white/80 leading-relaxed max-w-2xl mb-8">
          Juridische vragen hebben zelden één correct antwoord — ze kennen interpretaties,
          uitzonderingen en tegenstrijdige precedenten. Eén AI-model geeft één perspectief.{' '}
          <strong className="text-black dark:text-[var(--ink)]">FAINL laat drie modellen parallel redeneren en elkaars blinde vlekken blootleggen.</strong>
        </p>
        <button type="button" onClick={() => navigate('/mission')}
          className="inline-flex items-center gap-4 px-10 py-5 bg-black dark:bg-[var(--action)] text-white dark:text-black font-black text-lg md:text-xl uppercase tracking-widest rounded-none hover:bg-[var(--action)] hover:text-black dark:hover:bg-white transition-all shadow-lg">
          Stel je juridische vraag — gratis
          <ArrowRight className="w-5 h-5" />
        </button>
      </section>

      <section aria-label="Juridische use cases" className="max-w-4xl mx-auto px-5 sm:px-8 pb-16">
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

      <section aria-label="Disclaimer" className="max-w-4xl mx-auto px-5 sm:px-8 pb-16">
        <div className="border-4 border-amber-400 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-500 rounded-none p-10">
          <div className="flex items-start gap-6">
            <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400 shrink-0 mt-1" />
            <div>
              <p className="font-black text-xl uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-3">Belangrijk</p>
              <p className="text-lg text-amber-900 dark:text-amber-200/90 leading-relaxed font-bold">
                AI is een hulpmiddel voor onderzoek en oriëntatie — geen vervanging voor professioneel juridisch advies.
                Raadpleeg altijd een gekwalificeerde jurist of advocaat voor bindende beslissingen.
                AI-modellen kunnen fouten maken en beschikken mogelijk over verouderde wetteksten.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="CTA" className="max-w-4xl mx-auto px-5 sm:px-8 pb-16">
        <div className="bg-black dark:bg-[var(--action)] rounded-none p-10 md:p-16 shadow-lg dark:shadow-lg">
          <h2 className="text-2xl md:text-5xl font-black uppercase tracking-tight text-white dark:text-black mb-6 leading-tight">
            Drie AI-modellen, <span className="text-[var(--ink)] dark:text-black">één juridisch eindoordeel</span>
          </h2>
          <p className="text-white/80 dark:text-black/80 leading-relaxed text-xl md:text-2xl mb-10">
            Stel je juridische vraag aan FAINL. ChatGPT, Gemini én Claude analyseren parallel,
            bekritiseren elkaars interpretatie en FAINL synthetiseert het meest genuanceerde,
            gewogen antwoord — inclusief de kanttekeningen.
          </p>
          <button type="button" onClick={() => navigate('/mission')}
            className="inline-flex items-center gap-4 px-10 py-5 bg-[var(--action)] dark:bg-black text-black dark:text-white font-black text-lg md:text-xl uppercase tracking-widest rounded-none hover:bg-white hover:text-black transition-all shadow-lg">
            Stel je vraag — twee gratis sessies
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
