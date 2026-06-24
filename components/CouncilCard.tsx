import { FC, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { CouncilMember, CouncilResponse } from '../types';
import { NodeLoader } from './NodeLoader';
import { ChevronDown, ChevronUp } from 'lucide-react';

const LOADING_TEXT: Record<string, string> = {
  'node-alpha-fact': 'Perplexi Pieter controleert feiten en bronnen...',
  'node-beta-logic': 'Claudia Codea ontleedt de logica...',
  'node-gamma-vision': 'Shope Aijna zoekt het onverwachte perspectief...',
  'node-delta-deep': 'Jan Seekdeep graaft naar diepere patronen...',
  'node-epsilon-seek': 'Mimi Stral verifieert met actuele bronnen...',
  'node-zeta-risk': 'Leonardo da Llama analyseert risico\'s...',
  'node-eta-synth': 'Gerdi Gemini zoekt synthese tussen standpunten...',
};

const SECTION_BADGE: Record<string, string> = {
  STANDPUNT: 'council-card__badge--standpunt',
  ANALYSE:   'council-card__badge--analyse',
  NUANCE:    'council-card__badge--nuance',
  ADVIES:    'council-card__badge--advies',
  GENERAL:   'council-card__badge--general',
};

interface CouncilCardProps {
  member: CouncilMember;
  response?: CouncilResponse;
  isLoading: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}

export const CouncilCard: FC<CouncilCardProps> = ({
  member,
  response,
  isLoading,
  isExpanded,
  onToggle,
}) => {
  const [localExpanded, setLocalExpanded] = useState(false);
  const showFull = isExpanded || localExpanded;

  const cardClass = [
    'council-card node-card',
    isLoading ? 'is-loading' : '',
    response && !isLoading ? 'is-done council-card-enter' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cardClass}>
      {/* Header */}
      <div className="council-card__header">
        <div className="council-card__avatar">
          <img
            src={member.avatar}
            alt={member.name}
            className="council-card__avatar-img"
            width={36}
            height={36}
          />
        </div>
        <div className="council-card__meta">
          <h3 className="council-card__name">{member.name}</h3>
          <p className="council-card__role">{member.description}</p>
        </div>
        {isLoading && (
          <div className="council-card__loader">
            <NodeLoader shape="circle" />
          </div>
        )}
        {response && (
          <button
            type="button"
            onClick={() => {
              setLocalExpanded((e) => !e);
              onToggle();
            }}
            className="council-card__toggle"
            title={showFull ? 'Inklappen' : 'Volledig lezen'}
            aria-expanded={showFull}
          >
            {showFull ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="council-card__body">
        {isLoading ? (
          <div className="council-card__loading">
            <NodeLoader shape="circle" />
            <span className="council-card__loading-text">
              {LOADING_TEXT[member.id] || 'Analyseert jouw vraag...'}
            </span>
          </div>
        ) : response ? (
          <div className="council-card__content">
            {response.sections && Object.keys(response.sections).length > 0 ? (
              <div className="council-card__sections">
                {Object.entries(response.sections).map(([key, content]) => (
                  <div key={key} className="council-card__section">
                    <div className="council-card__badge-row">
                      <span
                        className={`council-card__badge ${SECTION_BADGE[key] ?? 'council-card__badge--general'}`}
                      >
                        {key === 'GENERAL' ? 'Analyse' : key}
                      </span>
                    </div>
                    <div className="council-card__prose">
                      <ReactMarkdown
                        disallowedElements={['script', 'iframe', 'object', 'embed']}
                        unwrapDisallowed
                      >
                        {content}
                      </ReactMarkdown>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="council-card__prose">
                <ReactMarkdown
                  disallowedElements={['script', 'iframe', 'object', 'embed']}
                  unwrapDisallowed
                >
                  {response.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        ) : (
          <div className="council-card__queued">
            <div className="council-card__spinner" />
            <span className="council-card__queued-text">In de wachtrij...</span>
          </div>
        )}
      </div>
    </div>
  );
};
