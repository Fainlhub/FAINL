import { FC, useEffect, useState } from "react";
import { RefreshCw, Send, ShieldCheck, Trash2 } from "lucide-react";
import { SEO } from "./SEO";
import {
  generateNewsDraft,
  getNewsQueue,
  ingestNews,
  NewsPost,
  publishNewsPost,
  rejectNewsPost,
} from "../services/newsService";

export const NewsAdminPage: FC = () => {
  const [token, setToken] = useState(() => sessionStorage.getItem("fainl_news_admin_token") || "");
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const saveToken = (value: string) => {
    setToken(value);
    sessionStorage.setItem("fainl_news_admin_token", value);
  };

  const refreshQueue = async () => {
    if (!token) return;
    setBusy(true);
    setStatus("Queue laden...");
    try {
      const data = await getNewsQueue(token);
      setPosts(data.posts);
      setStatus(`${data.posts.length} posts gevonden.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Queue laden mislukt.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (token) refreshQueue();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runIngest = async () => {
    setBusy(true);
    setStatus("RSS feeds ophalen...");
    try {
      const data = await ingestNews(token);
      setStatus(`Ingest klaar: ${data.itemsSeen} gezien, ${data.itemsUpserted} opgeslagen.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Ingest mislukt.");
    } finally {
      setBusy(false);
    }
  };

  const runGenerate = async () => {
    setBusy(true);
    setStatus("Nederlandse draft genereren...");
    try {
      const data = await generateNewsDraft(token, true);
      setStatus(data.skipped ? `Overgeslagen: ${data.reason}` : `${data.postsCreated} draft aangemaakt.`);
      await refreshQueue();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Genereren mislukt.");
    } finally {
      setBusy(false);
    }
  };

  const publish = async (id: string) => {
    setBusy(true);
    setStatus("Publiceren...");
    try {
      await publishNewsPost(token, id);
      await refreshQueue();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Publiceren mislukt.");
    } finally {
      setBusy(false);
    }
  };

  const reject = async (id: string) => {
    setBusy(true);
    setStatus("Afwijzen...");
    try {
      await rejectNewsPost(token, id);
      await refreshQueue();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Afwijzen mislukt.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <SEO
        title="Nieuws review"
        description="Interne FAINL nieuwsreview voor RSS-ingest, AI-drafts en publicatie."
        canonical="/admin/news"
        noIndex
      />

      <main className="max-w-5xl mx-auto px-5 sm:px-8 py-10 md:py-16">
        <section className="border-4 border-black dark:border-[var(--line)] bg-white dark:bg-black p-6 md:p-8 mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-black dark:bg-[var(--action)] text-white dark:text-black text-sm font-black uppercase tracking-[0.22em] mb-5">
            <ShieldCheck className="w-4 h-4" />
            Review
          </div>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-black dark:text-white mb-4">
            AI nieuws automatisering
          </h1>
          <p className="text-lg text-black/70 dark:text-white/70 max-w-3xl leading-relaxed mb-6">
            Haal RSS-signalen op, laat een eigen Nederlandse FAINL-draft maken en publiceer pas na review.
          </p>
          <label className="block text-sm font-black uppercase tracking-widest text-black/50 dark:text-white/50 mb-2">
            Admin token
          </label>
          <input
            type="password"
            value={token}
            onChange={(event) => saveToken(event.target.value)}
            className="w-full border-2 border-black dark:border-white/20 bg-white dark:bg-black text-black dark:text-white px-4 py-3 font-bold outline-none"
            placeholder="NEWS_ADMIN_TOKEN"
          />
        </section>

        <section className="flex flex-wrap gap-3 mb-6">
          <button type="button" disabled={!token || busy} onClick={runIngest} className="inline-flex items-center gap-2 px-5 py-3 bg-black dark:bg-[var(--action)] text-white dark:text-black font-black uppercase tracking-widest disabled:opacity-50">
            <RefreshCw className="w-4 h-4" />
            RSS ophalen
          </button>
          <button type="button" disabled={!token || busy} onClick={runGenerate} className="inline-flex items-center gap-2 px-5 py-3 bg-black dark:bg-[var(--action)] text-white dark:text-black font-black uppercase tracking-widest disabled:opacity-50">
            <Send className="w-4 h-4" />
            Draft maken
          </button>
          <button type="button" disabled={!token || busy} onClick={refreshQueue} className="inline-flex items-center gap-2 px-5 py-3 border-2 border-black dark:border-white/20 text-black dark:text-white font-black uppercase tracking-widest disabled:opacity-50">
            Vernieuwen
          </button>
        </section>

        {status && (
          <p className="mb-6 border-2 border-black/20 dark:border-white/20 px-4 py-3 text-black/70 dark:text-white/70 font-bold">
            {status}
          </p>
        )}

        <section className="space-y-4">
          {posts.map((post) => (
            <article key={post.id} className="border-2 border-black dark:border-white/20 bg-white dark:bg-black p-5">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--ink)] mb-2">
                    {post.status} / {post.published_at || post.created_at}
                  </p>
                  <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-black dark:text-white mb-2">
                    {post.title}
                  </h2>
                  <p className="text-black/70 dark:text-white/70 leading-relaxed">{post.excerpt}</p>
                </div>
                <div className="flex md:flex-col gap-2 shrink-0">
                  <button type="button" disabled={busy || post.status === "published"} onClick={() => publish(post.id)} className="px-4 py-2 bg-[var(--action)] text-black font-black uppercase tracking-widest disabled:opacity-40">
                    Publiceer
                  </button>
                  <button type="button" disabled={busy || post.status === "rejected"} onClick={() => reject(post.id)} className="inline-flex items-center justify-center gap-2 px-4 py-2 border-2 border-black dark:border-white/20 text-black dark:text-white font-black uppercase tracking-widest disabled:opacity-40">
                    <Trash2 className="w-4 h-4" />
                    Afwijs
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>
    </>
  );
};
