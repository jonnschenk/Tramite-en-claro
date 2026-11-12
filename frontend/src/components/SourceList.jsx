import { formatDate } from '../utils/formatDate.js';

function SourceList({ sources }) {
  return (
    <aside className="card sources" aria-labelledby="sources-title">
      <h2 className="sources__title" id="sources-title">
        Fuentes
      </h2>
      <ol className="sources__list">
        {sources.map((source) => (
          <li key={source.id} className="sources__item" id={`fuente-${source.id}`}>
            <span className="sources__number" aria-hidden="true">
              {source.id}
            </span>
            <div>
              <p className="sources__domain">{source.domain}</p>
              <a className="sources__link" href={source.url} target="_blank" rel="noopener noreferrer">
                {source.title}
                <span className="visually-hidden"> (se abre en otra pestaña)</span>
              </a>
              <p className="sources__date">Consultada el {formatDate(source.consultedAt)}</p>
            </div>
          </li>
        ))}
      </ol>
    </aside>
  );
}

export default SourceList;