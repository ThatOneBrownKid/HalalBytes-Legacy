import React from "react";
import "../styles/navbar.css"; // NEW: modular styles for the navbar

export default function NavBar({
  brand = { text: "Halalbytes", href: "/" },
  links = [
    { label: "Restaurants", href: "/restaurants" },
    { label: "Request", href: "/request" },
  ],
  auth = { label: "Sign in", href: "/signin" },
  logoSrc,
  showBrandText = true, // set to false if you want logo-only
}) {
  return (
    <header className="hb-nav" role="banner">
      <div className="hb-nav__inner">
        <a href={brand.href} className="hb-brand" aria-label={`${brand.text} home`}>
          {logoSrc && (
            <img
              className="hb-brand__logo"
              src={logoSrc}
              alt=""
              loading="eager"
              decoding="async"
            />
          )}
          {showBrandText && <span className="hb-brand__text">{brand.text}</span>}
        </a>

        <nav className="hb-links" aria-label="Primary">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="hb-link">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hb-cta">
          <a href={auth.href} className="hb-cta__btn">{auth.label}</a>
        </div>
      </div>
    </header>
  );
}
