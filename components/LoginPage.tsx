import { useState, FC, FormEvent } from 'react';
import { Shield, Github, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import {
  getAuthRedirectUrl,
  getPostAuthDestinationLabel,
  normalizePostAuthPath,
} from '../services/authRedirect';
import { supabase } from '../services/supabaseClient';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [searchParams] = useSearchParams();
  const postAuthPath = normalizePostAuthPath(searchParams.get('next'));
  const postAuthLabel = getPostAuthDestinationLabel(postAuthPath);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: getAuthRedirectUrl(postAuthPath)
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
          emailRedirectTo: getAuthRedirectUrl(postAuthPath),
        },
      });
      if (error) throw error;
      setMessage({ type: 'success', text: 'Inloglink verstuurd! Check je e-mail om verder te gaan.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-gate-overlay">
      <div className="login-gate-backdrop" />
      <div className="login-gate-card">

        {/* Header */}
        <div className="login-gate-header">
          <div className="login-gate-logo">
            <Shield className="login-gate-logo-icon" />
          </div>
          <h2 className="login-gate-title">Inloggen</h2>
          <p className="login-gate-sub">
            Log in bij FAINL om je sessies, credits en account veilig te beheren.
          </p>
        </div>

        <div className="login-gate-destination" aria-live="polite">
          <span className="login-gate-destination-label">Na inloggen ga je naar</span>
          <span className="login-gate-destination-value">{postAuthLabel}</span>
        </div>

        {/* Feedback message */}
        {message && (
          <div className={`login-gate-message login-gate-message--${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Social login buttons */}
        <div className="login-gate-social-group">
          <button
            onClick={() => handleSocialLogin('google')}
            disabled={isLoading}
            className="login-gate-social-btn"
          >
            <img
              src="https://www.google.com/favicon.ico"
              className="login-gate-social-icon"
              alt="Google"
            />
            Inloggen bij FAINL met Google
          </button>

          <button
            onClick={() => handleSocialLogin('github')}
            disabled={isLoading}
            className="login-gate-social-btn"
          >
            <Github className="login-gate-social-icon" />
            Inloggen bij FAINL met GitHub
          </button>
        </div>

        {/* Divider */}
        <div className="login-gate-divider">
          <div className="login-gate-divider-line" />
          <span className="login-gate-divider-text">of via e-mail</span>
          <div className="login-gate-divider-line" />
        </div>

        {/* Email login form */}
        <form onSubmit={handleEmailLogin} className="login-gate-form">
          <div className="login-gate-input-wrap">
            <Mail className="login-gate-input-icon" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jouw@email.nl"
              className="login-gate-input"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !email}
            className="login-gate-submit"
          >
            {isLoading ? (
              <Loader2 className="login-gate-spinner" />
            ) : (
              <>
                Stuur inloglink
                <ArrowRight className="login-gate-arrow" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="login-gate-footer">
          FAINL gebruikt beveiligde login. We slaan je Google- of GitHub-wachtwoord nooit op.
        </p>
      </div>
    </div>
  );
};
