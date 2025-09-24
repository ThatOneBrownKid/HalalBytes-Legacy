// app/javascript/components/NavBar.jsx
import React from "react";

export default function NavBar({
  brand = { text: "Halabytes", href: "/" },
  links = [
    { label: "Restaurants", href: "/restaurants" },
    { label: "Request", href: "/request" },
  ],
  auth = { label: "Sign in", href: "/signin" },
  logo = "🍽️",
}) {
  // ultra-minimal inline styles so it just shows up
  const bar = {
    position: "sticky",
    top: 0,
    zIndex: 10,
    background: "#b9313a",
    color: "#fff",
    borderBottom: "1px solid rgba(255,255,255,0.2)",
  };
  const inner = {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    gap: 16,
  };
  const brandStyle = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    textDecoration: "none",
    color: "#fff",
    fontWeight: 700,
    letterSpacing: ".2px",
  };
  const nav = {
    marginLeft: "auto",
    display: "flex",
    gap: 16,
  };
  const link = {
    color: "rgba(255,255,255,0.9)",
    textDecoration: "none",
    fontWeight: 600,
  };
  const cta = {
    marginLeft: 12,
    textDecoration: "none",
    color: "#b9313a",
    background: "#fff",
    padding: "6px 10px",
    borderRadius: 8,
    fontWeight: 700,
  };

  return (
    <header style={bar}>
      <div style={inner}>
        <a href={brand.href} style={brandStyle} aria-label={`${brand.text} home`}>
          <span aria-hidden="true">{logo}</span>
          <span>{brand.text}</span>
        </a>

        <nav style={nav} aria-label="Primary">
          {links.map((l) => (
            <a key={l.href} href={l.href} style={link}>
              {l.label}
            </a>
          ))}
          <a href={auth.href} style={cta}>{auth.label}</a>
        </nav>
      </div>
    </header>
  );
}
