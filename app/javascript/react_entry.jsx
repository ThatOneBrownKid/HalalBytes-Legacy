// REAL ENTRY
import React from "react";
import { createRoot } from "react-dom/client";

// import your components – match filenames exactly
import HomePage from "./components/Home";      // file: app/javascript/components/Home.jsx
import NavBar from "./components/Navbar";      // file: app/javascript/components/Navbar.jsx

const registry = { HomePage, NavBar };

function mount() {
  document.querySelectorAll("[data-react-root]").forEach((el) => {
    if (el.__reactRoot) return;
    const name = el.getAttribute("data-react-root");
    const Component = registry[name];
    if (!Component) {
      console.warn(`[react] No component registered as "${name}"`);
      return;
    }
    let props = {};
    const raw = el.getAttribute("data-props");
    if (raw) { try { props = JSON.parse(raw); } catch (e) { console.warn("Bad JSON in data-props", e); } }

    const root = createRoot(el);
    el.__reactRoot = root;
    root.render(<Component {...props} />);
  });
}

document.addEventListener("DOMContentLoaded", mount);
document.addEventListener("turbo:load", mount);
