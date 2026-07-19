import { FC, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { MessageList } from './MessageList';
import { ChatComposer } from './ChatComposer';
import { PaywallModal } from '../PaywallModal';
import { SEO } from '../SEO';
import { startCheckout } from '../../services/payments';

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

const HOME_STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://www.fainl.com/#organization',
      name: 'FAINL',
      url: 'https://www.fainl.com/',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.fainl.com/fainl-logo.png',
      },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://www.fainl.com/#website',
      url: 'https://www.fainl.com/',
      name: 'FAINL AI Consensus Engine',
      publisher: { '@id': 'https://www.fainl.com/#organization' },
      inLanguage: 'nl-NL',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://www.fainl.com/#app',
      name: 'FAINL',
      url: 'https://www.fainl.com/',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
      },
    },
  ],
};

export const ChatView: FC = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();
  const { authSession } = useAuth();
  const {
    messages,
    isStreaming,
    pendingNodes,
    chatError,
    models,
    selectedModelIds,
    setSelectedModelIds,
    byokEnabled,
    sendMessage,
    openThread,
    activeThreadId,
    paywallOpen,
    setPaywallOpen,
  } = useChat();

  const chips = useMemo(() => pickRandom(EXAMPLE_QUESTIONS, 3), []);

  useEffect(() => {
    if (threadId && threadId !== activeThreadId) openThread(threadId);
  }, [threadId, activeThreadId, openThread]);

  const handlePurchase = async (count: number) => {
    if (!authSession?.user?.id) {
      navigate('/login?next=/tokens');
      return;
    }
    try {
      await startCheckout({ type: 'credits', count });
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Checkout starten mislukt.');
    }
  };

  const isEmpty = messages.length === 0 && !chatError;

  return (
    <>
      <SEO
        title="FAINL Chat - Kies je AI-model"
        description="Chat met FAINL zoals je gewend bent: kies een of meerdere AI-modellen en bewaar je gesprekken na login."
        canonical="/"
        keywords="AI chat, multi-model AI, AI consensus, FAINL"
        jsonLd={HOME_STRUCTURED_DATA}
      />

      {isEmpty ? (
        <div className="chathome">
          <ChatComposer
            onSend={sendMessage}
            disabled={isStreaming}
            models={models}
            selectedModelIds={selectedModelIds}
            onModelSelectionChange={setSelectedModelIds}
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
              Twee sessies gratis. <a href="/login?next=/">Log in</a> om conclusies te bewaren en de volledige Raad samen te stellen.
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
              models={models}
              selectedModelIds={selectedModelIds}
              onModelSelectionChange={setSelectedModelIds}
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
