import { useEffect, useState } from 'react';

const SLOW_AFTER_MS = 10_000;

function LoadingState() {
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsSlow(true), SLOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="card loading">
      <p className="loading__text">{isSlow ? 'Sigue buscando…' : 'Buscando en fuentes oficiales…'}</p>
      <div className="loading__skeleton" aria-hidden="true">
        <span className="loading__line loading__line--wide" />
        <span className="loading__line" />
        <span className="loading__line loading__line--short" />
      </div>
    </div>
  );
}

export default LoadingState;