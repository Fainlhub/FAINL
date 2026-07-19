import { FC } from 'react';
import { ShieldCheck } from 'lucide-react';
import { SEO } from './SEO';

export const PrivacyPolicyPage: FC = () => {
  return (
    <>
    <SEO
      title="Privacyverklaring — FAINL"
      description="Hoe FAINL omgaat met jouw persoonsgegevens. Versie 03-2026."
      canonical="/privacy"
      keywords="FAINL privacy, privacyverklaring AI tool, AVG FAINL"
    />
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white dark:bg-black border-4 border-black dark:border-[var(--ink)] p-10 md:p-20 shadow-lg dark:shadow-lg rounded-none">

        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-8 mb-16 pb-12 border-b-4 border-black/10 dark:border-[var(--ink)]/20">
          <div className="w-20 h-20 bg-black dark:bg-[var(--ink)] rounded-none flex items-center justify-center shrink-0">
            <ShieldCheck className="text-white dark:text-black w-10 h-10" />
          </div>
          <div>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-black dark:text-white leading-tight mb-4">Privacyverklaring</h1>
            <p className="text-lg font-black text-[var(--ink)] dark:text-[var(--ink)] uppercase tracking-widest">FAINL — MNRV · Versie 03.2026 · Bijgewerkt 13-03-2026</p>
          </div>
        </div>

        {/* Body */}
        <div className="prose prose-xl max-w-none dark:prose-invert prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-6 prose-p:text-black/80 dark:prose-p:text-white/80 prose-li:text-black/80 dark:prose-li:text-white/80 prose-strong:text-black dark:prose-strong:text-[var(--ink)]">

          <h2>Wie is verantwoordelijk?</h2>
          <p>FAINL, MNRV, gevestigd te Haaren en ingeschreven bij de Kamer van Koophandel onder nummer 99723611, is verwerkingsverantwoordelijke voor de verwerking van persoonsgegevens zoals beschreven in deze privacyverklaring.</p>
          <p>Contact: <a href="mailto:info@mnrv.nl">info@mnrv.nl</a></p>

          <h2>Op wie ziet deze verklaring?</h2>
          <p>Deze privacyverklaring is van toepassing op alle bezoekers van de website, gebruikers van de applicatie, contactpersonen van klanten, prospects, leveranciers en andere betrokkenen van wie FAINL persoonsgegevens verwerkt.</p>

          <h2>Welke persoonsgegevens verwerkt FAINL?</h2>
          <p>FAINL kan onder meer de volgende persoonsgegevens verwerken:</p>
          <ul>
            <li>account- en identificatiegegevens, zoals naam, e-mailadres, bedrijfsnaam, functietitel, gebruikersnaam en wachtwoordhash;</li>
            <li>contactgegevens, zoals telefoonnummer, factuuradres en correspondentie;</li>
            <li>betalings- en abonnementsgegevens, zoals factuurgegevens, betaalstatus, transactiereferenties en abonnementsvorm;</li>
            <li>technische gegevens, zoals IP-adres, apparaatgegevens, browsergegevens, logbestanden, sessiegegevens, foutmeldingen en beveiligingsgegevens;</li>
            <li>gebruiksgegevens, zoals interacties met de website of applicatie, voorkeuren, instellingen en gebruiksfrequentie;</li>
            <li>Input en Output, voor zover daarin persoonsgegevens voorkomen;</li>
            <li>communicatiegegevens, zoals e-mails, supportverzoeken, feedback en contacthistorie.</li>
          </ul>

          <h2>Voor welke doeleinden verwerkt FAINL persoonsgegevens?</h2>
          <p>FAINL verwerkt persoonsgegevens voor de volgende doeleinden:</p>
          <ul>
            <li>het aanmaken en beheren van accounts;</li>
            <li>het leveren, beveiligen, verbeteren en onderhouden van de Dienst;</li>
            <li>het genereren van Output op basis van Input van Gebruiker;</li>
            <li>facturatie, administratie en betalingsverwerking;</li>
            <li>klantenservice, support en afhandeling van vragen of klachten;</li>
            <li>fraudepreventie, misbruikdetectie, monitoring en beveiliging;</li>
            <li>naleving van wettelijke verplichtingen;</li>
            <li>het verzenden van serviceberichten en, indien toegestaan, marketingcommunicatie;</li>
            <li>analyse van gebruikspatronen om prestaties, gebruikerservaring en betrouwbaarheid te verbeteren.</li>
          </ul>

          <h2>Op welke grondslagen verwerkt FAINL persoonsgegevens?</h2>
          <p>FAINL verwerkt persoonsgegevens op basis van:</p>
          <ul>
            <li>de uitvoering van de overeenkomst;</li>
            <li>het voldoen aan wettelijke verplichtingen;</li>
            <li>gerechtvaardigde belangen, zoals beveiliging, productverbetering, support, fraudecontrole en verdediging van rechtsvorderingen;</li>
            <li>toestemming, voor zover wettelijk vereist, bijvoorbeeld voor bepaalde cookies of marketingberichten.</li>
          </ul>

          <h2>Verwerkt FAINL bijzondere persoonsgegevens?</h2>
          <p>FAINL beoogt niet om bijzondere persoonsgegevens of persoonsgegevens van kinderen doelgericht te verwerken. Gebruikers dienen dergelijke gegevens niet in te voeren, tenzij zij daartoe rechtmatig bevoegd zijn en dit strikt noodzakelijk is. Indien FAINL constateert dat zonder rechtsgrond bijzondere persoonsgegevens zijn verwerkt, kan zij deze verwijderen of afschermen.</p>

          <h2>Hoe gaat FAINL om met Input en Output?</h2>
          <p>De Dienst van FAINL is openbaar gepositioneerd als AI-gedreven omgeving waarin gebruikers vragen kunnen invoeren en AI-output ontvangen. FAINL verwerkt Input en genereert Output voor het uitvoeren van de Dienst. FAINL gebruikt Input en Output niet voor het trainen van algemene AI-modellen, tenzij dit uitdrukkelijk vooraf kenbaar is gemaakt en daarvoor een geldige grondslag bestaat.</p>
          <p>Voor Beeldraad omvat Input de tekstprompt en instellingen. Output omvat originelen, veiligheidscontroles, gestructureerde critiques, tussenversies, finalisten en rangschikkingen. Deze gegevens worden voor uitvoering van de opdracht gedeeld met de geactiveerde beeld- en beoordelingsproviders die voor de betreffende run nodig zijn.</p>
          <p>Beeldraadprojecten staan in private opslag en zijn alleen toegankelijk voor de eigenaar via geauthenticeerde toegang of kortlevende downloadlinks. FAINL bewaart de veilige artifacts totdat de Gebruiker het project verwijdert. De daaropvolgende technische purge wordt uiterlijk binnen 24 uur afgerond. Geblokkeerde of verdachte output kan tijdelijk in quarantaine blijven voor beveiliging en misbruikonderzoek.</p>

          <h2>Met wie deelt FAINL persoonsgegevens?</h2>
          <p>FAINL kan persoonsgegevens delen met:</p>
          <ul>
            <li>hosting- en infrastructuurleveranciers;</li>
            <li>authenticatie-, database-, analytics- en beveiligingsleveranciers;</li>
            <li>betaalproviders;</li>
            <li>e-mail- en supportproviders;</li>
            <li>AI-model- of API-leveranciers, voor zover noodzakelijk om de Dienst uit te voeren;</li>
            <li>professionele adviseurs, toezichthouders of bevoegde autoriteiten, indien wettelijk vereist.</li>
          </ul>
          <p>FAINL sluit waar nodig verwerkersovereenkomsten en maakt afspraken over vertrouwelijkheid en beveiliging.</p>

          <h2>Doorgifte buiten de EER</h2>
          <p>Indien persoonsgegevens worden doorgegeven aan partijen buiten de Europese Economische Ruimte, treft FAINL passende waarborgen conform de AVG, zoals een adequaatheidsbesluit, standaardcontractbepalingen of een andere wettelijk toegestane grondslag.</p>

          <h2>Bewaartermijnen</h2>
          <p>FAINL bewaart persoonsgegevens niet langer dan noodzakelijk. In beginsel hanteert FAINL de volgende uitgangspunten:</p>
          <ul>
            <li>accountgegevens: zolang het account actief is en tot twee maanden daarna;</li>
            <li>factuur- en betaalgegevens: minimaal zeven jaar voor fiscale bewaarplichten;</li>
            <li>supportcorrespondentie: tot één jaar na afhandeling;</li>
            <li>beveiligings- en toegangslogs: tot zeven maanden;</li>
            <li>tekstuele Input en Output: 30 dagen of conform de gekozen productinstelling;</li>
            <li>Beeldraadprojecten en bijbehorende artifacts: totdat de Gebruiker het project verwijdert, gevolgd door een technische purge binnen 24 uur.</li>
          </ul>

          <h2>Beveiliging</h2>
          <p>FAINL treft passende technische en organisatorische maatregelen om persoonsgegevens te beschermen tegen verlies, onbevoegde toegang, vernietiging, misbruik of onrechtmatige verwerking. Deze maatregelen kunnen omvatten: versleuteling, toegangsbeperking, logging, monitoring, patchmanagement, back-upmaatregelen en leveranciersscreening.</p>

          <h2>Cookies en vergelijkbare technieken</h2>
          <p>FAINL gebruikt cookies en vergelijkbare technieken voor functionele werking, beveiliging, analyse en, indien van toepassing, marketing. Voor niet-noodzakelijke cookies vraagt FAINL vooraf toestemming voor zover wettelijk vereist. Zie ook onze <a href="/cookies">Cookieverklaring</a>.</p>

          <h2>Rechten van betrokkenen</h2>
          <p>Betrokkenen hebben, voor zover wettelijk van toepassing, het recht op: inzage, rectificatie, verwijdering, beperking van verwerking, overdraagbaarheid van gegevens, bezwaar tegen verwerking op basis van gerechtvaardigd belang, intrekking van toestemming en het indienen van een klacht bij de Autoriteit Persoonsgegevens.</p>
          <p>Verzoeken kunnen worden gericht aan <a href="mailto:info@mnrv.nl">info@mnrv.nl</a>. FAINL kan om aanvullende identificatie vragen voordat op een verzoek wordt beslist.</p>

          <h2>Verwerkersovereenkomst voor zakelijke klanten</h2>
          <p>Indien een zakelijke klant persoonsgegevens via FAINL laat verwerken en FAINL daarbij optreedt als verwerker, zal FAINL op verzoek een verwerkersovereenkomst beschikbaar stellen.</p>

          <h2>Wijzigingen</h2>
          <p>FAINL mag deze privacyverklaring wijzigen. De meest actuele versie wordt op de website gepubliceerd. Bij wezenlijke wijzigingen zal FAINL, indien passend, gebruikers actief informeren.</p>

          <h2>Contact</h2>
          <p>
            MNRV — FAINL<br />
            <a href="mailto:info@mnrv.nl">info@mnrv.nl</a><br />
            KvK: 99723611
          </p>

        </div>
      </div>
    </div>
    </>
  );
};
