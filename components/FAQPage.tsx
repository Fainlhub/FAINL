import { useState, FC } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Zap,
  Coins,
  Cpu,
  Lock,
  Globe,
  MessageSquare
} from 'lucide-react';

import { useLanguage } from '../contexts/LanguageContext';
import { SEO } from './SEO';

export const FAQPage: FC = () => {
  const { language } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const FAQS = [
    {
      q: language === 'nl' ? "Wat doet FAINL precies?" : "What exactly does FAINL do?",
      a: language === 'nl' ? "FAINL is een orchestratielaag. In plaats van je vraag aan één AI te stellen, stuurt FAINL jouw vraag naar meerdere toonaangevende AI's tegelijk (zoals OpenAI, Google en Anthropic). Ze analyseren, debatteren en controleren elkaars werk. Jij krijgt vervolgens één gecheckt antwoord." : "FAINL is an orchestration layer. Instead of asking one AI, FAINL sends your query to multiple leading AIs simultaneously (like OpenAI, Google, and Anthropic). They analyze, debate, and verify each other's work. You receive one verified answer.",
      icon: Cpu
    },
    {
      q: language === 'nl' ? "Waarom is één AI niet genoeg?" : "Why is one AI not enough?",
      a: language === 'nl' ? "Omdat één AI fouten maakt (hallucinaties), blinde vlekken heeft en context kan missen. Door meerdere AI's elkaars werk te laten controleren, filter je zwaktes eruit." : "Because one AI makes mistakes (hallucinations), has blind spots, and can miss context. By having multiple AIs cross-check each other's work, weaknesses are filtered out.",
      icon: ShieldCheck
    },
    {
      q: language === 'nl' ? "Hoeveel kost het?" : "How much does it cost?",
      a: language === 'nl' ? "De eerste twee opdrachten zijn helemaal gratis — zonder account. Daarna kun je credits kopen vanaf €2,99. Geen abonnement verplicht, je betaalt alleen voor wat je gebruikt." : "The first two missions are completely free — no account required. After that, you can purchase credits from €2.99. No subscription required, pay only for what you use.",
      icon: Coins
    },
    {
      q: language === 'nl' ? "Welke AI-modellen gebruiken jullie?" : "Which AI models do you use?",
      a: language === 'nl' ? "Op dit moment orkestreren we de beste modellen van OpenAI, Anthropic, Google en DeepSeek. De samenstelling past zich aan voor het beste resultaat." : "Currently we orchestrate the best models from OpenAI, Anthropic, Google, and DeepSeek. The composition adapts for the best result.",
      icon: Zap
    },
    {
      q: language === 'nl' ? "Heb ik technische kennis nodig?" : "Do I need technical skills?",
      a: language === 'nl' ? "Nee. Je gebruikt FAINL precies zoals je ChatGPT gebruikt: je typt je vraag. Wij doen het ingewikkelde werk op de achtergrond." : "No. You use FAINL exactly like ChatGPT: you type your query. We handle the complex orchestration in the background.",
      icon: MessageSquare
    },
    {
      q: language === 'nl' ? "Is mijn data veilig?" : "Is my data secure?",
      a: language === 'nl' ? "Ja. FAINL verwerkt je missies versleuteld. We trainen geen eigen modellen op jouw data en slaan niets centraal op." : "Yes. FAINL processes your missions encrypted. We do not train proprietary models on your data and store nothing centrally.",
      icon: Lock
    },
    {
      q: language === 'nl' ? "Hoe verloopt een vraag binnen FAINL?" : "How does a query flow through FAINL?",
      a: language === 'nl' ? "Je voert één vraag in, waarna FAINL meerdere AI-modellen tegelijk laat meedenken. Daarna worden die uitkomsten niet los teruggegeven, maar verwerkt tot één gewogen eindantwoord. Dat sluit direct aan op de publieke propositie \"Meerdere AI's. Één Antwoord.\" en \"AI Consensus Engine\"." : "You enter one question, after which FAINL lets multiple AI models think along simultaneously. The outcomes are not returned separately, but processed into one weighted final answer — directly reflecting the core proposition: \"Multiple AIs. One Answer.\"",
      icon: Cpu
    },
    {
      q: language === 'nl' ? "Waarom voelt FAINL anders dan een normale AI-chat?" : "Why does FAINL feel different from a regular AI chat?",
      a: language === 'nl' ? "Omdat FAINL zich niet presenteert als één chatbot, maar als een consensuslaag boven meerdere modellen. De nadruk ligt dus niet op één spontane reactie, maar op het samenbrengen van meerdere perspectieven tot één scherper antwoord." : "Because FAINL does not present itself as a single chatbot, but as a consensus layer above multiple models. The focus is not on one spontaneous response, but on bringing together multiple perspectives into one sharper answer.",
      icon: MessageSquare
    },
    {
      q: language === 'nl' ? "Wat bedoelt FAINL met \"AI Consensus Engine\"?" : "What does FAINL mean by \"AI Consensus Engine\"?",
      a: language === 'nl' ? "Daarmee maakt FAINL duidelijk dat de waarde niet alleen zit in model-output, maar in de vergelijking, afweging en samenvoeging van meerdere AI-reacties. De kern is dus consensusvorming tussen modellen, niet alleen output genereren." : "This makes clear that the value lies not only in model output, but in the comparison, weighing, and merging of multiple AI responses. The core is consensus formation between models, not just generating output.",
      icon: Zap
    },
    {
      q: language === 'nl' ? "Welke modellen worden op de website concreet genoemd?" : "Which models are explicitly mentioned on the website?",
      a: language === 'nl' ? "Op de publiek zichtbare sitecopy worden Gemini, GPT-4 en Claude expliciet genoemd. Daarmee laat FAINL zien dat het platform niet aan één model vastzit, maar meerdere toonaangevende AI-systemen inzet." : "The publicly visible site copy explicitly names Gemini, GPT-4, and Claude. This shows that FAINL is not tied to one model, but uses multiple leading AI systems.",
      icon: Globe
    },
    {
      q: language === 'nl' ? "Krijg ik meerdere losse antwoorden of één eindantwoord?" : "Do I receive multiple separate answers or one final answer?",
      a: language === 'nl' ? "De zichtbare positionering van FAINL stuurt duidelijk op één eindantwoord. De site belooft niet vooral een rij modelreacties, maar juist één gewogen resultaat dat uit meerdere AI-bijdragen voortkomt." : "FAINL's positioning clearly steers toward one final answer. The site does not primarily promise a list of model responses, but rather one weighted result emerging from multiple AI contributions.",
      icon: HelpCircle
    },
    {
      q: language === 'nl' ? "Debatteren de modellen echt met elkaar?" : "Do the models actually debate with each other?",
      a: language === 'nl' ? "De publieke copy verwijst naar een live debat tussen AI's. Daarmee positioneert FAINL het proces als meer dan alleen parallel antwoorden ophalen: de modellen worden gepresenteerd als deelnemers in een gezamenlijke afweging vóór het eindoordeel verschijnt." : "The public copy refers to a live debate between AIs. This positions the process as more than just fetching parallel answers: the models are presented as participants in a joint deliberation before the final verdict appears.",
      icon: MessageSquare
    },
    {
      q: language === 'nl' ? "Wat is het voordeel van zo'n AI-debat?" : "What is the advantage of such an AI debate?",
      a: language === 'nl' ? "Volgens de manier waarop FAINL zichzelf neerzet, moet dat leiden tot een sterker eindantwoord dan wanneer je op één enkel model vertrouwt. Het idee is dat meerdere modellen elkaar aanvullen, corrigeren en aanscherpen voordat er één conclusie overblijft." : "According to how FAINL positions itself, this should lead to a stronger final answer than relying on a single model. The idea is that multiple models complement, correct, and sharpen each other before one conclusion remains.",
      icon: ShieldCheck
    },
    {
      q: language === 'nl' ? "Kan ik FAINL eerst proberen zonder direct te betalen?" : "Can I try FAINL before committing to payment?",
      a: language === 'nl' ? "Ja. De website vermeldt expliciet: \"Begin gratis. Betaal alleen als je meer wilt.\" Daarmee maakt FAINL duidelijk dat je niet direct aan een betaalde instap vastzit." : "Yes. The website explicitly states: \"Start free. Pay only when you want more.\" This makes clear that you are not immediately committed to a paid entry.",
      icon: Coins
    },
    {
      q: language === 'nl' ? "Werkt FAINL met credits?" : "Does FAINL work with credits?",
      a: language === 'nl' ? "Ja. De pricing-copy op de site noemt credits expliciet. Dat betekent dat gebruik in elk geval deels is opgezet rondom een creditsysteem in plaats van alleen een vast abonnement." : "Yes. The pricing copy on the site explicitly mentions credits. This means usage is at least partly structured around a credit system rather than only a fixed subscription.",
      icon: Coins
    },
    {
      q: language === 'nl' ? "Is er naast losse credits ook een abonnement?" : "Is there a subscription in addition to individual credits?",
      a: language === 'nl' ? "Ja. De publieke sitecopy noemt een Starter-plan met 50 credits per maand. FAINL biedt dus zichtbaar zowel een terugkerende vorm als een lossere instap via credits." : "Yes. The public site copy mentions a Starter plan with 50 credits per month. FAINL visibly offers both a recurring format and a more flexible entry via credits.",
      icon: Coins
    },
    {
      q: language === 'nl' ? "Wat houdt het Starter-plan in?" : "What does the Starter plan include?",
      a: language === 'nl' ? "Op basis van de zichtbare prijsinformatie omvat het Starter-plan 50 credits per maand. Dat wijst erop dat FAINL ook bedoeld is voor terugkerend gebruik en niet alleen voor incidentele losse vragen." : "Based on the visible pricing information, the Starter plan includes 50 credits per month. This indicates that FAINL is also designed for recurring use, not just incidental one-off questions.",
      icon: Coins
    },
    {
      q: language === 'nl' ? "Kan ik ook klein beginnen?" : "Can I start small?",
      a: language === 'nl' ? "Ja. De site noemt ook een optie met één credit. Dat maakt de drempel laag voor gebruikers die FAINL eerst willen testen op een enkele vraag of use case." : "Yes. The site also mentions an option with one credit. This lowers the barrier for users who want to test FAINL on a single question or use case first.",
      icon: Coins
    },
    {
      q: language === 'nl' ? "Zit er een limiet op de lengte van mijn vraag?" : "Is there a limit on the length of my question?",
      a: language === 'nl' ? "Nee, er is geen kunstmatige limiet op de lengte van je vraag. Of het nu een korte zin is of een uitgebreid document, FAINL verwerkt het voor een diepgaand antwoord." : "No, there is no artificial limit on the length of your question. Whether it's a short sentence or an extensive document, FAINL processes it for a profound answer.",
      icon: MessageSquare
    },
    {
      q: language === 'nl' ? "Wat betekent \"3 Nodes Standby\" op de site?" : "What does \"3 Nodes Standby\" mean on the site?",
      a: language === 'nl' ? "De site toont letterlijk \"3 Nodes Standby\". In de publieke productpresentatie lijkt dat te functioneren als statusaanduiding van beschikbare AI-capaciteit of actieve verwerkingslagen binnen het systeem. Het exacte technische detail wordt op de publieke snippet niet verder uitgelegd, maar de term wordt wel expliciet getoond." : "The site literally displays \"3 Nodes Standby\". In the public product presentation this appears to function as a status indicator of available AI capacity or active processing layers within the system. The exact technical detail is not elaborated on publicly, but the term is explicitly shown.",
      icon: Cpu
    },
    {
      q: language === 'nl' ? "Hoe presenteert FAINL zijn naam volledig?" : "How does FAINL present its full name?",
      a: language === 'nl' ? "FAINL wordt op de site uitgeschreven als \"Fully Autonomous Intelligence Network & Logic\". Daarmee geeft het merk direct zijn eigen positionering mee: autonoom, netwerkgedreven en gericht op logische synthese." : "FAINL is spelled out on the site as \"Fully Autonomous Intelligence Network & Logic\". This immediately conveys the brand's own positioning: autonomous, network-driven, and focused on logical synthesis.",
      icon: Globe
    },
    {
      q: language === 'nl' ? "Hoe communiceert FAINL over sessiebeveiliging?" : "How does FAINL communicate about session security?",
      a: language === 'nl' ? "De site toont expliciet \"Encrypted Session\". Daarmee communiceert FAINL publiek dat sessies versleuteld zijn of in elk geval als versleuteld worden gepresenteerd richting de gebruiker." : "The site explicitly shows \"Encrypted Session\". This publicly communicates that sessions are encrypted, or at least presented as encrypted to the user.",
      icon: Lock
    },
    {
      q: language === 'nl' ? "Wat bedoelt FAINL met \"Data persistent locally only\"?" : "What does FAINL mean by \"Data persistent locally only\"?",
      a: language === 'nl' ? "Die exacte tekst staat zichtbaar op de site. In gewone taal communiceert FAINL daarmee dat data lokaal persistent zou zijn en niet breed of centraal blijvend wordt bewaard. De precieze technische en juridische reikwijdte daarvan zou normaal gesproken verder moeten worden uitgewerkt in privacy- en productdocumentatie, maar de claim zelf staat publiek op de site." : "That exact text is visibly shown on the site. In plain language, FAINL communicates that data would be locally persistent and not stored broadly or centrally. The precise technical and legal scope would normally need further elaboration in privacy and product documentation, but the claim itself is public.",
      icon: Lock
    },
    {
      q: language === 'nl' ? "Is FAINL alleen voor experts of ook voor gewone gebruikers?" : "Is FAINL only for experts or also for regular users?",
      a: language === 'nl' ? "De publieke sitecopy bevat ook de bestaande vraag \"Voor wie is FAINL bedoeld?\", wat aangeeft dat FAINL zichzelf niet uitsluitend als technische tool voor ontwikkelaars neerzet, maar als product waarvoor doelgroepuitleg relevant is. De site positioneert het dus breder dan alleen een puur technische backend-oplossing." : "The public site copy includes the existing question \"Who is FAINL intended for?\", indicating that FAINL does not position itself exclusively as a technical tool for developers, but as a product where audience explanation is relevant. The site thus positions it more broadly than a purely technical backend solution.",
      icon: HelpCircle
    },
    {
      q: language === 'nl' ? "Waar ligt bij FAINL de nadruk: op veel output of op één sterk antwoord?" : "Where does FAINL place the emphasis: on lots of output or one strong answer?",
      a: language === 'nl' ? "Op één sterk antwoord. De publieke merkbelofte draait consequent om meerdere AI's die uitkomen op één einduitkomst. De nadruk ligt dus op filtering en weging, niet op zoveel mogelijk ruwe output teruggeven." : "On one strong answer. The public brand promise consistently revolves around multiple AIs converging on one final outcome. The emphasis is on filtering and weighing, not on returning as much raw output as possible.",
      icon: Zap
    },
    {
      q: language === 'nl' ? "Kan ik ergens meer productuitleg vinden als mijn vraag er niet tussen staat?" : "Can I find more product explanation if my question isn't listed?",
      a: language === 'nl' ? "Ja. De site vermeldt dat je de volledige FAQ kunt bekijken of contact kunt opnemen. Daarmee is er naast de kerncopy ook een apart informatiepad voor verdere productvragen." : "Yes. The site mentions that you can view the full FAQ or get in touch. This provides a separate information path for further product questions alongside the core copy.",
      icon: HelpCircle
    }
  ];

  return (
    <>
      <SEO
        title="Veelgestelde Vragen over FAINL — Meerdere AI-modellen"
        description="Antwoorden op de meest gestelde vragen over FAINL: hoe werkt AI consensus, wat kost het, en hoe beschermen we jouw data?"
        canonical="/faq"
        keywords="FAINL FAQ, AI consensus vragen, meerdere AI modellen, AI vergelijken Nederland"
      />
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-20 md:mb-32">
        <h1 className="text-3xl md:text-6xl lg:text-8xl font-black uppercase tracking-tighter mb-8 text-black dark:text-white leading-tight">
          {language === 'nl' ? 'Veelgestelde Vragen over FAINL' : 'Frequently Asked Questions'}
        </h1>
        <p className="max-w-3xl mx-auto text-black dark:text-white/80 font-bold text-xl md:text-2xl leading-relaxed">
          {language === 'nl'
            ? 'Lees hier hoe FAINL precies werkt, wat het kost en hoe we jouw data beschermen.'
            : 'Access the foundational logic and operational guidelines of the FAINL Orchestration Layer. Understand the mechanics of decentralized consensus and neural governance.'}
        </p>
      </div>

      <div className="space-y-6 md:space-y-10 max-w-5xl mx-auto">
        {FAQS.map((faq, idx) => (
          <div
            key={idx}
            className={`bg-white dark:bg-black border-4 border-black dark:border-[var(--line)] rounded-none overflow-hidden transition-all shadow-[12px_12px_0_0_black] dark:shadow-lg ${openIndex === idx ? 'ring-4 ring-zinc-400' : ''}`}
          >
            <button
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="w-full text-left p-8 md:p-12 flex items-center justify-between group"
            >
              <div className="flex items-center gap-6 md:gap-10">
                <div className={`p-4 rounded-none transition-colors ${openIndex === idx ? 'bg-[var(--action)] text-black' : 'bg-black dark:bg-[var(--action)] text-white dark:text-black'}`}>
                  <faq.icon className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <h3 className="text-xl md:text-3xl font-black uppercase tracking-tight leading-tight text-black dark:text-white">{faq.q}</h3>
              </div>
              <div className={`transition-transform duration-300 ${openIndex === idx ? 'rotate-180' : ''}`}>
                <ChevronDown className="w-8 h-8 md:w-12 md:h-12 text-black dark:text-[var(--ink)]" />
              </div>
            </button>
            {openIndex === idx && (
              <div className="px-8 md:px-12 pb-10 md:pb-16 animate-in slide-in-from-top-4 duration-300">
                <div className="pt-8 border-t-4 border-black/10 dark:border-[var(--line)]/20 text-lg md:text-2xl font-bold text-black dark:text-white/80 leading-relaxed">
                  {faq.a}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-20 text-center">
        <p className="text-base font-black text-black/40 dark:text-white/35 uppercase tracking-[0.5em]">
          {language === 'nl' ? 'Systeemrevisie 4.2.0 • Consensus Prioriteit 0' : 'System Revision 4.2.0 • Consensus Priority 0'}
        </p>
      </div>
    </div>
    </>
  );
};
