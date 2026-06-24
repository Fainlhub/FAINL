import { FC, useEffect, useState } from 'react';
import { Loader2, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getPostAuthDestination } from '../services/authRedirect';
import { supabase } from '../services/supabaseClient';

const waitForSession = async () => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) throw error;
    if (session) return session;

    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  return null;
};

export const AuthCallbackPage: FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const finishSignIn = async () => {
      const providerError =
        searchParams.get('error_description') ||
        searchParams.get('error');

      if (providerError) {
        throw new Error(providerError);
      }

      const destination = getPostAuthDestination(searchParams);
      const session = await waitForSession();

      if (!session) {
        throw new Error('No auth session was returned by Supabase.');
      }

      if (isActive) {
        navigate(destination, { replace: true });
      }
    };

    finishSignIn().catch((err: unknown) => {
      if (!isActive) return;
      const message = err instanceof Error ? err.message : 'Authentication failed.';
      setError(message);
    });

    return () => {
      isActive = false;
    };
  }, [navigate, searchParams]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md border-4 border-black dark:border-[#03B390] bg-white dark:bg-black p-8 text-center shadow-[12px_12px_0_0_var(--color-accent)]">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center bg-black text-white dark:bg-[#03B390] dark:text-black">
          {error ? <TriangleAlert className="h-8 w-8" /> : <ShieldCheck className="h-8 w-8" />}
        </div>
        <h1 className="mb-4 text-3xl font-black uppercase tracking-tight text-black dark:text-white">
          {error ? 'Login failed' : 'Securing session'}
        </h1>
        <p className="mx-auto mb-6 max-w-xs text-base font-black uppercase leading-relaxed tracking-widest text-black/50 dark:text-white/50">
          {error || 'Finishing Google authentication.'}
        </p>
        {error ? (
          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
            className="bg-black px-6 py-4 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-[#03B390] hover:text-black dark:bg-[#03B390] dark:text-black dark:hover:bg-white"
          >
            Back to login
          </button>
        ) : (
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-black dark:text-[#03B390]" />
        )}
      </div>
    </div>
  );
};
