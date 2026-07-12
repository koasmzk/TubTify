// components/layout/TopNav.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Home, Search, Monitor, Bell, Users, X } from "lucide-react";
import { usePlayerStore } from "@/lib/store";

type Suggestion = {
  id: string;
  title: string;
  artist: string;
  cover: string;
};

export default function TopNav() {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setSearchQuery = usePlayerStore((state) => state.setSearchQuery);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!input.trim()) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(input)}`);
        const data = await res.json();
        setSuggestions((data.tracks ?? []).slice(0, 6)); // batasi 6 biar dropdown gak kepanjangan
      } catch (err) {
        console.error("Suggestion fetch failed:", err);
      }
    }, 400); // delay 400ms setelah berhenti ngetik

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [input]);

  // submit search (Enter / klik suggestion) → trigger CenterContent fetch full results
  function submitSearch(query: string) {
    setSearchQuery(query);
    setShowDropdown(false);
    setInput(query);
  }

  return (
    <header className="flex items-center justify-between h-16 shrink-0 px-2 w-full gap-4 z-10">
      <div className="flex items-center">
        <button className="flex items-center justify-center w-12 h-12 rounded-full bg-[#121212] hover:scale-105 transition-transform duration-200">
          <Home className="w-6 h-6 text-white" strokeWidth={2} />
        </button>
      </div>

      <div className="flex items-center flex-1 max-w-[600px] relative">
        <div className="relative w-full flex items-center bg-[#2A2A2A] rounded-full h-12 px-4 hover:bg-[#333333] border border-transparent hover:border-[#444444] transition-colors duration-200 group">
          <Search className="w-5 h-5 text-muted-foreground mr-3 group-hover:text-white transition-colors" strokeWidth={2} />
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && input.trim()) submitSearch(input.trim());
            }}
            placeholder="What do you want to play?"
            className="bg-transparent border-none outline-none text-white w-full text-[15px] font-medium placeholder:text-muted-foreground"
          />
          {input && (
            <button onClick={() => { setInput(""); setSuggestions([]); }}>
              <X className="w-4 h-4 text-muted-foreground hover:text-white transition-colors mr-3" />
            </button>
          )}
          <span className="w-[1px] h-6 bg-muted-foreground/30 mx-3"></span>
          <button className="text-muted-foreground hover:text-white transition-colors">
            <Monitor className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        {/* Dropdown suggestion */}
        {showDropdown && suggestions.length > 0 && (
          <div
            className="absolute top-[56px] left-0 w-full bg-[#282828] rounded-xl shadow-2xl overflow-hidden z-50"
            onMouseLeave={() => setShowDropdown(false)}
          >
            {suggestions.map((track) => (
              <button
                key={track.id}
                onClick={() => submitSearch(track.title)}
                className="flex items-center gap-3 w-full px-4 py-2 hover:bg-[#3a3a3a] transition-colors text-left"
              >
                <img src={track.cover} alt={track.title} className="w-10 h-10 rounded object-cover flex-shrink-0" />
                <div className="overflow-hidden">
                  <p className="text-sm text-white font-medium truncate">{track.title}</p>
                  <p className="text-xs text-muted-foreground truncate">Song • {track.artist}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <button className="hidden lg:block bg-white text-black font-bold text-sm px-4 py-1.5 rounded-full hover:scale-105 transition-transform duration-200">
          Experimental
        </button>
        <a
          href="https://www.spotify.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden lg:flex items-center gap-1 text-muted-foreground hover:text-white hover:scale-105 transition-all duration-200 text-sm font-bold"
        >
          <Monitor className="w-4 h-4" strokeWidth={2} />
          Visit Original
        </a>
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-white transition-colors">
            <Bell className="w-4 h-4" strokeWidth={2} />
          </button>
          <button className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-white transition-colors">
            <Users className="w-4 h-4" strokeWidth={2} />
          </button>
          <button className="w-8 h-8 rounded-full bg-[#E91680] text-black font-bold flex items-center justify-center hover:scale-105 transition-transform duration-200">
            O
          </button>
        </div>
      </div>
    </header>
  );
}