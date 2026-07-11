import { FC, useState } from 'react';
import { Mail, Send, Loader2, CheckCircle2, MessageSquare, Zap } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { SEO } from './SEO';

export const ContactPage: FC = () => {
    const [name, setName] = useState('');
    const [payload, setPayload] = useState('');
    const [status, setStatus] = useState<'idle' | 'transmitting' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!name || !payload || status !== 'idle') return;

        setStatus('transmitting');
        setErrorMessage('');

        try {
            const { error } = await supabase.from('contact_submissions').insert({ name, message: payload });

            if (error) throw error;

            setStatus('success');
            setTimeout(() => {
                setName('');
                setPayload('');
                setStatus('idle');
            }, 3000);
        } catch (err: any) {
            console.error('Transmission failed:', err);
            setErrorMessage(err.message || 'Verzending mislukt. Probeer het opnieuw.');
            setStatus('error');
            setTimeout(() => setStatus('idle'), 5000);
        }
    };

    return (
        <>
        <SEO
          title="Contact — FAINL AI Consensus"
          description="Neem contact op met het FAINL-team. Vragen, feedback of samenwerking? Wij reageren binnen 12 uur."
          canonical="/contact"
          keywords="FAINL contact, support AI tool, contact multi-model AI"
        />
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-16 md:py-28 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Header */}
            <div className="mb-20 md:mb-32">
                <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter text-black dark:text-white leading-none mb-8">
                    Vragen staat <span className="text-[var(--ink)]">vrij!</span>
                </h1>
                <p className="text-xl md:text-3xl text-black dark:text-white/80 max-w-2xl leading-relaxed font-bold">
                    Vragen over FAINL, feedback of interesse in samenwerking? Stuur een bericht — we reageren binnen 12 uur.
                </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-12 md:gap-16 items-start">

                {/* Left — info */}
                <div className="lg:w-2/5 space-y-12">
                    <div className="space-y-8">
                        <div className="flex items-start gap-6">
                            <div className="w-14 h-14 rounded-none bg-black dark:bg-[var(--action)] flex items-center justify-center flex-shrink-0">
                                <Mail className="w-7 h-7 text-white dark:text-black" />
                            </div>
                            <div>
                                <p className="text-base font-black uppercase tracking-widest text-[var(--ink)] dark:text-[var(--ink)] mb-1">E-mail</p>
                                <a
                                    href="mailto:info@fainl.com"
                                    className="text-xl md:text-2xl font-black text-black dark:text-white hover:text-[var(--ink)] transition-colors"
                                >
                                    info@fainl.com
                                </a>
                            </div>
                        </div>

                        <div className="flex items-start gap-6">
                            <div className="w-14 h-14 rounded-none bg-black dark:bg-[var(--action)] flex items-center justify-center flex-shrink-0">
                                <Zap className="w-7 h-7 text-white dark:text-black" />
                            </div>
                            <div>
                                <p className="text-base font-black uppercase tracking-widest text-[var(--ink)] dark:text-[var(--ink)] mb-1">Reactietijd</p>
                                <p className="text-xl md:text-2xl font-black text-black dark:text-white">Binnen 12 uur</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-6">
                            <div className="w-14 h-14 rounded-none bg-black dark:bg-[var(--action)] flex items-center justify-center flex-shrink-0">
                                <MessageSquare className="w-7 h-7 text-white dark:text-black" />
                            </div>
                            <div>
                                <p className="text-base font-black uppercase tracking-widest text-[var(--ink)] dark:text-[var(--ink)] mb-1">Onderwerpen</p>
                                <p className="text-xl md:text-2xl font-black text-black dark:text-white">Support · Feedback · Partnerships</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right — form */}
                <div className="lg:w-3/5 w-full">
                    <div className="bg-white dark:bg-black border-4 border-black dark:border-[var(--line)] p-10 md:p-16 rounded-none shadow-lg dark:shadow-lg">
                        <form className="space-y-10" onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <label className="block text-base font-black text-[var(--ink)] dark:text-[var(--ink)] uppercase tracking-[0.2em]">
                                    Naam
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Jouw naam"
                                    disabled={status !== 'idle'}
                                    className="w-full bg-white dark:bg-black border-4 border-black dark:border-white/20 p-6 rounded-none font-black text-xl focus:border-[var(--line)] dark:focus:border-[var(--line)] transition-all outline-none text-black dark:text-white placeholder:text-black dark:placeholder:text-white/20 disabled:opacity-50"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="block text-base font-black text-[var(--ink)] dark:text-[var(--ink)] uppercase tracking-[0.2em]">
                                    Bericht
                                </label>
                                <textarea
                                    required
                                    value={payload}
                                    onChange={(e) => setPayload(e.target.value)}
                                    placeholder="Schrijf je bericht..."
                                    disabled={status !== 'idle'}
                                    rows={8}
                                    className="w-full bg-white dark:bg-black border-4 border-black dark:border-white/20 p-6 rounded-none font-black text-xl focus:border-[var(--line)] dark:focus:border-[var(--line)] transition-all outline-none resize-none text-black dark:text-white placeholder:text-black dark:placeholder:text-white/20 disabled:opacity-50"
                                />
                            </div>

                            {errorMessage && (
                                <p className="text-xl font-black text-red-500 uppercase tracking-tight">{errorMessage}</p>
                            )}

                            <button
                                type="submit"
                                disabled={status !== 'idle' || !name || !payload}
                                className={`w-full py-6 rounded-none font-black uppercase tracking-[0.2em] text-xl transition-all flex items-center justify-center gap-4 ${
                                    status === 'success'
                                        ? 'bg-green-500 text-white'
                                        : 'bg-black dark:bg-[var(--action)] text-white dark:text-black hover:bg-[var(--action)] hover:text-black dark:hover:bg-white transition-all shadow-xl'
                                } disabled:opacity-40 disabled:cursor-not-allowed`}
                            >
                                {status === 'idle' && (
                                    <><Send className="w-5 h-5" /> Verstuur bericht</>
                                )}
                                {status === 'transmitting' && (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Transmitting...</>
                                )}
                                {status === 'success' && (
                                    <><CheckCircle2 className="w-5 h-5" /> Verzonden!</>
                                )}
                                {status === 'error' && (
                                    <><Send className="w-5 h-5" /> Opnieuw proberen</>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
};
