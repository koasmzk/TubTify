// components/player/AddToPlaylistButton.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { ListPlus, Plus } from "lucide-react";
import { usePlayerStore } from "@/lib/store";

export default function AddToPlaylistButton() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const playlists = usePlayerStore((s) => s.playlists);
  const addToPlaylist = usePlayerStore((s) => s.addToPlaylist);
  const createPlaylist = usePlayerStore((s) => s.createPlaylist);

  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Tutup popup kalau klik di luar
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
        setStatus(null);
      }
    }
    if (open) document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  async function handleAdd(playlistId: string, playlistName: string) {
    if (!currentTrack) return;
    const result = await addToPlaylist(playlistId, currentTrack);
    setStatus(
      result === "added"
        ? `Added to ${playlistName}`
        : result === "exists"
        ? `Already in ${playlistName}`
        : "Failed to add"
    );
    // Tutup otomatis setelah feedback kelihatan sebentar
    setTimeout(() => {
      setOpen(false);
      setStatus(null);
    }, 1000);
  }

  // Bikin playlist baru sekaligus masukin lagu yang lagi diputar
  async function handleCreate() {
    const clean = name.trim();
    if (!clean || !currentTrack) return;
    const created = await createPlaylist(clean);
    if (!created) {
      setStatus("Failed to create playlist");
      return;
    }
    setName("");
    setCreating(false);
    await handleAdd(created.id, created.name);
  }

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={!currentTrack}
        title="Add to playlist"
        className={`hover:scale-105 transition-transform disabled:opacity-40 ${
          open ? "text-primary" : "text-muted-foreground hover:text-white"
        }`}
      >
        <ListPlus className="w-4 h-4" strokeWidth={2} />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-[#282828] rounded-md shadow-2xl py-2 z-50">
          <p className="px-3 pb-2 text-xs font-bold text-muted-foreground uppercase">Add to playlist</p>

          {creating ? (
            <div className="px-3 pb-2">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") setCreating(false);
                }}
                placeholder="Playlist name"
                className="w-full bg-[#3a3a3a] rounded px-2 py-1.5 text-sm text-white outline-none placeholder:text-muted-foreground"
              />
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#3a3a3a] transition-colors text-left"
            >
              <Plus className="w-4 h-4 text-white" strokeWidth={2} />
              <span className="text-sm text-white">New playlist</span>
            </button>
          )}

          <div className="max-h-60 overflow-y-auto scrollbar-none">
            {playlists.length === 0 && !creating && (
              <p className="px-3 py-2 text-sm text-muted-foreground">No playlists yet</p>
            )}
            {playlists.map((p) => (
              <button
                key={p.id}
                onClick={() => handleAdd(p.id, p.name)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#3a3a3a] transition-colors text-left"
              >
                <span className="text-sm text-white truncate flex-1">{p.name}</span>
                <span className="text-xs text-muted-foreground flex-shrink-0">{p.trackCount}</span>
              </button>
            ))}
          </div>

          {status && <p className="px-3 pt-2 text-xs text-primary">{status}</p>}
        </div>
      )}
    </div>
  );
}