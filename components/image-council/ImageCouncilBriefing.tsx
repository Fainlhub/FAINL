import { FC, FormEvent, useMemo, useRef, useState } from 'react';
import { ArrowUp, Image, LoaderCircle } from 'lucide-react';
import {
  DEFAULT_IMAGE_COUNCIL_BRIEF,
  IMAGE_COUNCIL_ASPECT_RATIOS,
  IMAGE_COUNCIL_STYLE_PRESETS,
  ImageCouncilAspectRatio,
  ImageCouncilStylePreset,
  StartImageCouncilInput,
} from '../../types/imageCouncil';

const MAX_PROMPT_LENGTH = 4_000;

const STYLE_LABELS: Record<ImageCouncilStylePreset, string> = {
  auto: 'Automatisch',
  photo: 'Fotografie',
  illustration: 'Illustratie',
  editorial: 'Redactioneel',
  product: 'Product',
};

const EXAMPLES = [
  'Een redactioneel beeld over menselijk leiderschap in een tijd van AI',
  'Minimalistische productfoto van een hervulbare glazen waterfles',
  'Een warme illustratie van een buurt die samen een stadstuin bouwt',
];

export const ImageCouncilBriefing: FC<{
  onStart: (input: StartImageCouncilInput) => Promise<void>;
  isStarting: boolean;
}> = ({ onStart, isStarting }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<ImageCouncilAspectRatio>(
    DEFAULT_IMAGE_COUNCIL_BRIEF.aspectRatio,
  );
  const [stylePreset, setStylePreset] = useState<ImageCouncilStylePreset>(
    DEFAULT_IMAGE_COUNCIL_BRIEF.stylePreset,
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const examples = useMemo(() => EXAMPLES, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const cleanPrompt = prompt.trim();
    if (cleanPrompt.length < 3 || isStarting) return;
    await onStart({
      clientRequestId: crypto.randomUUID(),
      prompt: cleanPrompt,
      aspectRatio,
      stylePreset,
    });
  };

  return (
    <section className="ic-briefing" aria-labelledby="ic-briefing-title">
      <div className="ic-briefing__intro">
        <span className="ic-briefing__mark" aria-hidden="true"><Image /></span>
        <div>
          <p className="ic-eyebrow">Vijf beeldmodellen, één advies</p>
          <h1 id="ic-briefing-title">Wat wil je laten maken?</h1>
          <p>Beschrijf onderwerp, sfeer, compositie en wat absoluut zichtbaar moet zijn.</p>
        </div>
      </div>

      <form className="ic-composer" onSubmit={submit}>
        <label className="ic-field-label" htmlFor="ic-prompt">Briefing</label>
        <textarea
          ref={textareaRef}
          id="ic-prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value.slice(0, MAX_PROMPT_LENGTH))}
          placeholder="Bijvoorbeeld: een helder campagnebeeld voor..."
          rows={6}
          minLength={3}
          maxLength={MAX_PROMPT_LENGTH}
          required
          disabled={isStarting}
        />
        <div className="ic-composer__count" aria-live="polite">
          {prompt.length}/{MAX_PROMPT_LENGTH}
        </div>

        <fieldset className="ic-fieldset">
          <legend>Beeldverhouding</legend>
          <div className="ic-segments ic-segments--ratios">
            {IMAGE_COUNCIL_ASPECT_RATIOS.map((ratio) => (
              <button
                key={ratio}
                type="button"
                className={aspectRatio === ratio ? 'is-active' : ''}
                aria-pressed={aspectRatio === ratio}
                onClick={() => setAspectRatio(ratio)}
                disabled={isStarting}
              >
                <span className={`ic-ratio-shape ic-ratio-shape--${ratio.replace(':', '-')}`} aria-hidden="true" />
                {ratio}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="ic-fieldset">
          <legend>Stijl</legend>
          <div className="ic-segments ic-segments--styles">
            {IMAGE_COUNCIL_STYLE_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                className={stylePreset === preset ? 'is-active' : ''}
                aria-pressed={stylePreset === preset}
                onClick={() => setStylePreset(preset)}
                disabled={isStarting}
              >
                {STYLE_LABELS[preset]}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="ic-composer__submit-row">
          <p>Maximaal 9 credits worden gereserveerd. Ongebruikte credits komen terug.</p>
          <button
            type="submit"
            className="ic-button ic-button--primary"
            disabled={prompt.trim().length < 3 || isStarting}
          >
            {isStarting ? <LoaderCircle className="ic-spin" /> : <ArrowUp />}
            {isStarting ? 'Beeldraad starten' : 'Naar de Beeldraad'}
          </button>
        </div>
      </form>

      <div className="ic-examples" aria-label="Voorbeeldbriefings">
        {examples.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => {
              setPrompt(example);
              textareaRef.current?.focus();
            }}
          >
            {example}
          </button>
        ))}
      </div>
    </section>
  );
};

