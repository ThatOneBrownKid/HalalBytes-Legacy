import React, { useState } from "react";
import { Search, MapPin } from "lucide-react";
// import { Input } from "@/components/ui/input";   
// import { Button } from "@/components/ui/button"; 

const CHIPS = ["Indian", "Pizza", "Buffet", "Mediterranean", "Burgers", "Chicken"];

export default function HomePage({ heroBgUrl = "/assets/background.png", onSearch }) {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");

  function submit(e) {
    e.preventDefault();
    onSearch ? onSearch({ query, location }) : console.log({ query, location });
  }

  return (
    <section className="min-h-[80vh] flex items-center justify-center relative overflow-hidden">
      {/* Background image + dark overlay */}
      <div className="absolute inset-0">
        <img
          src={heroBgUrl}
          alt=""
          className="h-full w-full object-cover"
          fetchpriority="high"
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight drop-shadow-lg">
          Find Halal Restaurants
          <br />
          <span className="text-white/90">Near You</span>
        </h1>

        <p className="text-xl text-white/80 mb-8 md:mb-12 max-w-2xl mx-auto drop-shadow-md">
          Discover authentic halal dining experiences in your area
        </p>

        {/* Search Bar */}
        <form onSubmit={submit} className="relative max-w-2xl mx-auto group">
          <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl opacity-50 group-hover:opacity-70 transition-opacity duration-500" />
          <div className="relative flex items-center gap-3 bg-white border-2 border-white/50 rounded-full px-4 md:px-6 py-3 md:py-4 shadow-elegant hover:shadow-hover transition-all duration-300">
            {/* Query */}
            <Search className="h-6 w-6 text-gray-500 flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="I'm hungry for..."
              aria-label="Cuisine or dish"
              className="border-0 bg-transparent text-base md:text-lg text-gray-900 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 placeholder:text-gray-500"
            />

            {/* Divider (desktop only) */}
            <div className="hidden md:block h-6 w-px bg-gray-300/70" aria-hidden="true" />

            {/* Location */}
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="h-5 w-5 text-gray-500" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location"
                aria-label="Location"
                className="border-0 bg-transparent text-base md:text-lg text-gray-900 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 placeholder:text-gray-500 w-32 md:w-60"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              size="lg"
              className="ml-auto rounded-full px-6 md:px-8 bg-accent hover:bg-accent/90 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300"
            >
              Search
            </button>
          </div>
        </form>

        {/* Chips */}
        <div className="mt-6 md:mt-8 flex flex-wrap items-center justify-center gap-2 md:gap-3">
          {CHIPS.map((c) => (
            <button
              key={c}
              type="button"
              className="rounded-full bg-white/90 hover:bg-white text-gray-800 px-4 py-2 text-sm md:text-base shadow"
              onClick={() => setQuery(c)}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Decorative cards (keep if you like the lower placeholders) */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-28 rounded-2xl bg-white/10 border border-white/20 backdrop-blur" />
          <div className="h-28 rounded-2xl bg-white/10 border border-white/20 backdrop-blur" />
          <div className="h-28 rounded-2xl bg-white/10 border border-white/20 backdrop-blur" />
        </div>
      </div>
    </section>
  );
}
