import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { ImageOff, LoaderCircle } from 'lucide-react';
import { createImageCouncilSignedUrl } from '../../services/imageCouncilService';
import { ImageCouncilArtifact } from '../../types/imageCouncil';

interface PrivateCouncilImageProps {
  artifact: ImageCouncilArtifact;
  alt: string;
  className?: string;
  eager?: boolean;
  fullResolution?: boolean;
  onClick?: () => void;
}

const REFRESH_AFTER_MS = 8 * 60 * 1000;

export const PrivateCouncilImage: FC<PrivateCouncilImageProps> = ({
  artifact,
  alt,
  className = '',
  eager = false,
  fullResolution = false,
  onClick,
}) => {
  const requestRef = useRef(0);
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const refreshUrl = useCallback(async () => {
    if (!artifact.storagePath) {
      setFailed(true);
      return;
    }
    const requestId = ++requestRef.current;
    setFailed(false);
    try {
      const thumbnailWidth = fullResolution ? undefined : eager ? 1280 : 640;
      const nextUrl = await createImageCouncilSignedUrl(
        artifact.storagePath,
        thumbnailWidth,
      );
      if (requestRef.current === requestId) setUrl(nextUrl);
    } catch {
      if (requestRef.current === requestId) {
        setUrl(null);
        setFailed(true);
      }
    }
  }, [artifact.storagePath, eager, fullResolution]);

  useEffect(() => {
    setUrl(null);
    void refreshUrl();
    const intervalId = window.setInterval(() => void refreshUrl(), REFRESH_AFTER_MS);
    return () => {
      requestRef.current += 1;
      window.clearInterval(intervalId);
    };
  }, [refreshUrl]);

  const content = failed ? (
    <span className="ic-private-image__state" role="img" aria-label={`${alt} kon niet laden`}>
      <ImageOff aria-hidden="true" />
      <span>Beeld niet beschikbaar</span>
    </span>
  ) : url ? (
    <picture>
      <source srcSet={url} type={artifact.mimeType} />
      <img
        className={className}
        src={url}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        width={artifact.width ?? undefined}
        height={artifact.height ?? undefined}
        onError={() => {
          setUrl(null);
          void refreshUrl();
        }}
      />
    </picture>
  ) : (
    <span className="ic-private-image__state" role="status" aria-label="Afbeelding laden">
      <LoaderCircle className="ic-spin" aria-hidden="true" />
    </span>
  );

  if (!onClick) return content;

  return (
    <button
      type="button"
      className="ic-private-image__button"
      onClick={onClick}
      aria-label={`${alt} op groot formaat bekijken`}
    >
      {content}
    </button>
  );
};
