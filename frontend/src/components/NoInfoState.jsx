function NoInfoState({ data }) {
  return (
    <div className="card status status--no-info">
      <svg className="status__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M12 11v6M12 7.5v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <div className="status__body">
        <h2 className="status__title">No tengo esa información</h2>
        <p className="status__text">{data.message}</p>
        <a className="status__link" href={data.officialUrl} target="_blank" rel="noopener noreferrer">
          Consultar el sitio oficial
          <span className="visually-hidden"> (se abre en otra pestaña)</span>
        </a>
      </div>
    </div>
  );
}

export default NoInfoState;