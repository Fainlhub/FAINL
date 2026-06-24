import { FC, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { CouncilMember, CouncilResponse } from '../types';
import { NodeLoader } from './NodeLoader';
import { ChevronDown, ChevronUp } from 'lucide-react';

const LOADING_TEXT: Record<string, string> = {
  'node-alpha-fact': 'Controleert feiten en bronnen…',
  'node-beta-logic': 'Ontleedt de logica van je vraag…',
  'node-gamma-vision': 'Zoekt het onverwachte perspectief…',
};

const SECTION_BADGE: Record<string, string> = {
  STANDPUNT: 'bg-[var(--ink-3)] text-white',
  ANALYSE:   'bg-green-500 text-white',
  NUANCE:    'bg-amber-500 text-white',
  ADVIES:    'bg-red-500 text-white',
  GENERAL:   'bg-black text-[var(--ink)]',
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
  onToggle
}) => {
  const [localExpanded, setLocalExpanded] = useState(false);
  const showFull = isExpanded || localExpanded;

  return (
    <div className={`relative flex flex-col bg-white dark:bg-zinc-900 border-2 border-black dark:border-[var(--line)]/40 rounded-none overflow-hidden transition-all duration-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(71,109,215,0.35)] ${response && !isLoading ? 'animate-in fade-in slide-in-from-bottom-2 duration-400' : ''}`}>

      {/* Header */}
      <div className="flex items-center gap-2 md:gap-3 px-3 py-2 md:px-4 md:py-3 border-b-2 border-black dark:border-[var(--line)]/30 bg-black">
        <div className={`w-7 h-7 md:w-9 md:h-9 rounded-full shrink-0 border-2 border-white/30 overflow-hidden ${member.color}`}>
          <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-xs md:text-sm uppercase tracking-widest text-white truncate leading-none">{member.name}</h3>
          <p className="text-[10px] md:text-[11px] text-white/50 mt-0.5 font-medium truncate">{member.description}</p>
        </div>
        {isLoading && (
          <div className="shrink-0">
            <NodeLoader shape="circle" />
          </div>
        )}
        {response && (
          <button
            type="button"
            onClick={() => { setLocalExpanded(e => !e); onToggle(); }}
            className="shrink-0 p-1.5 rounded-lg text-white/40 hover:text-white transition-colors"
            title={showFull ? 'Inklappen' : 'Volledig lezen'}
          >
            {showFull ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 md:py-14 gap-4">
            <NodeLoader shape="circle" />
            <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-black/40 dark:text-white/30 animate-pulse">{LOADING_TEXT[member.id] || 'Analyseert jouw vraag…'}</span>
          </div>
        ) : response ? (
          <div className="px-3 md:px-5 py-3 md:py-4">
            {response.sections && Object.keys(response.sections).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(response.sections).map(([key, content]) => (
                  <div key={key} className="relative">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 ${SECTION_BADGE[key] ?? 'bg-black text-[var(--ink)]'}`}>
                        {key === 'GENERAL' ? 'Analyse' : key}
                      </span>
                    </div>
                    <div className="prose prose-sm max-w-none
                      prose-p:text-black dark:prose-p:text-white/80 prose-p:leading-relaxed prose-p:my-1
                      prose-strong:text-black dark:prose-strong:text-white prose-strong:font-black
                      prose-ul:my-1 prose-li:text-black dark:prose-li:text-white/80 prose-li:my-0.5">
                      <ReactMarkdown disallowedElements={['script', 'iframe', 'object', 'embed']} unwrapDisallowed>{content}</ReactMarkdown>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="prose prose-sm max-w-none
                prose-p:text-black dark:prose-p:text-white/80 prose-p:leading-relaxed prose-p:my-2
                prose-strong:text-black dark:prose-strong:text-white prose-strong:font-black
                prose-headings:text-black dark:prose-headings:text-white prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight
                prose-ul:my-2 prose-li:text-black dark:prose-li:text-white/80 prose-li:my-1 prose-li:leading-relaxed
                prose-hr:border-zinc-200 dark:prose-hr:border-zinc-700">
                <ReactMarkdown disallowedElements={['script', 'iframe', 'object', 'embed']} unwrapDisallowed>{response.content}</ReactMarkdown>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 md:py-14 gap-2 text-black/20 dark:text-white/15">
            <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-black/10 dark:border-white/10 border-t-black/30 dark:border-t-white/30 rounded-full animate-spin" />
            <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em]">In de wachtrij…</span>
          </div>
        )}
      </div>
    </div>
  );
};
