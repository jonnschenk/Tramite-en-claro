const PORTFOLIO = 'https://nathan-portafolio.web.app';

const PROFILES = [
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/jonathan-ram%C3%ADrez-2b0043246',
    viewBox: '0 0 24 24',
    path: 'M3.5 9h3.9v12H3.5zM5.45 3a2.25 2.25 0 1 1 0 4.5 2.25 2.25 0 0 1 0-4.5zM9.9 9h3.75v1.65h.05c.52-.98 1.8-2.02 3.7-2.02 3.96 0 4.7 2.6 4.7 6V21h-3.9v-5.65c0-1.35-.03-3.08-1.88-3.08-1.88 0-2.17 1.47-2.17 2.98V21H9.9z',
  },
  {
    label: 'GitHub',
    href: 'https://github.com/jonnschenk',
    viewBox: '0 0 16 16',
    path: 'M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z',
  },
];

const NEW_TAB = ' (abre en otra pestaña)';

// Quién hizo la herramienta: el nombre lleva al portafolio y LinkedIn/GitHub van como íconos.
// Se usa en el footer de desktop y, en el home de móvil, debajo del título.
function Credits({ className = '' }) {
  return (
    <div className={`credits ${className}`.trim()}>
      <p className="credits__by">
        Hecho por{' '}
        <a className="credits__name" href={PORTFOLIO} target="_blank" rel="noopener noreferrer">
          Jonathan M. Ramírez
          <svg className="credits__arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M8 16 16 8M9.5 8H16v6.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="visually-hidden">, portafolio{NEW_TAB}</span>
        </a>
      </p>

      <ul className="credits__profiles">
        {PROFILES.map((profile) => (
          <li key={profile.label}>
            <a
              className="credits__icon-link"
              href={profile.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${profile.label}${NEW_TAB}`}
            >
              <svg className="credits__icon" viewBox={profile.viewBox} aria-hidden="true" focusable="false">
                <path d={profile.path} fill="currentColor" />
              </svg>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Credits;
