import Citations from './Citations.jsx';
import SourceList from './SourceList.jsx';

// Estado 3 · Respuesta: resumen → pasos → enlace oficial → fuentes.
function AnswerView({ data }) {
  const { summary, steps, sources, officialUrl } = data;

  return (
    <div className="answer-layout">
      <article className="card answer">
        <h2 className="answer__eyebrow">Respuesta</h2>

        <p className="answer__summary">
          {summary.text} <Citations ids={summary.sourceIds} />
        </p>

        <ol className="answer__steps">
          {steps.map((step, index) => (
            <li key={index} className="answer__step">
              <span className="answer__step-number" aria-hidden="true">
                {index + 1}
              </span>
              <span className="answer__step-text">
                {step.text} <Citations ids={step.sourceIds} />
              </span>
            </li>
          ))}
        </ol>

        <a className="answer__official" href={officialUrl} target="_blank" rel="noopener noreferrer">
          Ir al trámite oficial
          <span className="visually-hidden"> (se abre en otra pestaña)</span>
        </a>
      </article>

      <SourceList sources={sources} />
    </div>
  );
}

export default AnswerView;