import { FC } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from './SEO';

export const NotFoundPage: FC = () => {
  return (
    <>
      <SEO
        title="404 — Pagina niet gevonden"
        description="Deze pagina bestaat niet. Ga terug naar FAINL."
        canonical="/404"
      />
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-4 py-12 text-center">
        <video
          src="/robots_404.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="w-full max-w-md rounded-none border-4 border-black dark:border-[var(--color-accent)] shadow-[8px_8px_0_0_var(--color-accent)] mb-8"
        />
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-black dark:text-white mb-4">
          404
        </h1>
        <p className="text-lg md:text-xl font-bold text-black/60 dark:text-white/50 mb-8 max-w-md">
          Oeps — deze pagina bestaat niet. Onze robots zijn er ook niet uit gekomen.
        </p>
        <Link
          to="/"
          className="px-8 py-4 bg-black dark:bg-[var(--color-accent)] text-white dark:text-black font-black text-sm uppercase tracking-widest hover:bg-[var(--color-accent)] hover:text-black transition-all shadow-[4px_4px_0_0_var(--color-accent)] border-2 border-black"
        >
          Terug naar home
        </Link>
      </div>
    </>
  );
};
