function ErrorState({ message, onRetry }) {
  return (
    <div className="card status status--error">
      <svg className="status__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 3 2 20h20L12 3Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M12 10v4M12 17v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <div className="status__body">
        <h2 className="status__title">No pudimos responder</h2>
        <p className="status__text">{message}</p>
        <button className="status__retry" type="button" onClick={onRetry}>
          Reintentar
        </button>
      </div>
    </div>
  );
}

export default ErrorState;