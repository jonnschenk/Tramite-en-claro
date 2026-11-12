// Sección "Cómo funciona" (solo en el inicio de web): explica de dónde sale la información.
const STEPS = [
  {
    title: 'Busca en fuentes oficiales',
    text: 'Revisa páginas del Registro Civil y del Gobierno de la Ciudad de México.',
  },
  {
    title: 'Responde en pasos claros',
    text: 'Usa español sencillo y cita la fuente de cada dato.',
  },
  {
    title: 'Si no sabe, te lo dice',
    text: 'En lugar de inventar, te manda al sitio oficial.',
  },
];

function HowItWorks() {
  return (
    <section className="how" aria-labelledby="how-title">
      <h2 className="how__title" id="how-title">
        Cómo funciona
      </h2>
      <ol className="how__list">
        {STEPS.map((step, index) => (
          <li key={step.title} className="card how__item">
            <span className="how__number" aria-hidden="true">
              {index + 1}
            </span>
            <h3 className="how__item-title">{step.title}</h3>
            <p className="how__text">{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default HowItWorks;