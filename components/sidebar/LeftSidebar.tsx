// components/sidebar/LeftSidebar.tsx
"use client";

import { useState } from "react";
import { Library, Plus, ArrowRight, Search, List, Music } from "lucide-react";
import { usePlayerStore } from "@/lib/store";

export default function LeftSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const likedCount = usePlayerStore((s) => s.likedTrackIds.size);
  const playlists = usePlayerStore((s) => s.playlists);
  const activeView = usePlayerStore((s) => s.activeView);
  const setActiveView = usePlayerStore((s) => s.setActiveView);
  const createPlaylist = usePlayerStore((s) => s.createPlaylist);

  const likedActive = activeView.type === "liked";

  // Bikin playlist baru lalu langsung buka halamannya
  async function handleCreate() {
    const clean = newName.trim();
    setNewName("");
    setCreating(false);
    if (!clean) return;
    const created = await createPlaylist(clean);
    if (created) setActiveView({ type: "playlist", id: created.id });
  }

  const rowClass = (active: boolean) =>
    `cursor-pointer w-full flex ${isCollapsed ? "justify-center" : "items-center gap-3"} p-2 rounded-md transition-colors duration-200 ${
      active ? "bg-[#1A1A1A]" : "hover:bg-[#1A1A1A]"
    }`;

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
            <button
              onClick={() => setCreating(true)}
              title="Create playlist"
              className="cursor-pointer w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-[#1A1A1A] rounded-full transition-colors"
            >
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

          {/* Input bikin playlist: Enter = simpan, Esc / klik luar = batal */}
          {creating && (
            <div className="px-4 pb-2">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") {
                    setCreating(false);
                    setNewName("");
                  }
                }}
                onBlur={() => {
                  setCreating(false);
                  setNewName("");
                }}
                placeholder="Playlist name"
                className="w-full bg-[#1A1A1A] rounded px-3 py-2 text-sm text-white outline-none placeholder:text-muted-foreground"
              />
            </div>
          )}
        </>
      )}

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto scrollbar-none pb-2">
        <div className={`px-2 flex flex-col gap-1 ${isCollapsed ? "items-center" : ""}`}>
          {/* Liked Songs (selalu ada di atas) */}
          <button
            title="Liked Songs"
            onClick={() => setActiveView({ type: "liked" })}
            className={rowClass(likedActive)}
          >
            <div className="w-12 h-12 rounded flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-800">
              <span className="text-white text-lg">♥</span>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col items-start overflow-hidden">
                <span className={`text-[15px] font-medium truncate w-full text-left ${likedActive ? "text-primary" : "text-white"}`}>
                  Liked Songs
                </span>
                <span className="text-sm text-muted-foreground truncate w-full text-left">
                  Playlist • {likedCount} {likedCount === 1 ? "song" : "songs"}
                </span>
              </div>
            )}
          </button>

          {/* Playlist user dari DB */}
          {playlists.map((p) => {
            const active = activeView.type === "playlist" && activeView.id === p.id;
            return (
              <button
                key={p.id}
                title={p.name}
                onClick={() => setActiveView({ type: "playlist", id: p.id })}
                className={rowClass(active)}
              >
                <div className="w-12 h-12 rounded flex-shrink-0 flex items-center justify-center bg-[#282828] overflow-hidden">
                  {p.cover ? (
                    <img src={p.cover} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <Music className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                {!isCollapsed && (
                  <div className="flex flex-col items-start overflow-hidden">
                    <span className={`text-[15px] font-medium truncate w-full text-left ${active ? "text-primary" : "text-white"}`}>
                      {p.name}
                    </span>
                    <span className="text-sm text-muted-foreground truncate w-full text-left">
                      Playlist • {p.trackCount} {p.trackCount === 1 ? "song" : "songs"}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}