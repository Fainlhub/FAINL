import { FC, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { MessageList } from './MessageList';
import { ChatComposer } from './ChatComposer';
import { PaywallModal } from '../PaywallModal';
import { SEO } from '../SEO';
import { PRICING } from '../../constants';

const EXAMPLE_QUESTIONS = [
  'Moet ik van baan wisselen?',
  'Is kernenergie de oplossing voor de energiecrisis?',
  'Welke programmeertaal leer ik het best in 2026?',
  'Is thuiswerken beter voor productiviteit?',
  "Wat zijn de risico's van AI-regulering in Europa?",
  'Moet ik een eigen bedrijf starten of in loondienst blijven?',
  'Is een vegan dieet gezonder?',
  'Hoe bescherm ik mijn startup tegen kopieergedrag?',
];

const pickRandom = (arr: string[], n: number): string[] =>
  [...arr].sort(() => Math.random() - 0.5).slice(0, n);

export const ChatView: FC = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const { authSession } = useAuth();
  const {
    messages,
    isStreaming,
    pendingNodes,
    chatError,
    tier,
    setTier,
    byokEnabled,
    sendMessage,
    openThread,
    activeThreadId,
    paywallOpen,
    setPaywallOpen,
  } = useChat();

  const chips = useMemo(() => pickRandom(EXAMPLE_QUESTIONS, 3), []);

  // Deep link: /chat/:threadId
  useEffect(() => {
    if (threadId && threadId !== activeThreadId) openThread(threadId);
  }, [threadId, activeThreadId, openThread]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    const base = hour < 12 ? 'Goedemorgen' : hour < 18 ? 'Goedemiddag' : 'Goedenavond';
    const name =
      authSession?.user?.user_metadata?.name?.split(' ')[0] ||
      authSession?.user?.user_metadata?.full_name?.split(' ')[0];
    return name ? `${base}, ${name}.` : `${base}.`;
  };

  const handlePurchase = (count: number) => {
    const pkg = PRICING.CREDITS.find(p => p.count === count);
    if (!pkg?.stripeUrl) return;
    try {
      const destination = new URL(pkg.stripeUrl);
      if (!destination.hostname.endsWith('stripe.com')) throw new Error('invalid host');
    } catch {
      return;
    }
    window.location.href = pkg.stripeUrl;
  };

  const isEmpty = messages.length === 0 && !chatError;

  return (
    <>
      <SEO
        title="FAINL — Meerdere AI's. Eén antwoord."
        description="Chat met meerdere AI-modellen tegelijk. Kies je thinking-niveau: van instant antwoord tot 7 nodes die samenwerken aan één antwoord."
        canonical="/"
        keywords="AI chat, multi-model AI, AI consensus, FAINL"
      />

      {isEmpty ? (
        <div className="chathome">
          <h1 className="chathome-greeting">{getGreeting()}</h1>
          <ChatComposer
            onSend={sendMessage}
            disabled={isStreaming}
            tier={tier}
            onTierChange={setTier}
            isLoggedIn={!!authSession}
            byokEnabled={byokEnabled}
            autoFocus
          />
          <div className="chathome-chips">
            {chips.map(q => (
              <button key={q} type="button" onClick={() => sendMessage(q)} className="chathome-chip">
                {q}
              </button>
            ))}
          </div>
          {!authSession && (
            <p className="chat-anon-hint">
              Gratis chatten op Instant-niveau. <a href="/login?next=/">Log in</a> om gesprekken te bewaren en hogere thinking-niveaus te gebruiken.
            </p>
          )}
        </div>
      ) : (
        <div className="chatview">
          <MessageList
            messages={messages}
            isStreaming={isStreaming}
            pendingNodes={pendingNodes}
            chatError={chatError}
          />
          <div className="chatview-composer-wrap">
            <ChatComposer
              onSend={sendMessage}
              disabled={isStreaming}
              tier={tier}
              onTierChange={setTier}
              isLoggedIn={!!authSession}
              byokEnabled={byokEnabled}
            />
          </div>
        </div>
      )}

      <PaywallModal
        isOpen={paywallOpen}
        hasOwnKeys={byokEnabled}
        authSession={authSession}
        onPurchaseTurns={handlePurchase}
        onClose={() => setPaywallOpen(false)}
      />
    </>
  );
};
