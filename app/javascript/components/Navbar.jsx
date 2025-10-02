import React from "react";
import { User } from "lucide-react";

/**
 * Props:
 * - brand: { text: string, href: string }
 * - links: [{ label: string, href: string }]
 * - auth:  { label?: string, href?: string }
 * - logoSrc?: string
 * - showBrandText?: boolean
 * - showAuthIcon?: boolean  // default true
 */
export default function NavBar({
  brand = { text: "HalalBytes", href: "/" },
  links = [
    { label: "Restaurants", href: "/restaurants" },
    { label: "Request", href: "/request" },
  ],
  auth = { label: "Sign in", href: "/signin" },
  logoSrc,
  showBrandText = true,
  showAuthIcon = true,
}) {
  return (
    <nav className="w-full border-b border-white/10 bg-black/10 backdrop-blur-sm fixed top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: logo + brand text */}
          <a href={brand.href} className="flex items-center gap-3" aria-label={`${brand.text} home`}>
            {logoSrc ? (
              <img src={logoSrc} alt="HalalBytes" className="h-8 w-8 drop-shadow-md" />
            ) : (
              <div className="h-8 w-8 rounded bg-white/20" aria-hidden="true" />
            )}
            {showBrandText && (
              <span className="text-2xl font-bold text-white drop-shadow-md">
                {brand.text}
              </span>
            )}
          </a>

          {/* Right: links + auth */}
          <div className="flex items-center gap-6">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-white/90 hover:text-white hover:bg-white/20 transition-colors px-3 py-2 rounded-md"
              >
                {l.label}
              </a>
            ))}

            {/* Auth: either icon-only or text button */}
            {showAuthIcon ? (
              <a
                href={auth.href || "#"}
                className="text-white hover:text-white hover:bg-white/20 transition-colors rounded-full p-2"
                aria-label={auth.label || "Account"}
              >
                <User className="h-5 w-5" />
              </a>
            ) : (
              <a
                href={auth.href || "#"}
                className="text-white hover:text-white hover:bg-white/20 transition-colors px-4 py-2 rounded-full font-semibold"
              >
                {auth.label || "Sign in"}
              </a>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
