import { useEffect, useState } from 'react';

const SLOW_AFTER_MS = 10_000;

function LoadingState({ isWaking = false }) {
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsSlow(true), SLOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);

  let text = 'Buscando en fuentes oficiales…';
  if (isWaking) text = 'Despertando el servidor… la primera pregunta puede tardar hasta un minuto.';
  else if (isSlow) text = 'Sigue buscando…';

  return (
    <div className="card loading">
      <p className="loading__text">{text}</p>
      <div className="loading__skeleton" aria-hidden="true">
        <span className="loading__line loading__line--wide" />
        <span className="loading__line" />
        <span className="loading__line loading__line--short" />
      </div>
    </div>
  );
}

export default LoadingState;