import { FC, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, CheckCircle2, ExternalLink, Newspaper } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { SEO } from "./SEO";
import {
  findSeoContentPage,
  findSeoContentPageBySlug,
  getContentPath,
  SeoSection,
} from "../data/seoContent";
import { getPublishedNewsPost, NewsPost } from "../services/newsService";

const SITE_URL = "https://fainl.com";

interface SeoArticlePageProps {
  section: SeoSection;
}

export const SeoArticlePage: FC<SeoArticlePageProps> = ({ section }) => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const page = findSeoContentPage(section, slug);
  const [newsPost, setNewsPost] = useState<NewsPost | null>(null);
  const [newsLoaded, setNewsLoaded] = useState(section !== "nieuws" || Boolean(page));

  useEffect(() => {
    if (section !== "nieuws" || page || !slug) return;
    let active = true;
    setNewsLoaded(false);
    getPublishedNewsPost(slug)
      .then((post) => {
        if (!active) return;
        setNewsPost(post);
        setNewsLoaded(true);
      })
      .catch(() => {
        if (active) setNewsLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [page, section, slug]);

  if (!page && !newsLoaded) {
    return (
      <section className="max-w-4xl mx-auto px-5 sm:px-8 py-20">
        <div className="w-6 h-6 border-2 border-black/20 border-t-black dark:border-white/20 dark:border-t-white rounded-full animate-spin" />
      </section>
    );
  }

  if (!page && newsPost) {
    const canonical = `/nieuws/${newsPost.slug}`;
    const jsonLd = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Article",
          headline: newsPost.title,
          description: newsPost.excerpt,
          url: `${SITE_URL}${canonical}`,
          datePublished: newsPost.published_at || newsPost.created_at,
          dateModified: newsPost.published_at || newsPost.created_at,
          author: { "@type": "Organization", name: "FAINL", url: SITE_URL },
          publisher: {
            "@type": "Organization",
            name: "FAINL",
            logo: { "@type": "ImageObject", url: `${SITE_URL}/favicon.png` },
          },
          image: newsPost.hero_image_url ? [newsPost.hero_image_url] : undefined,
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
            { "@type": "ListItem", position: 2, name: "Nieuws", item: `${SITE_URL}/nieuws` },
            { "@type": "ListItem", position: 3, name: newsPost.title, item: `${SITE_URL}${canonical}` },
          ],
        },
      ],
    };

    return (
      <>
        <SEO
          title={newsPost.seo_title}
          description={newsPost.seo_description}
          canonical={canonical}
          keywords={newsPost.keywords.join(", ")}
          ogTitle={newsPost.title}
          ogDescription={newsPost.excerpt}
          ogImage={newsPost.hero_image_url || undefined}
          ogType="article"
          jsonLd={jsonLd}
        />

        <article className="max-w-5xl mx-auto px-5 sm:px-8 py-10 md:py-16">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-2 text-sm md:text-base font-black uppercase tracking-widest text-black/50 dark:text-white/50">
              <li><Link to="/" className="hover:text-black dark:hover:text-white">Home</Link></li>
              <li>/</li>
              <li><Link to="/nieuws" className="hover:text-black dark:hover:text-white">Nieuws</Link></li>
              <li>/</li>
              <li className="text-black dark:text-white">Artikel</li>
            </ol>
          </nav>

          <header className="pb-8 md:pb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-black dark:bg-[var(--action)] text-white dark:text-black text-sm md:text-base font-black uppercase tracking-[0.22em] mb-6">
              <Newspaper className="w-4 h-4" />
              FAINL nieuws
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-black dark:text-white leading-[1.04] mb-6">
              {newsPost.title}
            </h1>
            <p className="text-xl md:text-2xl text-black/75 dark:text-white/75 leading-relaxed max-w-3xl">
              {newsPost.excerpt}
            </p>
          </header>

          {newsPost.hero_image_url && (
            <img
              src={newsPost.hero_image_url}
              alt={newsPost.hero_image_alt || newsPost.title}
              width={1536}
              height={1024}
              className="w-full aspect-[3/2] object-cover border-4 border-black dark:border-[var(--line)] mb-10"
            />
          )}

          <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-black prose-headings:uppercase prose-a:text-[var(--ink)] prose-img:border-4 prose-img:border-black">
            <ReactMarkdown>{newsPost.body_markdown}</ReactMarkdown>
          </div>

          {newsPost.source_links.length > 0 && (
            <section className="mt-12 pt-8 border-t-4 border-black dark:border-[var(--line)]">
              <h2 className="text-xl font-black uppercase tracking-widest text-black dark:text-white mb-4">
                Bronnen
              </h2>
              <div className="flex flex-wrap gap-3">
                {newsPost.source_links.map((source) => (
                  <a
                    key={source.url}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 border-2 border-black dark:border-white/20 text-sm font-black uppercase tracking-widest text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
                  >
                    {source.label}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ))}
              </div>
            </section>
          )}
        </article>
      </>
    );
  }

  if (!page) {
    return (
      <section className="max-w-4xl mx-auto px-5 sm:px-8 py-20">
        <SEO
          title="Pagina niet gevonden"
          description="Deze FAINL contentpagina bestaat niet of is verplaatst."
          canonical={`/${section}/${slug || ""}`}
        />
        <div className="border-4 border-black dark:border-[var(--line)] bg-white dark:bg-black p-8">
          <p className="font-black uppercase tracking-widest text-black/50 dark:text-white/50 mb-3">
            Niet gevonden
          </p>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-black dark:text-white mb-6">
            Deze pagina bestaat niet.
          </h1>
          <button
            type="button"
            onClick={() => navigate("/nieuws")}
            className="inline-flex items-center gap-3 px-6 py-3 bg-black dark:bg-[var(--action)] text-white dark:text-black font-black uppercase tracking-widest"
          >
            Naar nieuws
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    );
  }

  const canonical = getContentPath(page);
  const relatedPages = page.related
    .map((relatedSlug) => findSeoContentPageBySlug(relatedSlug))
    .filter(Boolean);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: page.title,
        description: page.description,
        url: `${SITE_URL}${canonical}`,
        datePublished: page.updated,
        dateModified: page.updated,
        author: { "@type": "Organization", name: "FAINL", url: SITE_URL },
        publisher: {
          "@type": "Organization",
          name: "FAINL",
          logo: { "@type": "ImageObject", url: `${SITE_URL}/favicon.png` },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: page.section, item: `${SITE_URL}/${page.section}` },
          { "@type": "ListItem", position: 3, name: page.title, item: `${SITE_URL}${canonical}` },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: page.faq.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: { "@type": "Answer", text: faq.a },
        })),
      },
    ],
  };

  return (
    <>
      <SEO
        title={page.metaTitle}
        description={page.description}
        canonical={canonical}
        keywords={page.keywords}
        ogTitle={page.title}
        ogDescription={page.description}
        ogType="article"
        jsonLd={jsonLd}
      />

      <nav aria-label="Breadcrumb" className="max-w-5xl mx-auto px-5 sm:px-8 pt-6">
        <ol className="flex flex-wrap items-center gap-2 text-sm md:text-base font-black uppercase tracking-widest text-black/50 dark:text-white/50">
          <li><Link to="/" className="hover:text-black dark:hover:text-white">Home</Link></li>
          <li>/</li>
          <li><Link to="/nieuws" className="hover:text-black dark:hover:text-white">AI kennisbank</Link></li>
          <li>/</li>
          <li className="text-black dark:text-white">{page.kicker}</li>
        </ol>
      </nav>

      <article className="max-w-5xl mx-auto px-5 sm:px-8 pt-10 pb-20">
        <header className="pb-12 md:pb-16 border-b-4 border-black dark:border-[var(--line)]">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-black dark:bg-[var(--action)] text-white dark:text-black text-sm md:text-base font-black uppercase tracking-[0.22em] mb-6">
            <Newspaper className="w-4 h-4" />
            {page.kicker}
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-black dark:text-white leading-[1.04] mb-6">
            {page.title}
          </h1>
          <p className="text-xl md:text-2xl text-black/75 dark:text-white/75 leading-relaxed max-w-3xl mb-6">
            {page.description}
          </p>
          <div className="flex flex-wrap gap-3 text-sm md:text-base font-black uppercase tracking-widest text-black/45 dark:text-white/45">
            <span>Bijgewerkt {page.updated}</span>
            <span>/</span>
            <span>{page.readingTime}</span>
            <span>/</span>
            <span>{page.section}</span>
          </div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-[1fr_18rem] gap-10 py-12 md:py-16">
          <div>
            <p className="text-lg md:text-xl font-bold text-black dark:text-white/80 leading-relaxed mb-8">
              {page.intent}
            </p>
            <div className="space-y-10">
              {page.sections.map((sectionBlock) => (
                <section key={sectionBlock.heading}>
                  <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-black dark:text-white mb-4">
                    {sectionBlock.heading}
                  </h2>
                  <p className="text-lg md:text-xl text-black/70 dark:text-white/70 leading-relaxed">
                    {sectionBlock.body}
                  </p>
                  {sectionBlock.bullets && (
                    <ul className="mt-5 space-y-3">
                      {sectionBlock.bullets.map((bullet) => (
                        <li key={bullet} className="flex gap-3 text-lg text-black/75 dark:text-white/75">
                          <CheckCircle2 className="w-5 h-5 shrink-0 mt-1 text-[var(--ink)]" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>
          </div>

          <aside className="lg:sticky lg:top-8 self-start border-4 border-black dark:border-[var(--line)] bg-white dark:bg-black p-5">
            <h2 className="text-base font-black uppercase tracking-widest text-black dark:text-white mb-4">
              Kernpunten
            </h2>
            <ul className="space-y-3">
              {page.takeaways.map((takeaway) => (
                <li key={takeaway} className="flex gap-3 text-sm md:text-base text-black/70 dark:text-white/70 leading-snug">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[var(--ink)]" />
                  <span>{takeaway}</span>
                </li>
              ))}
            </ul>
          </aside>
        </section>

        {page.comparison && (
          <section className="pb-14">
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-black dark:text-white mb-5">
              Snelle vergelijking
            </h2>
            <div className="overflow-x-auto border-4 border-black dark:border-[var(--line)] bg-white dark:bg-black">
              <table className="w-full min-w-[680px] text-left">
                <thead className="bg-black dark:bg-[var(--action)] text-white dark:text-black">
                  <tr>
                    <th className="px-5 py-4 font-black uppercase tracking-widest">Criterium</th>
                    <th className="px-5 py-4 font-black uppercase tracking-widest">Optie 1</th>
                    <th className="px-5 py-4 font-black uppercase tracking-widest">Optie 2</th>
                    <th className="px-5 py-4 font-black uppercase tracking-widest">Optie 3</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10 dark:divide-white/10">
                  {page.comparison.map((row) => (
                    <tr key={row.label}>
                      <td className="px-5 py-4 font-black text-black dark:text-white">{row.label}</td>
                      <td className="px-5 py-4 text-black/70 dark:text-white/70">{row.left}</td>
                      <td className="px-5 py-4 text-black/70 dark:text-white/70">{row.middle}</td>
                      <td className="px-5 py-4 text-black/70 dark:text-white/70">{row.right}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {page.steps && (
          <section className="pb-14">
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-black dark:text-white mb-5">
              Stappen
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {page.steps.map((step, index) => (
                <div key={step.title} className="border-2 border-black dark:border-white/20 bg-white dark:bg-black p-5">
                  <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--ink)] mb-2">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="text-xl font-black uppercase tracking-tight text-black dark:text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-black/70 dark:text-white/70 leading-relaxed">{step.body}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="pb-14">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-black dark:text-white mb-5">
            Veelgestelde vragen
          </h2>
          <div className="border-2 border-black dark:border-white/20 bg-white dark:bg-black divide-y divide-black/10 dark:divide-white/10">
            {page.faq.map((faq) => (
              <div key={faq.q} className="p-5">
                <h3 className="font-black text-lg uppercase tracking-tight text-black dark:text-white mb-2">
                  {faq.q}
                </h3>
                <p className="text-black/70 dark:text-white/70 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {page.sourceLinks && (
          <section className="pb-14">
            <h2 className="text-xl font-black uppercase tracking-widest text-black dark:text-white mb-4">
              Bronnen
            </h2>
            <div className="flex flex-wrap gap-3">
              {page.sourceLinks.map((source) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 border-2 border-black dark:border-white/20 text-sm font-black uppercase tracking-widest text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
                >
                  {source.label}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </section>
        )}

        <section className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-start bg-black dark:bg-white p-6 md:p-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white dark:text-black mb-3">
              Test dezelfde vraag in FAINL
            </h2>
            <p className="text-white/70 dark:text-black/70 text-lg leading-relaxed max-w-2xl">
              Laat meerdere modellen onafhankelijk antwoorden, elkaars aannames toetsen en een gewogen eindoordeel maken.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/mission")}
            className="inline-flex items-center justify-center gap-3 px-6 py-4 bg-[var(--action)] text-black font-black uppercase tracking-widest"
          >
            Start gratis
            <ArrowRight className="w-4 h-4" />
          </button>
        </section>

        {relatedPages.length > 0 && (
          <section className="pt-14">
            <h2 className="text-xl font-black uppercase tracking-widest text-black dark:text-white mb-5">
              Verder lezen
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedPages.map((related) => related && (
                <Link
                  key={related.slug}
                  to={getContentPath(related)}
                  className="border-2 border-black dark:border-white/20 bg-white dark:bg-black p-5 hover:shadow-[4px_4px_0_0_black] dark:hover:shadow-[4px_4px_0_0_rgba(255,255,255,0.25)] transition-shadow"
                >
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--ink)] mb-2">
                    {related.kicker}
                  </p>
                  <h3 className="font-black uppercase tracking-tight text-black dark:text-white leading-snug">
                    {related.title}
                  </h3>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
};
