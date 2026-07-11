import { FC, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Scale } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ChatMessage } from '../../types';
import { NodeStatus } from '../../contexts/ChatContext';
import { ThinkingBlock } from './ThinkingBlock';

interface MessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  pendingNodes: NodeStatus[] | null;
  chatError: string | null;
}

const UserMessage: FC<{ msg: ChatMessage }> = ({ msg }) => (
  <div className="chat-msg chat-msg--user">
    <div className="chat-bubble chat-bubble--user">{msg.content}</div>
  </div>
);

const AssistantMessage: FC<{
  msg: ChatMessage;
  isLast: boolean;
  isStreaming: boolean;
  pendingNodes: NodeStatus[] | null;
  onVerify: (question: string) => void;
  question?: string;
}> = ({ msg, isLast, isStreaming, pendingNodes, onVerify, question }) => {
  const streamingNow = isLast && isStreaming;
  const hasThinking = !!msg.metadata?.nodeTraces?.length || (streamingNow && !!pendingNodes?.length);

  return (
    <div className="chat-msg chat-msg--assistant">
      {hasThinking && (
        <ThinkingBlock
          pending={streamingNow ? pendingNodes : null}
          traces={msg.metadata?.nodeTraces}
          reviews={msg.metadata?.reviews}
          durationMs={msg.metadata?.durationMs}
        />
      )}
      <div className="chat-bubble chat-bubble--assistant">
        {msg.content ? (
          <ReactMarkdown disallowedElements={['script', 'iframe']} unwrapDisallowed>
            {msg.content}
          </ReactMarkdown>
        ) : (
          !hasThinking && <span className="chat-caret" aria-label="Bezig met antwoorden" />
        )}
        {streamingNow && msg.content && <span className="chat-caret" />}
      </div>
      {!streamingNow && msg.content && msg.tier !== 'instant' && question && (
        <button type="button" className="chat-verify-btn" onClick={() => onVerify(question)}>
          <Scale /> Toets dit antwoord
        </button>
      )}
    </div>
  );
};

export const MessageList: FC<MessageListProps> = ({ messages, isStreaming, pendingNodes, chatError }) => {
  const navigate = useNavigate();
  const endRef = useRef<HTMLDivElement>(null);
  const lastAssistantId = [...messages].reverse().find(m => m.role === 'assistant')?.id;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, isStreaming]);

  // "Toets dit antwoord" re-runs the original question in the consensus module.
  const handleVerify = (question: string) => {
    navigate('/mission', { state: { autoQuery: question } });
  };

  return (
    <div className="chat-messages" aria-live="polite">
      {messages.map((msg, i) =>
        msg.role === 'user' ? (
          <UserMessage key={msg.id} msg={msg} />
        ) : (
          <AssistantMessage
            key={msg.id}
            msg={msg}
            isLast={msg.id === lastAssistantId}
            isStreaming={isStreaming}
            pendingNodes={pendingNodes}
            onVerify={handleVerify}
            question={[...messages.slice(0, i)].reverse().find(m => m.role === 'user')?.content}
          />
        )
      )}
      {chatError && (
        <div className="chat-msg chat-msg--assistant">
          <div className="chat-bubble chat-bubble--error">{chatError}</div>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
};
