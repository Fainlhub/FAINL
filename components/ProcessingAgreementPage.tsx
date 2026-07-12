import { FC } from 'react';
import { FileCheck2 } from 'lucide-react';
import { SEO } from './SEO';

export const ProcessingAgreementPage: FC = () => {
  return (
    <>
      <SEO
        title="Verwerkersovereenkomst - FAINL"
        description="De verwerkersovereenkomst van FAINL voor zakelijke klanten die persoonsgegevens via de dienst verwerken."
        canonical="/verwerkersovereenkomst"
        keywords="FAINL verwerkersovereenkomst, AVG verwerker, data processing agreement FAINL"
      />
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="bg-white dark:bg-black border-4 border-black dark:border-[var(--line)] p-10 md:p-20 shadow-lg dark:shadow-lg rounded-none">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8 mb-16 pb-12 border-b-4 border-black/10 dark:border-[var(--line)]/20">
            <div className="w-20 h-20 bg-black dark:bg-[var(--action)] rounded-none flex items-center justify-center shrink-0">
              <FileCheck2 className="text-white dark:text-black w-10 h-10" />
            </div>
            <div>
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-black dark:text-white leading-tight mb-4">Verwerkersovereenkomst</h1>
              <p className="text-lg font-black text-[var(--ink)] dark:text-[var(--ink)] uppercase tracking-widest">FAINL - MNRV - Versie 13-03-2026</p>
            </div>
          </div>

          <div className="prose prose-xl max-w-none dark:prose-invert prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-6 prose-p:text-black/80 dark:prose-p:text-white/80 prose-li:text-black/80 dark:prose-li:text-white/80 prose-strong:text-black dark:prose-strong:text-[var(--ink)]">
            <p>Deze verwerkersovereenkomst is van toepassing wanneer FAINL persoonsgegevens verwerkt namens een zakelijke klant en FAINL daarbij optreedt als verwerker in de zin van de AVG.</p>

            <h2>Partijen en rolverdeling</h2>
            <p>De zakelijke klant is verwerkingsverantwoordelijke voor de persoonsgegevens die via de dienst worden ingevoerd of verwerkt. FAINL verwerkt deze gegevens uitsluitend voor het leveren, beveiligen, onderhouden en verbeteren van de dienst, voor zover dat binnen de opdracht past.</p>

            <h2>Onderwerp en duur</h2>
            <p>De verwerking ziet op het gebruik van de FAINL-applicatie, waaronder accountbeheer, AI-verwerking, sessiegeschiedenis, support, beveiliging, logging en facturatie. De overeenkomst loopt zolang de klant gebruikmaakt van de dienst of zolang FAINL gegevens moet bewaren op basis van wettelijke verplichtingen.</p>

            <h2>Categorieen gegevens</h2>
            <p>De verwerking kan betrekking hebben op accountgegevens, contactgegevens, technische loggegevens, betaal- en abonnementsgegevens, supportberichten, ingevoerde prompts, documenten, output en andere gegevens die de klant in de dienst verwerkt.</p>

            <h2>Instructies</h2>
            <p>FAINL verwerkt persoonsgegevens uitsluitend op basis van de overeenkomst, deze verwerkersovereenkomst, de privacyverklaring en redelijke schriftelijke instructies van de klant, tenzij wettelijke verplichtingen anders vereisen.</p>

            <h2>Beveiliging</h2>
            <p>FAINL past passende technische en organisatorische maatregelen toe, waaronder toegangsbeperking, versleuteling waar passend, logging, monitoring, leveranciersscreening, patchmanagement en back-upmaatregelen.</p>

            <h2>Subverwerkers</h2>
            <p>FAINL mag subverwerkers inschakelen voor hosting, database, authenticatie, betalingsverwerking, e-mail, analytics, support, AI-verwerking en beveiliging. FAINL maakt met subverwerkers afspraken over vertrouwelijkheid, beveiliging en gegevensbescherming.</p>

            <h2>Doorgifte buiten de EER</h2>
            <p>Wanneer verwerking buiten de Europese Economische Ruimte plaatsvindt, gebruikt FAINL passende waarborgen zoals een adequaatheidsbesluit, standaardcontractbepalingen of een andere toegestane grondslag.</p>

            <h2>Datalekken</h2>
            <p>FAINL informeert de klant zonder onredelijke vertraging over een beveiligingsincident dat waarschijnlijk gevolgen heeft voor persoonsgegevens die namens de klant worden verwerkt. FAINL verstrekt beschikbare informatie die de klant redelijkerwijs nodig heeft voor beoordeling en melding.</p>

            <h2>Rechten van betrokkenen</h2>
            <p>FAINL ondersteunt de klant redelijkerwijs bij verzoeken van betrokkenen, voor zover de klant deze verzoeken niet zelfstandig via de dienst kan afhandelen.</p>

            <h2>Einde van de dienst</h2>
            <p>Na beeindiging verwijdert of retourneert FAINL persoonsgegevens binnen een redelijke termijn, tenzij bewaring nodig is voor wettelijke verplichtingen, geschilafhandeling, beveiliging of administratie.</p>

            <h2>Contact</h2>
            <p>
              MNRV - FAINL<br />
              <a href="mailto:info@mnrv.nl">info@mnrv.nl</a><br />
              KvK: 99723611
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
