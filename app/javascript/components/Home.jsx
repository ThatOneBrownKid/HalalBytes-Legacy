import React from "react";

const CHIPS = ["Indian", "Pizza", "Buffet", "Mediterranean", "Burgers", "Chicken"];

export default function HomePage({ heroBgUrl = "/assets/background.png" }) {
  return (
    <main className="hb-hero" style={{ ["--hero-bg"]: `url('${heroBgUrl}')` }}>
      <div className="hb-hero__bg" />
      <div className="hb-hero__shade" />

      <section className="hb-hero__content">
        <h1 className="hb-hero__title">Find halal restaurants near you</h1>

        {/* 1. Updated search form structure to match the design.
          - Removed the visible search button for a cleaner, split-field look.
          - Changed the search form class to 'hb-search-bar' for specific styling.
        */}
        <form className="hb-search-bar" onSubmit={(e) => e.preventDefault()}>
          <div className="hb-search-bar__field">
            {/* 2. Replaced search icon with location-specific text/placeholder */}
            <input placeholder="I'm hungry for..." aria-label="Cuisine or dish" />
          </div>

          {/* Removed the visual divider from the original code */}
          {/* <span className="hb-search__divider" aria-hidden="true" /> */}

          <div className="hb-search-bar__field hb-search-bar__field--location">
            {/* 3. Added a location icon and placeholder/text */}
            {/* The design uses a location pin icon */}
            <i className="bi bi-geo-alt" aria-hidden="true" />
            <input placeholder="Location" aria-label="Location" />
          </div>

          {/* Removed the search button that was part of the original form */}
          {/* <button type="button" className="hb-search__btn" aria-label="Search">
            <i className="bi bi-search" />
          </button> */}
        </form>

        {/* 4. Chips remain the same but will need styling adjustments in CSS */}
        <div className="hb-chips" role="list">
          {CHIPS.map((c) => (
            <button key={c} type="button" className="hb-chip" role="listitem">
              {c}
            </button>
          ))}
        </div>

        {/* 5. Trust Section - Combine the trust text and logos into one main area 
           and update the trust text formatting. */}
        <div className="hb-trust-section">
          {/* Trust Text: Changed the structure to match the design's single line with checkmark */}
          <div className="hb-trust">
            <span className="hb-trust__icon" aria-hidden="true">✓</span>
            <span>Trusted by thousands of users</span>
          </div>

          {/* Logos: Kept the logos div, but will rely on CSS for positioning and font changes */}
          <div className="hb-logos">
            <span className="hb-logo hb-logo--trustpilot">★ Trustpilot</span>
            <span className="hb-logo hb-logo--google">G Google</span>
          </div>
        </div>

        {/* 6. Cards Section - The design shows three blank-looking containers at the bottom.
           We'll keep the current structure for the cards. */}
        <div className="hb-cards">
          <div className="hb-card" />
          <div className="hb-card" />
          {/* The design appears to only show 2 or 3 blank areas. Keeping 3 for now. */}
          {/* <div className="hb-card" /> */}
        </div>
      </section>

      {/* 7. Footer - Positioned at the very bottom outside the main content block. 
           Will rely on CSS for the correct positioning and styling. */}
      <footer className="hb-footer">
        <a href="/about">About</a>
        <a href="/terms">Terms</a>
        <a href="/privacy">Privacy</a>
      </footer>
    </main>
  );
}