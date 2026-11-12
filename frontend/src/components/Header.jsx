function Header() {
  return (
    <header className="header">
      <div className="header__inner">
        <a className="header__brand" href={import.meta.env.BASE_URL}>
          <svg className="header__logo" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
            <circle cx="21" cy="21" r="13" fill="none" stroke="currentColor" strokeWidth="5.5" />
            <circle className="header__logo-dot" cx="37.5" cy="37.5" r="6.5" />
          </svg>
          <span className="header__name">
            trámite en claro<span className="header__dot">.</span>
          </span>
        </a>
      </div>
    </header>
  );
}

export default Header;