import { FC, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Newspaper, Sparkles } from "lucide-react";
import { SEO } from "./SEO";
import { getContentPath, getPagesBySection, SEO_CONTENT_PAGES } from "../data/seoContent";
import { getPublishedNewsPosts, NewsPost } from "../services/newsService";

const SITE_URL = "https://fainl.com";

export const NewsPage: FC = () => {
  const navigate = useNavigate();
  const staticNews = getPagesBySection("nieuws");
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loaded, setLoaded] = useState(false);
  const featuredPost = posts[0];
  const featuredStatic = staticNews[0];
  const clusters = [
    { title: "Vergelijkingen", section: "vergelijken" as const },
    { title: "Modelgidsen", section: "modellen" as const },
    { title: "Tutorials", section: "tutorials" as const },
    { title: "Infographics", section: "infographics" as const },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "FAINL AI nieuws en kennisbank",
    description: "Nieuws, vergelijkingen, tutorials en modelgidsen over AI-tools en multi-model consensus.",
    url: `${SITE_URL}/nieuws`,
    publisher: { "@type": "Organization", name: "FAINL", url: SITE_URL },
  };

  useEffect(() => {
    let active = true;
    getPublishedNewsPosts()
      .then((items) => {
        if (!active) return;
        setPosts(items);
        setLoaded(true);
      })
      .catch(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <SEO
        title="AI nieuws, modelupdates en kennisbank"
        description="Volg AI modelupdates, vergelijk ChatGPT, Claude, Gemini en andere tools, en leer hoe je FAINL inzet voor betere beslissingen."
        canonical="/nieuws"
        keywords="AI nieuws, AI model updates, ChatGPT nieuws, Claude nieuws, Gemini nieuws, AI vergelijken, FAINL kennisbank"
        ogTitle="FAINL AI nieuws en kennisbank"
        ogDescription="Actuele AI-modelupdates, vergelijkingen, tutorials en infographics voor zakelijke AI-gebruikers."
        jsonLd={jsonLd}
      />

      <main className="max-w-6xl mx-auto px-5 sm:px-8 py-10 md:py-16">
        <section className="pb-10 md:pb-14 border-b-4 border-black dark:border-[var(--line)]">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-black dark:bg-[var(--action)] text-white dark:text-black text-sm md:text-base font-black uppercase tracking-[0.22em] mb-6">
            <Newspaper className="w-4 h-4" />
            AI nieuws
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_22rem] gap-8 items-end">
            <div>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black uppercase tracking-tight text-black dark:text-white leading-[1.02] mb-6">
                AI nieuws, modelupdates en praktische gidsen.
              </h1>
              <p className="text-xl md:text-2xl text-black/75 dark:text-white/75 leading-relaxed max-w-3xl">
                Een groeiende kennisbank voor iedereen die niet alleen AI-nieuws wil lezen, maar wil weten welk model, welke workflow en welke controlelaag past bij echte beslissingen.
              </p>
            </div>
            <div className="border-4 border-black dark:border-[var(--line)] bg-white dark:bg-black p-6">
              <Sparkles className="w-8 h-8 text-[var(--ink)] mb-4" />
              <p className="font-black uppercase tracking-widest text-black dark:text-white mb-2">Nieuwste update</p>
              <p className="text-black/70 dark:text-white/70 leading-relaxed mb-5">
                {featuredPost?.title || featuredStatic?.title}
              </p>
              {featuredPost ? (
                <Link
                  to={`/nieuws/${featuredPost.slug}`}
                  className="inline-flex items-center gap-2 font-black uppercase tracking-widest text-black dark:text-white hover:text-[var(--ink)]"
                >
                  Lees update
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : featuredStatic && (
                <Link
                  to={getContentPath(featuredStatic)}
                  className="inline-flex items-center gap-2 font-black uppercase tracking-widest text-black dark:text-white hover:text-[var(--ink)]"
                >
                  Lees update
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </section>

        <section className="py-10 md:py-14">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-black dark:text-white mb-6">
            Laatste nieuws
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`/nieuws/${post.slug}`}
                className="border-4 border-black dark:border-[var(--line)] bg-white dark:bg-black overflow-hidden hover:shadow-[6px_6px_0_0_black] dark:hover:shadow-[6px_6px_0_0_rgba(255,255,255,0.22)] transition-shadow"
              >
                {post.hero_image_url && (
                  <img
                    src={post.hero_image_url}
                    alt={post.hero_image_alt || post.title}
                    width={1536}
                    height={1024}
                    loading="lazy"
                    className="w-full aspect-[3/2] object-cover border-b-4 border-black dark:border-[var(--line)]"
                  />
                )}
                <div className="p-6">
                  <p className="text-sm font-black uppercase tracking-[0.22em] text-[var(--ink)] mb-3">
                    Nieuws / {post.published_at?.slice(0, 10) || post.created_at.slice(0, 10)}
                  </p>
                  <h3 className="text-2xl font-black uppercase tracking-tight text-black dark:text-white mb-3 leading-tight">
                    {post.title}
                  </h3>
                  <p className="text-black/70 dark:text-white/70 leading-relaxed">{post.excerpt}</p>
                </div>
              </Link>
            ))}
            {loaded && posts.length === 0 && staticNews.map((page) => (
              <Link
                key={page.slug}
                to={getContentPath(page)}
                className="border-4 border-black dark:border-[var(--line)] bg-white dark:bg-black p-6 hover:shadow-[6px_6px_0_0_black] dark:hover:shadow-[6px_6px_0_0_rgba(255,255,255,0.22)] transition-shadow"
              >
                <p className="text-sm font-black uppercase tracking-[0.22em] text-[var(--ink)] mb-3">
                  {page.kicker} / {page.updated}
                </p>
                <h3 className="text-2xl font-black uppercase tracking-tight text-black dark:text-white mb-3 leading-tight">
                  {page.title}
                </h3>
                <p className="text-black/70 dark:text-white/70 leading-relaxed">{page.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-14">
          {clusters.map((cluster) => {
            const pages = getPagesBySection(cluster.section);
            return (
              <div key={cluster.section} className="border-2 border-black dark:border-white/20 bg-white dark:bg-black p-6">
                <h2 className="text-xl font-black uppercase tracking-widest text-black dark:text-white mb-5">
                  {cluster.title}
                </h2>
                <div className="space-y-4">
                  {pages.map((page) => (
                    <Link key={page.slug} to={getContentPath(page)} className="block group">
                      <p className="font-black uppercase tracking-tight text-black dark:text-white group-hover:text-[var(--ink)]">
                        {page.title}
                      </p>
                      <p className="text-sm text-black/55 dark:text-white/55 mt-1">
                        {page.readingTime} / bijgewerkt {page.updated}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        <section className="bg-black dark:bg-white p-6 md:p-10 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white dark:text-black mb-3">
              Van lezen naar beslissen
            </h2>
            <p className="text-white/70 dark:text-black/70 text-lg leading-relaxed max-w-2xl">
              Kies een onderwerp, formuleer je eigen vraag en laat meerdere AI-modellen het antwoord controleren voordat je handelt.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/mission")}
            className="inline-flex items-center justify-center gap-3 px-6 py-4 bg-[var(--action)] text-black font-black uppercase tracking-widest"
          >
            Start FAINL
            <ArrowRight className="w-4 h-4" />
          </button>
        </section>

        <p className="mt-8 text-sm text-black/40 dark:text-white/40">
          {posts.length + SEO_CONTENT_PAGES.length} kennisbankpagina's beschikbaar.
        </p>
      </main>
    </>
  );
};
