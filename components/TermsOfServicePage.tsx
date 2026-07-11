import { FC } from 'react';
import { Gavel } from 'lucide-react';
import { SEO } from './SEO';

export const TermsOfServicePage: FC = () => {
  return (
    <>
    <SEO
      title="Algemene Voorwaarden — FAINL"
      description="De algemene voorwaarden van FAINL. Versie 13-03-2026."
      canonical="/terms"
      keywords="FAINL algemene voorwaarden, gebruiksvoorwaarden AI tool, FAINL terms"
    />
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white dark:bg-black border-4 border-black dark:border-[var(--line)] p-10 md:p-20 shadow-lg dark:shadow-lg rounded-none">

        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-8 mb-16 pb-12 border-b-4 border-black/10 dark:border-[var(--line)]/20">
          <div className="w-20 h-20 bg-black dark:bg-[var(--action)] rounded-none flex items-center justify-center shrink-0">
            <Gavel className="text-white dark:text-black w-10 h-10" />
          </div>
          <div>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-black dark:text-white leading-tight mb-4">Algemene Voorwaarden</h1>
            <p className="text-lg font-black text-[var(--ink)] dark:text-[var(--ink)] uppercase tracking-widest">FAINL — MNRV · Versie 13-03-2026</p>
          </div>
        </div>

        {/* Body */}
        <div className="prose prose-xl max-w-none dark:prose-invert prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-6 prose-p:text-black dark:prose-p:text-white/80 prose-li:text-black dark:prose-li:text-white/80 prose-strong:text-black dark:prose-strong:text-[var(--ink)]">

          <h2>Artikel 1 — Definities</h2>
          <p><strong>FAINL:</strong> MNRV gevestigd te Haaren, ingeschreven in het Handelsregister van de Kamer van Koophandel onder nummer 99723611, handelend onder de naam MNRV - FAINL.</p>
          <p><strong>Gebruiker:</strong> iedere natuurlijke persoon of rechtspersoon die gebruikmaakt van de website, applicatie of diensten van FAINL.</p>
          <p><strong>Account:</strong> de persoonlijke of zakelijke registratie waarmee toegang wordt verkregen tot de Dienst.</p>
          <p><strong>Dienst:</strong> de door FAINL aangeboden website, software, applicatie en aanverwante functionaliteiten, waaronder AI-gegenereerde analyse, vergelijking, aggregatie, synthese en presentatie van output.</p>
          <p><strong>Output:</strong> iedere door of via de Dienst gegenereerde reactie, analyse, samenvatting, vergelijking, conclusie, aanbeveling of andere uitkomst.</p>
          <p><strong>Input:</strong> alle door Gebruiker ingevoerde gegevens, prompts, bestanden, opdrachten, instructies, documenten, vragen en overige content.</p>
          <p><strong>Overeenkomst:</strong> de overeenkomst tussen FAINL en Gebruiker inzake het gebruik van de Dienst.</p>
          <p><strong>Schriftelijk:</strong> per brief of langs elektronische weg, waaronder e-mail, mits de identiteit van de afzender en de integriteit van de inhoud voldoende vaststaan.</p>

          <h2>Artikel 2 — Toepasselijkheid</h2>
          <p>Deze algemene voorwaarden zijn van toepassing op ieder gebruik van de Dienst, op iedere aanbieding van FAINL en op iedere Overeenkomst tussen FAINL en Gebruiker.</p>
          <p>Afwijkingen zijn uitsluitend geldig indien schriftelijk overeengekomen.</p>
          <p>Eventuele algemene voorwaarden van Gebruiker worden uitdrukkelijk van de hand gewezen.</p>
          <p>Indien een bepaling nietig is of vernietigd wordt, blijven de overige bepalingen volledig van kracht. Partijen zullen in dat geval een vervangende bepaling overeenkomen die zoveel mogelijk aansluit bij doel en strekking van de oorspronkelijke bepaling.</p>

          <h2>Artikel 3 — De Dienst</h2>
          <p>FAINL biedt een AI-gedreven applicatie aan die Input van Gebruiker kan verwerken en kan omzetten in Output met behulp van eigen logica, meerdere modellen, externe modellen, rekenlagen, orkestratie of combinaties daarvan.</p>
          <p>FAINL heeft het recht om de inhoud, werking, vormgeving, gebruikte modellen, leveranciers, functionaliteiten en beschikbaarheid van de Dienst op ieder moment te wijzigen, uit te breiden, te beperken of te beëindigen.</p>
          <p>Tenzij schriftelijk anders overeengekomen geldt de Dienst als een inspanningsverbintenis en niet als resultaatsverbintenis.</p>
          <p>FAINL garandeert niet dat Output juist, volledig, actueel, juridisch houdbaar, commercieel bruikbaar, foutloos, ononderbroken of voor enig specifiek doel geschikt is.</p>

          <h2>Artikel 4 — Account en toegang</h2>
          <p>Voor toegang tot (delen van) de Dienst kan een Account vereist zijn.</p>
          <p>Gebruiker staat in voor juiste, volledige en actuele registratiegegevens.</p>
          <p>Inloggegevens zijn strikt persoonlijk en mogen niet worden gedeeld, tenzij FAINL dit schriftelijk toestaat.</p>
          <p>Gebruiker is verantwoordelijk voor alle handelingen via het Account, behoudens voor zover sprake is van aantoonbare tekortkoming aan de zijde van FAINL.</p>
          <p>FAINL mag toegang blokkeren, opschorten of beëindigen indien zij redelijkerwijs vermoedt dat sprake is van misbruik, onbevoegd gebruik, veiligheidsrisico's, schending van wet- of regelgeving of strijd met deze voorwaarden.</p>

          <h2>Artikel 5 — Gebruik van de Dienst</h2>
          <p>Gebruiker zal de Dienst uitsluitend gebruiken in overeenstemming met de wet, deze voorwaarden en de redelijke instructies van FAINL.</p>
          <p>Het is Gebruiker verboden om via de Dienst:</p>
          <ul>
            <li>onrechtmatige, misleidende, discriminerende, bedreigende of schadelijke content te verwerken;</li>
            <li>persoonsgegevens van derden te verwerken zonder geldige rechtsgrond;</li>
            <li>vertrouwelijke informatie van derden te gebruiken zonder bevoegdheid;</li>
            <li>malware, spam, scraping, reverse engineering, penetratie-aanvallen of andere ontwrichtende handelingen te verrichten;</li>
            <li>de Dienst te gebruiken voor schending van intellectuele eigendomsrechten, privacyrechten of andere rechten van derden;</li>
            <li>de Dienst in te zetten voor volledig geautomatiseerde besluitvorming met rechtsgevolgen of vergelijkbaar aanzienlijk effect, tenzij Gebruiker zelf volledig verantwoordelijk blijft voor menselijke controle en wettelijke naleving.</li>
          </ul>
          <p>Gebruiker blijft volledig verantwoordelijk voor de selectie van Input, de interpretatie van Output en ieder gebruik of ieder nalaten op basis van Output.</p>

          <h2>Artikel 6 — Intellectuele eigendom</h2>
          <p>Alle intellectuele eigendomsrechten met betrekking tot de Dienst, de software, de onderliggende systemen, promptsjablonen, werkmethodes, interface, databestanden, merkuitingen en documentatie berusten uitsluitend bij FAINL of haar licentiegevers.</p>
          <p>De Overeenkomst strekt uitsluitend tot het verlenen van een beperkt, herroepelijk, niet-exclusief, niet-overdraagbaar gebruiksrecht voor de duur van de Overeenkomst en uitsluitend voor het overeengekomen doel.</p>
          <p>Het is Gebruiker niet toegestaan de Dienst of onderdelen daarvan te kopiëren, verkopen, sublicentiëren, openbaar te maken, te decompileren, te reconstrueren of anderszins te exploiteren buiten de grenzen van dwingend recht of schriftelijke toestemming.</p>
          <p>Voor zover Output auteursrechtelijk beschermd kan zijn, verkrijgt Gebruiker uitsluitend een gebruiksrecht op de door hem rechtmatig verkregen Output voor eigen interne of overeengekomen bedrijfsdoeleinden.</p>
          <p>FAINL staat er niet voor in dat Output vrij is van rechten van derden.</p>

          <h2>Artikel 7 — Input en rechten van Gebruiker</h2>
          <p>Gebruiker garandeert dat hij gerechtigd is de Input aan FAINL beschikbaar te stellen en dat de verwerking daarvan geen inbreuk maakt op rechten van derden of toepasselijke wetgeving.</p>
          <p>Gebruiker vrijwaart FAINL volledig voor aanspraken van derden die voortvloeien uit of verband houden met de door Gebruiker aangeleverde Input.</p>
          <p>Indien en voor zover noodzakelijk voor de uitvoering van de Overeenkomst verleent Gebruiker aan FAINL een niet-exclusieve, wereldwijde, sublicentieerbare licentie om Input te hosten, verwerken, opslaan, reproduceren en technisch beschikbaar te maken gedurende de looptijd en voor zover noodzakelijk voor beveiliging, support, logging, fraudepreventie en compliance.</p>
          <p>FAINL gebruikt Input niet voor modeltraining, tenzij dit uitdrukkelijk en ondubbelzinnig anders is vermeld in de privacyverklaring of schriftelijk is overeengekomen.</p>

          <h2>Artikel 8 — Output en verantwoordelijkheid</h2>
          <p>Output is automatisch gegenereerde inhoud en kan onjuistheden, weglatingen, vertekeningen, hallucinaties, verouderde gegevens of ongewenste interpretaties bevatten.</p>
          <p>Output geldt nooit als juridisch, medisch, fiscaal, financieel, technisch of ander professioneel advies, tenzij uitdrukkelijk schriftelijk anders overeengekomen.</p>
          <p>Gebruiker is verplicht iedere wezenlijke Output zelfstandig te controleren alvorens daarop te vertrouwen of daarop te handelen.</p>
          <p>FAINL is niet aansprakelijk voor schade als gevolg van uitsluitend of grotendeels vertrouwen op Output zonder adequate menselijke verificatie.</p>

          <h2>Artikel 9 — Beschikbaarheid, onderhoud en wijzigingen</h2>
          <p>FAINL spant zich in de Dienst zoveel mogelijk beschikbaar te houden, maar garandeert geen ononderbroken of foutloze beschikbaarheid.</p>
          <p>FAINL mag onderhoud uitvoeren, updates uitrollen en functionaliteiten wijzigen zonder voorafgaande toestemming van Gebruiker.</p>
          <p>Storingen, vertragingen of onderbrekingen veroorzaakt door internet, hostingpartijen, modelproviders, API-leveranciers, betaalproviders of andere derden komen in beginsel niet voor rekening van FAINL, tenzij sprake is van opzet of bewuste roekeloosheid van FAINL.</p>

          <h2>Artikel 10 — Vergoeding, abonnementen, credits en betaling</h2>
          <p>Voor het gebruik van de Dienst kan FAINL eenmalige vergoedingen, abonnementskosten, creditsystemen of andere prijsmodellen hanteren.</p>
          <p>Alle door FAINL genoemde prijzen zijn exclusief btw, tenzij uitdrukkelijk anders vermeld.</p>
          <p>Betaling dient plaats te vinden overeenkomstig de op de website of factuur vermelde betaaltermijn.</p>
          <p>Tenzij schriftelijk anders overeengekomen zijn betaalde bedragen niet restitueerbaar.</p>
          <p>Credits, indien van toepassing, zijn persoons- of accountgebonden, niet inwisselbaar voor geld en vervallen conform de op het platform vermelde voorwaarden.</p>

          <h2>Artikel 10a — Refundbeleid en herroeping</h2>
          <p>Voor credits en creditverbruik geldt het volgende refundbeleid:</p>
          <ul>
            <li>Een antwoord geldt als geleverd zodra ten minste één AI-node succesvol heeft geantwoord en een eindantwoord is samengesteld. Voor geleverde antwoorden vindt geen restitutie van credits plaats.</li>
            <li>Indien vóór de start van een verwerking wordt vastgesteld dat de Dienst onbereikbaar is, worden geen credits afgeschreven.</li>
            <li>Indien géén van de AI-nodes een antwoord heeft kunnen leveren, kan Gebruiker binnen 14 dagen contact opnemen via <a href="mailto:info@mnrv.nl">info@mnrv.nl</a>; FAINL crediteert in dat geval de afgeschreven credits op het account.</li>
            <li>Ongebruikte credits zijn niet inwisselbaar voor geld, behoudens dwingend consumentenrecht.</li>
          </ul>
          <p>Consumenten hebben bij aankoop op afstand in beginsel een wettelijk herroepingsrecht van 14 dagen. Voor credits als digitale dienst geldt: door credits direct na aankoop beschikbaar te laten stellen en te gebruiken, stemt de consument uitdrukkelijk in met directe levering en doet daarmee afstand van het herroepingsrecht voor zover de dienst is geleverd. Voor het ongebruikte deel van een creditbundel kan de consument binnen 14 dagen na aankoop herroepen; terugbetaling vindt dan naar evenredigheid plaats.</p>
          <p>Bij gebruik van eigen API-sleutels (BYOK) worden geen credits afgeschreven; kosten van de eigen AI-provider(s) vallen volledig buiten FAINL en komen voor rekening van Gebruiker.</p>
          <p>FAINL mag prijzen en prijsmodellen wijzigen. Wijzigingen in lopende consumentenabonnementen worden tijdig aangekondigd.</p>
          <p>Bij niet-tijdige betaling is Gebruiker van rechtswege in verzuim en is FAINL gerechtigd de toegang tot de Dienst geheel of gedeeltelijk op te schorten.</p>

          <h2>Artikel 11 — Duur en beëindiging</h2>
          <p>De Overeenkomst wordt aangegaan voor onbepaalde tijd, tenzij uitdrukkelijk anders overeengekomen.</p>
          <p>Indien sprake is van een abonnement, wordt dit automatisch verlengd voor dezelfde periode, tenzij tijdig wordt opgezegd overeenkomstig de op het platform vermelde opzegtermijn.</p>
          <p>FAINL mag de Overeenkomst met onmiddellijke ingang geheel of gedeeltelijk opschorten of beëindigen indien:</p>
          <ul>
            <li>Gebruiker deze voorwaarden schendt;</li>
            <li>FAINL redelijkerwijs moet aannemen dat het gebruik risico's oplevert voor veiligheid, continuïteit of naleving van wetgeving;</li>
            <li>Gebruiker surseance van betaling aanvraagt, failliet gaat of zijn onderneming feitelijk staakt.</li>
          </ul>
          <p>Beëindiging laat reeds ontstane betalingsverplichtingen onverlet.</p>

          <h2>Artikel 12 — Aansprakelijkheid</h2>
          <p>Iedere aansprakelijkheid van FAINL is beperkt tot directe schade als rechtstreeks gevolg van een toerekenbare tekortkoming van FAINL.</p>
          <p>De totale aansprakelijkheid van FAINL is per gebeurtenis en per kalenderjaar beperkt tot het bedrag dat Gebruiker in de twaalf maanden voorafgaand aan de schadeveroorzakende gebeurtenis daadwerkelijk aan FAINL heeft betaald, met een absoluut maximum van EUR 100,00.</p>
          <p>FAINL is niet aansprakelijk voor indirecte schade, waaronder begrepen gevolgschade, gederfde winst, gemiste besparingen, bedrijfsstagnatie, reputatieschade, verlies van data, gemiste kansen, claims van derden en schade als gevolg van beslissingen gebaseerd op Output.</p>
          <p>De in dit artikel opgenomen beperkingen vervallen uitsluitend indien en voor zover de schade het gevolg is van opzet of bewuste roekeloosheid van FAINL.</p>
          <p>Iedere vordering verjaart uiterlijk twaalf maanden nadat Gebruiker bekend werd of redelijkerwijs bekend had kunnen zijn met de schade en de mogelijke aansprakelijkheid van FAINL.</p>

          <h2>Artikel 13 — Vrijwaring</h2>
          <p>Gebruiker vrijwaart FAINL, haar bestuurders, werknemers, hulppersonen en licentiegevers tegen alle aanspraken van derden, boetes, maatregelen, schade, kosten en redelijke advocaatkosten die voortvloeien uit:</p>
          <ul>
            <li>schending van deze voorwaarden door Gebruiker;</li>
            <li>onrechtmatige of onbevoegde Input;</li>
            <li>gebruik van de Dienst in strijd met wet- of regelgeving;</li>
            <li>gebruik van Output door Gebruiker of derden.</li>
          </ul>

          <h2>Artikel 14 — Privacy en gegevensverwerking</h2>
          <p>FAINL verwerkt persoonsgegevens overeenkomstig de privacyverklaring.</p>
          <p>Indien FAINL ten behoeve van een zakelijke klant persoonsgegevens verwerkt als verwerker in de zin van de AVG, sluiten partijen desgevraagd een verwerkersovereenkomst.</p>
          <p>Gebruiker blijft zelf verantwoordelijk voor de rechtmatigheid van de door hem ingevoerde persoonsgegevens.</p>

          <h2>Artikel 15 — Overmacht</h2>
          <p>FAINL is niet gehouden tot nakoming indien zij daartoe wordt verhinderd door overmacht.</p>
          <p>Onder overmacht vallen mede: storingen bij hostingproviders, internetuitval, uitval van model- of API-leveranciers, cyberincidenten, stroomstoringen, overheidsmaatregelen, oorlog, pandemieën, stakingen en overige omstandigheden buiten de redelijke invloedssfeer van FAINL.</p>

          <h2>Artikel 16 — Consumentenrecht</h2>
          <p>Indien Gebruiker consument is, gelden dwingendrechtelijke consumentenrechten onverkort.</p>
          <p>Voor zover wettelijk vereist verstrekt FAINL vóór het sluiten van de overeenkomst de wettelijk verplichte precontractuele informatie.</p>
          <p>Voor digitale inhoud of digitale diensten waarvan levering direct met instemming van de consument is begonnen, kan het herroepingsrecht vervallen indien aan de wettelijke voorwaarden is voldaan.</p>

          <h2>Artikel 17 — Toepasselijk recht en bevoegde rechter</h2>
          <p>Op iedere rechtsverhouding tussen FAINL en Gebruiker is uitsluitend Nederlands recht van toepassing.</p>
          <p>Geschillen worden uitsluitend voorgelegd aan de bevoegde rechter in het arrondissement waarin FAINL is gevestigd, tenzij dwingend recht anders voorschrijft.</p>

          <h2>Artikel 18 — Contact</h2>
          <p>
            FAINL / MNRV<br />
            <a href="mailto:info@mnrv.nl">info@mnrv.nl</a><br />
            KvK: 99723611<br />
            Btw-nummer: NL0056928B02
          </p>

        </div>
      </div>
    </div>
    </>
  );
};
