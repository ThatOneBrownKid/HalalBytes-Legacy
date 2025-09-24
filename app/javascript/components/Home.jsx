import React from "react";
import NavBar from "./Navbar";

export default function HomePage() {
  return (
<div><NavBar
        brand={{ text: "Halabytes", href: "/" }}
        links={[
          { label: "Restaurants", href: "/restaurants" },
          { label: "Request", href: "/request" },
        ]}
        auth={{ label: "Sign in", href: "/signin" }}
        logo="🍽️"
      />
      <main>
        <section><h1>Explore halal spots near you</h1></section>
      </main></div>
      

  );
}
