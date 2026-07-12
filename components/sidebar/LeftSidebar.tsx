// components/sidebar/LeftSidebar.tsx
"use client";

import { useState } from "react";
import { Library, Plus, ArrowRight, Search, List } from "lucide-react";

const PLAYLISTS = [
  { id: 1, title: "Liked Songs", subtitle: "Playlist • 53 songs", gradient: "bg-gradient-to-br from-indigo-500 to-purple-800" },
  { id: 2, title: "Iki epep", subtitle: "Playlist • Oreo Thinss", gradient: "bg-gradient-to-br from-neutral-700 to-neutral-900" },
  { id: 3, title: "Crush", subtitle: "Playlist • Oreo Thinss", gradient: "bg-gradient-to-br from-rose-400 to-red-600" },
  { id: 4, title: "Phonk(biar melek)", subtitle: "Playlist • Oreo Thinss", gradient: "bg-gradient-to-br from-zinc-800 to-black" },
];

export default function LeftSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={`hidden lg:flex ${isCollapsed ? "w-[80px]" : "w-[320px]"} bg-[#0A0A0A] rounded-xl flex flex-col overflow-hidden transition-all duration-300 ease-in-out`}
    >
      {/* Header */}
      <div className={`p-4 flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="cursor-pointer flex items-center gap-3 text-muted-foreground hover:text-white transition-colors group"
        >
          <Library className="w-6 h-6 group-hover:text-white transition-colors flex-shrink-0" strokeWidth={2} />
          {!isCollapsed && <span className="font-bold text-[15px]">Your Library</span>}
        </button>

        {!isCollapsed && (
          <div className="flex items-center gap-1">
            <button className="cursor-pointer w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-[#1A1A1A] rounded-full transition-colors">
              <Plus className="w-5 h-5" strokeWidth={2} />
            </button>
            <button className="cursor-pointer w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-[#1A1A1A] rounded-full transition-colors">
              <ArrowRight className="w-5 h-5" strokeWidth={2} />
            </button>
          </div>
        )}
      </div>

      {/* Filters & Search (Hidden when collapsed) */}
      {!isCollapsed && (
        <>
          <div className="px-4 pb-2">
            <button className="cursor-pointer bg-white text-black px-3 py-1 rounded-full text-sm font-medium hover:scale-105 transition-transform duration-200">
              Playlists
            </button>
          </div>

          <div className="px-2 flex items-center justify-between py-2 text-muted-foreground">
            <button className="cursor-pointer w-8 h-8 flex items-center justify-center hover:bg-[#1A1A1A] hover:text-white rounded-full transition-colors">
              <Search className="w-4 h-4" strokeWidth={2} />
            </button>
            <button className="cursor-pointer flex items-center gap-2 hover:text-white hover:scale-105 transition-all duration-200">
              <span className="text-sm font-medium">Recents</span>
              <List className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        </>
      )}

      {/* Scrollable list (Playlist Items) */}
      <div className="flex-1 overflow-y-auto scrollbar-none pb-2">
        <div className={`px-2 flex flex-col gap-1 ${isCollapsed ? "items-center" : ""}`}>
          {PLAYLISTS.map((playlist, idx) => (
            <button
              key={playlist.id}
              title={playlist.title}
              className={`cursor-pointer w-full flex ${isCollapsed ? "justify-center" : "items-center gap-3"} p-2 rounded-md transition-colors duration-200 ${idx === 0 ? "bg-[#1A1A1A]" : "hover:bg-[#1A1A1A]"}`}
            >
              <div className={`w-12 h-12 rounded flex-shrink-0 flex items-center justify-center ${playlist.gradient}`}>
                {idx === 0 && <span className="text-white text-lg">♥</span>}
              </div>

              {!isCollapsed && (
                <div className="flex flex-col items-start overflow-hidden">
                  <span className={`text-[15px] font-medium truncate w-full text-left ${idx === 0 ? "text-primary" : "text-white"}`}>
                    {playlist.title}
                  </span>
                  <span className="text-sm text-muted-foreground truncate w-full text-left">
                    {playlist.subtitle}
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}