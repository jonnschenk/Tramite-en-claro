function Citations({ ids }) {
  if (!ids?.length) return null;

  return (
    <span className="citations">
      {ids.map((id) => (
        <a key={id} className="citations__link" href={`#fuente-${id}`} aria-label={`Fuente ${id}`}>
          [{id}]
        </a>
      ))}
    </span>
  );
}

export default Citations;