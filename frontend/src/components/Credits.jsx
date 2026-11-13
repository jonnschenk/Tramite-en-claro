const LINKS = [
  { label: 'Portafolio', href: 'https://nathan-portafolio.web.app' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/jonathan-ram%C3%ADrez-2b0043246' },
  { label: 'GitHub', href: 'https://github.com/jonnschenk' },
];

// Quién hizo la herramienta. Se usa en el footer y, en el home de móvil, debajo del título
// (ahí abajo está el buscador fijo y no cabe un footer sin scroll).
function Credits({ className = '' }) {
  return (
    <p className={`credits ${className}`.trim()}>
      <span className="credits__by">Hecho por Jonathan M. Ramírez</span>
      <span className="credits__links">
        {LINKS.map((link) => (
          <span key={link.label} className="credits__item">
            <span className="credits__sep" aria-hidden="true">
              ·
            </span>
            <a className="credits__link" href={link.href} target="_blank" rel="noopener noreferrer">
              {link.label}
              <span className="visually-hidden"> (abre en otra pestaña)</span>
            </a>
          </span>
        ))}
      </span>
    </p>
  );
}

export default Credits;
