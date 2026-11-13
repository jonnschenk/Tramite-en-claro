import { useEffect, useState } from 'react';

// isHome: alinea el header a la columna angosta del home.
// onNewQuestion: si existe, muestra el botón "Nueva pregunta" (solo con un resultado en pantalla).
function Header({ isHome, onNewQuestion }) {
  const [isScrolled, setIsScrolled] = useState(false);

  // La línea de abajo solo aparece cuando el contenido pasa por debajo del header.
  useEffect(() => {
    const update = () => setIsScrolled(window.scrollY > 0);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <header className={`header${isScrolled ? ' header--scrolled' : ''}`}>
      <div className={`header__inner${isHome ? ' header__inner--home' : ''}`}>
        <a className="header__brand" href={import.meta.env.BASE_URL}>
          <svg className="header__logo" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
            <circle cx="21" cy="21" r="13" fill="none" stroke="currentColor" strokeWidth="5.5" />
            <circle className="header__logo-dot" cx="37.5" cy="37.5" r="6.5" />
          </svg>
          <span className="header__name">
            trámite en claro<span className="header__dot">.</span>
          </span>
        </a>

        <div className="header__actions">
          <p className="header__badge" role="note">
            <span className="header__badge-dot" aria-hidden="true" />
            <span className="header__badge-long">Independiente · no oficial</span>
            <span className="header__badge-short" aria-hidden="true">
              No oficial
            </span>
            <span className="visually-hidden">. Verifica siempre en el canal oficial.</span>
          </p>

          {onNewQuestion && (
            <button className="header__new" type="button" onClick={onNewQuestion}>
              <svg className="header__new-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="header__new-label">Nueva pregunta</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
