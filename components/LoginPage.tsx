import { useState, FC, FormEvent } from 'react';
import { Shield, Github, Mail, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { getAuthRedirectUrl, normalizePostAuthPath } from '../services/authRedirect';
import { supabase } from '../services/supabaseClient';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: getAuthRedirectUrl(normalizePostAuthPath(searchParams.get('next')))
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: getAuthRedirectUrl(normalizePostAuthPath(searchParams.get('next'))),
        },
      });
      if (error) throw error;
      setMessage({ type: 'success', text: 'Neural Link sent! Check your email to continue.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border-4 border-black dark:border-white/20 p-8 md:p-12 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] dark:shadow-[16px_16px_0px_1px_rgba(255,255,255,0.1)]">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 bg-black dark:bg-white rounded flex items-center justify-center mb-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] dark:shadow-[8px_8px_0px_1px_rgba(255,255,255,0.05)]">
            <Shield className="text-white dark:text-black w-8 h-8" />
          </div>
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-2 text-black dark:text-white">Neural Vault</h2>
          <p className="text-black dark:text-white/60 font-bold uppercase text-lg md:text-xl tracking-widest text-balance leading-relaxed">Identity verification required to access secure session history</p>
        </div>

        {message && (
          <div className={`mb-8 p-4 border-2 border-black dark:border-[#03B390] font-black text-lg md:text-xl uppercase tracking-wider ${message.type === 'success' ? 'bg-[#03B390] text-black' : 'bg-red-500 text-white'}`}>
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={() => handleSocialLogin('google')}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-4 p-5 border-4 border-black dark:border-[#03B390] bg-white dark:bg-black font-black uppercase tracking-widest text-lg md:text-xl hover:bg-[#03B390] hover:text-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_#03B390] hover:-translate-y-1 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 text-black dark:text-white"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5 grayscale" alt="Google" />
            Connect with Google
          </button>
 
          <button
            onClick={() => handleSocialLogin('github')}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-4 p-5 border-4 border-black dark:border-[#03B390] bg-white dark:bg-black font-black uppercase tracking-widest text-lg md:text-xl hover:bg-[#03B390] hover:text-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_#03B390] hover:-translate-y-1 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 text-black dark:text-white"
          >
            <Github className="w-5 h-5" />
            Connect with GitHub
          </button>
        </div>

        <div className="my-10 flex items-center gap-4">
          <div className="h-px flex-1 bg-black/10 dark:bg-white/10"></div>
          <span className="text-base font-black text-black/20 dark:text-white/20 uppercase tracking-[0.3em]">OR</span>
          <div className="h-px flex-1 bg-black/10 dark:bg-white/10"></div>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="NEURAL-ID@EMAIL.COM"
              className="w-full p-5 bg-zinc-50 dark:bg-black border-4 border-black dark:border-[#03B390] font-black uppercase tracking-widest text-lg md:text-xl placeholder:text-black/20 dark:placeholder:text-white/20 focus:outline-none focus:bg-white dark:focus:bg-zinc-900 transition-all text-black dark:text-white"
              required
            />
            <Mail className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-black/20 dark:text-white/20" />
          </div>
          
          <button
            type="submit"
            disabled={isLoading || !email}
            className="w-full bg-black dark:bg-[#03B390] text-white dark:text-black p-5 font-black uppercase tracking-widest text-lg md:text-xl flex items-center justify-center gap-3 hover:bg-[#03B390] hover:text-black dark:hover:bg-white transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Initialize Link
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-base font-black text-black/20 dark:text-white/20 uppercase tracking-[0.2em] leading-loose max-w-xs mx-auto">
          Auth data is managed by Supabase. Your private missions remain encrypted on the server side.
        </p>
      </div>
    </div>
  );
};
