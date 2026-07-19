import { FC } from 'react';
import { Cpu } from 'lucide-react';
import { SEO } from './SEO';

export const AiTermsPage: FC = () => {
  return (
    <>
    <SEO
      title="Aanvullende AI-Gebruiksvoorwaarden — FAINL"
      description="De aanvullende gebruiksvoorwaarden voor AI-functionaliteiten van FAINL. Versie 03-2026."
      canonical="/ai-voorwaarden"
      keywords="FAINL AI voorwaarden, AI gebruiksvoorwaarden, AI terms FAINL"
    />
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white dark:bg-black border-4 border-black dark:border-[var(--line)] p-10 md:p-20 shadow-lg dark:shadow-lg rounded-none">

        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-8 mb-16 pb-12 border-b-4 border-black/10 dark:border-[var(--line)]/20">
          <div className="w-20 h-20 bg-black dark:bg-[var(--action)] rounded-none flex items-center justify-center shrink-0">
            <Cpu className="text-white dark:text-black w-10 h-10" />
          </div>
          <div>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-black dark:text-white leading-tight mb-4">Aanvullende AI-Gebruiksvoorwaarden</h1>
            <p className="text-lg font-black text-[var(--ink)] dark:text-[var(--ink)] uppercase tracking-widest">FAINL — MNRV · Versie 03.2026 · Bijgewerkt 13-03-2026</p>
          </div>
        </div>

        {/* Body */}
        <div className="prose prose-xl max-w-none dark:prose-invert prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-6 prose-p:text-black dark:prose-p:text-white/80 prose-li:text-black dark:prose-li:text-white/80 prose-strong:text-black dark:prose-strong:text-[var(--ink)]">

          <h2>Toepasselijkheid</h2>
          <p>Deze aanvullende voorwaarden zijn van toepassing op ieder gebruik van AI-functionaliteiten binnen FAINL en vormen een aanvulling op de algemene voorwaarden. Bij strijdigheid prevaleren deze aanvullende voorwaarden voor zover het specifiek AI-functionaliteiten betreft.</p>

          <h2>Karakter van de Dienst</h2>
          <p>FAINL levert een AI-ondersteunde dienst waarbij Input van Gebruiker geautomatiseerd wordt verwerkt tot Output. De website presenteert FAINL publiekelijk als oplossing waarbij meerdere AI's tot één antwoord worden gebracht. Gebruiker erkent dat de Dienst probabilistisch werkt en geen menselijke beoordeling vervangt.</p>

          <h2>Geen garantie op juistheid</h2>
          <p>FAINL geeft geen garantie dat Output:</p>
          <ul>
            <li>feitelijk juist is;</li>
            <li>volledig is;</li>
            <li>actueel is;</li>
            <li>vrij is van vooringenomenheid, hallucinaties of onwenselijke patronen;</li>
            <li>geschikt is voor juridische, financiële, medische, HR-, compliance- of andere hoog-risicobeslissingen.</li>
          </ul>
          <p>Gebruiker blijft te allen tijde zelf verantwoordelijk voor verificatie en beoordeling van de Output.</p>

          <h2>Verboden gebruik</h2>
          <p>Het is verboden om FAINL te gebruiken voor:</p>
          <ul>
            <li>onrechtmatige surveillance, profiling of discriminatie;</li>
            <li>misleiding, fraude of identiteitsmisbruik;</li>
            <li>geautomatiseerde besluitvorming met rechtsgevolgen zonder passende menselijke beoordeling;</li>
            <li>het genereren van onrechtmatige, haatdragende, gewelddadige of anderszins verboden content;</li>
            <li>het omzeilen van beveiliging, rate limits of toegangsbeperkingen;</li>
            <li>het testen of ontwikkelen van concurrerende modellen of diensten door extractie, scraping, modeldistillatie of systematische outputverzameling.</li>
          </ul>

          <h2>Persoonsgegevens en vertrouwelijkheid</h2>
          <p>Gebruiker zal geen persoonsgegevens of vertrouwelijke informatie invoeren tenzij daarvoor een geldige rechtsgrond en noodzaak bestaat.</p>
          <p>Het invoeren van bijzondere persoonsgegevens, bedrijfsgeheimen, staatsgeheimen, medische dossiers, BSN's, paspoortgegevens, strafrechtelijke gegevens of vergelijkbare gevoelige informatie is zonder uitdrukkelijke schriftelijke toestemming van FAINL verboden.</p>
          <p>Gebruiker vrijwaart FAINL voor aanspraken die voortvloeien uit ongeoorloofde of onrechtmatige invoer van gegevens.</p>

          <h2>Menselijke controle</h2>
          <p>Gebruiker zal geen wezenlijke zakelijke, juridische, financiële, operationele of personele beslissingen uitsluitend baseren op Output zonder passende menselijke controle, vakinhoudelijke toetsing en contextuele verificatie.</p>

          <h2>Beschikbaarheid van modellen</h2>
          <p>FAINL mag onderliggende modellen, modelcombinaties, providers, prompts, orkestratie en drempelwaarden op ieder moment aanpassen. Gebruiker heeft geen aanspraak op een specifiek model of een identieke uitkomst bij herhaalde invoer.</p>

          <h2>Beeldraad</h2>
          <p>Beeldraad verwerkt een tekstprompt via meerdere beeldmodellen en multimodale beoordelaars. De Raad adviseert en rangschikt, maar de Gebruiker blijft verantwoordelijk voor de uiteindelijke selectie, controle en het gebruik van een beeld.</p>
          <p>Een standaardrun reserveert vooraf maximaal negen credits. Alleen succesvol geleverde branchbundels, de afgeronde raad- en rangschikkingsbundel en succesvol geleverde finalist-polishes worden afgerekend. Ongebruikte, mislukte of na annulering niet uitgevoerde onderdelen worden automatisch teruggestort.</p>
          <p>Originelen, critiques, tussenversies, finalisten en rangschikkingen blijven prive opgeslagen totdat de Gebruiker het project verwijdert. Verwijdering start een technische purge van databasegegevens, originelen, thumbnails en afgeleiden, die uiterlijk binnen 24 uur wordt afgerond.</p>
          <p>FAINL kan beeldprompts en gegenereerde beelden voor veiligheidscontrole verwerken en kan verboden output blokkeren of in quarantaine plaatsen. Referentiebeelden en eigen API-sleutels voor beeldgeneratie worden in versie 1 niet ondersteund.</p>

          <h2>Thinking-niveaus en creditkosten</h2>
          <p>De chatfunctie kent oplopende thinking-niveaus. Per niveau werken meer AI-nodes op de achtergrond samen aan één antwoord; de creditkosten per antwoord stijgen mee:</p>
          <ul>
            <li><strong>Instant</strong> — één snel model, gratis;</li>
            <li><strong>Moderate</strong> — 3 nodes, 1 credit per antwoord;</li>
            <li><strong>Complex</strong> — 5 nodes, 2 credits per antwoord;</li>
            <li><strong>Max</strong> — 7 nodes, 3 credits per antwoord;</li>
            <li><strong>Ultra</strong> — 7 nodes met onderlinge toetsing, 5 credits per antwoord.</li>
          </ul>
          <p>Credits worden per antwoord afgeschreven vóór de verwerking start. FAINL mag de indeling, het aantal nodes en de creditkosten per niveau wijzigen; wijzigingen gelden niet met terugwerkende kracht voor reeds afgeschreven credits.</p>

          <h2>Fair use van het gratis Instant-niveau</h2>
          <p>Het gratis Instant-niveau is bedoeld voor normaal, persoonlijk gebruik. Geautomatiseerd, excessief of oneigenlijk gebruik (waaronder scripting, bulkbevraging of doorverkoop van output) is verboden. FAINL mag technische limieten hanteren, waaronder verzoeklimieten per tijdvak, en kan bij overschrijding de toegang tijdelijk of permanent beperken.</p>

          <h2>Eigen API-sleutels (BYOK)</h2>
          <p>Gebruiker kan eigen API-sleutels van ondersteunde AI-providers gebruiken. Daarbij geldt:</p>
          <ul>
            <li>sleutels worden uitsluitend lokaal in de browser van Gebruiker opgeslagen en worden rechtstreeks vanuit de browser naar de betreffende AI-provider verstuurd — zij passeren geen servers van FAINL;</li>
            <li>Gebruiker is zelf verantwoordelijk voor het beheer, de geheimhouding, de kosten en de voorwaarden die de AI-provider aan het gebruik van de sleutel verbindt;</li>
            <li>bij gebruik van eigen sleutels worden geen credits afgeschreven;</li>
            <li>FAINL is niet aansprakelijk voor schade die voortvloeit uit het gebruik, verlies of misbruik van eigen sleutels van Gebruiker, behoudens opzet of bewuste roekeloosheid van FAINL.</li>
          </ul>
          <p>BYOK geldt in versie 1 niet voor Beeldraad. Beeldruns zijn achtergrondtaken en gebruiken uitsluitend door FAINL beheerde providerkoppelingen, moderatie en creditafrekening.</p>

          <h2>Rechten op Output</h2>
          <p>Voor zover wettelijk mogelijk en behoudens rechten van derden mag Gebruiker de rechtmatig verkregen Output gebruiken voor eigen interne of overeengekomen bedrijfsdoeleinden. Het is Gebruiker niet toegestaan Output zodanig te gebruiken dat daarmee de Dienst, de onderliggende logica of een concurrerend product wordt nagebootst.</p>

          <h2>Audit en handhaving</h2>
          <p>FAINL mag gebruik monitoren voor beveiliging, naleving en misbruikdetectie. Bij vermoeden van verboden gebruik mag FAINL accounts, sessies, Input of toegang blokkeren, onderzoeken, verwijderen of bewaren voor bewijsdoeleinden.</p>

          <h2>Rangorde</h2>
          <p>Bij strijdigheid tussen deze AI-gebruiksvoorwaarden en andere voorwaarden van FAINL prevaleren deze AI-gebruiksvoorwaarden ten aanzien van AI-functionaliteiten.</p>

        </div>
      </div>
    </div>
    </>
  );
};
