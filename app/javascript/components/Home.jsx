import React from "react";

const CHIPS = ["Indian", "Pizza", "Buffet", "Mediterranean", "Burgers", "Chicken"];

export default function HomePage({ heroBgUrl = "/assets/background.png" }) {
  return (
    <main className="hb-hero" style={{ ["--hero-bg"]: `url('${heroBgUrl}')` }}>
      <div className="hb-hero__bg" />
      <div className="hb-hero__shade" />

      <section className="hb-hero__content">
        <h1 className="hb-hero__title">Find halal restaurants near you</h1>

        <form className="hb-search" onSubmit={(e) => e.preventDefault()}>
          <div className="hb-search__field">
            <i className="bi bi-search" aria-hidden="true" />
            <input placeholder="I'm hungry for..." aria-label="Cuisine or dish" />
          </div>

          <span className="hb-search__divider" aria-hidden="true" />

          <div className="hb-search__field">
            <i className="bi bi-geo-alt" aria-hidden="true" />
            <input placeholder="Location" aria-label="Location" />
          </div>

          <button type="button" className="hb-search__btn" aria-label="Search">
            <i className="bi bi-search" />
          </button>
        </form>

        <div className="hb-chips" role="list">
          {CHIPS.map((c) => (
            <button key={c} type="button" className="hb-chip" role="listitem">
              {c}
            </button>
          ))}
        </div>

        <div className="hb-trust">
          <span className="hb-trust__icon" aria-hidden="true">✓</span>
          <span>Trusted by thousands of users</span>
        </div>

        <div className="hb-logos">
          <span className="hb-logo">★ Trustpilot</span>
          <span className="hb-logo">G Google</span>
        </div>

        <div className="hb-cards">
          <div className="hb-card" />
          <div className="hb-card" />
          <div className="hb-card" />
        </div>
      </section>

      <footer className="hb-footer">
        <a href="/about">About</a>
        <a href="/terms">Terms</a>
        <a href="/privacy">Privacy</a>
      </footer>
    </main>
  );
}
