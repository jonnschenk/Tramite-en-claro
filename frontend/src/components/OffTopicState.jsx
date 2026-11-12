import SuggestedQuestions from './SuggestedQuestions.jsx';

function OffTopicState({ data, onSelect }) {
  return (
    <div className="card status status--off-topic">
      <svg className="status__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <div className="status__body">
        <h2 className="status__title">Eso está fuera de lo que puedo responder</h2>
        <p className="status__text">{data.message}</p>
        <SuggestedQuestions title="Prueba con" questions={data.suggestions} onSelect={onSelect} />
      </div>
    </div>
  );
}

export default OffTopicState;