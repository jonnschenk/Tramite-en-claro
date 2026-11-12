function SuggestedQuestions({ title, questions, onSelect, disabled }) {
  return (
    <section className="suggestions" aria-labelledby="suggestions-title">
      <h2 className="suggestions__title" id="suggestions-title">
        {title}
      </h2>
      <ul className="suggestions__list">
        {questions.map((question) => (
          <li key={question}>
            <button
              className="suggestions__pill"
              type="button"
              onClick={() => onSelect(question)}
              disabled={disabled}
            >
              {question}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default SuggestedQuestions;