// Silueta de la respuesta: usa las mismas clases de tarjeta que AnswerView y SourceList,
// así el tamaño y la forma coinciden. Es decorativa: el texto de estado ya avisa que está cargando.
const STEP_WIDTHS = ['wide', 'medium', 'wide'];

function AnswerSkeleton() {
  return (
    <div className="answer-layout" aria-hidden="true">
      <div className="card answer">
        <span className="skeleton skeleton--eyebrow" />

        <div className="skeleton-group">
          <span className="skeleton skeleton--wide" />
          <span className="skeleton skeleton--medium" />
        </div>

        <ul className="skeleton-list">
          {STEP_WIDTHS.map((width, index) => (
            <li key={index} className="skeleton-row">
              <span className="skeleton skeleton--circle" />
              <div className="skeleton-group skeleton-group--grow">
                <span className={`skeleton skeleton--${width}`} />
                <span className="skeleton skeleton--short" />
              </div>
            </li>
          ))}
        </ul>

        <span className="skeleton skeleton--button" />
      </div>

      <div className="card sources">
        <span className="skeleton skeleton--eyebrow skeleton--spaced" />
        <div className="skeleton-row">
          <span className="skeleton skeleton--circle-small" />
          <div className="skeleton-group skeleton-group--grow">
            <span className="skeleton skeleton--short" />
            <span className="skeleton skeleton--wide" />
            <span className="skeleton skeleton--medium" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnswerSkeleton;
