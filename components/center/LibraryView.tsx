// components/center/LibraryView.tsx
"use client";

import { useEffect, useState } from "react";
import { Play, Heart, Pencil, Trash2, X, Music } from "lucide-react";
import { usePlayerStore, type Track } from "@/lib/store";

// Bentuk baris dari DB (tabel Like / PlaylistTrack)
type Row = {
  videoId: string;
  title: string;
  artist: string;
  cover: string | null;
  duration: number;
};

// DB pakai "videoId", player pakai "id" -> konversi di satu tempat
function toTrack(r: Row): Track {
  return { id: r.videoId, title: r.title, artist: r.artist, cover: r.cover ?? "", duration: r.duration };
}

function formatTime(seconds: number) {
  if (!seconds || isNaN(seconds)) return ""; // lagu lama (duration 0) -> kosong aja
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function LibraryView() {
  const activeView = usePlayerStore((s) => s.activeView);
  const playlists = usePlayerStore((s) => s.playlists);
  const likedTrackIds = usePlayerStore((s) => s.likedTrackIds);
  const likesVersion = usePlayerStore((s) => s.likesVersion);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const toggleLike = usePlayerStore((s) => s.toggleLike);
  const renamePlaylist = usePlayerStore((s) => s.renamePlaylist);
  const deletePlaylist = usePlayerStore((s) => s.deletePlaylist);
  const loadPlaylists = usePlayerStore((s) => s.loadPlaylists);

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const isLikedView = activeView.type === "liked";
  const playlistId = activeView.type === "playlist" ? activeView.id : null;
  const playlist = playlists.find((p) => p.id === playlistId);
  const title = isLikedView ? "Liked Songs" : playlist?.name ?? "Playlist";

  // Pindah view -> kosongin dulu biar nggak nampilin lagu view sebelumnya
  useEffect(() => {
    setRows([]);
    setLoading(true);
  }, [isLikedView, playlistId]);

  // Ambil data dari DB. Refetch kalau: view ganti, like selesai disimpan, atau playlist berubah
  // (mis. lagu ditambah lewat tombol di player).
  useEffect(() => {
    const url = isLikedView ? "/api/likes" : playlistId ? `/api/playlists/${playlistId}` : null;
    if (!url) return;

    let cancelled = false;
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setRows(isLikedView ? data : data.tracks);
      })
      .catch((err) => console.error("Library fetch failed:", err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isLikedView, playlistId, likesVersion, playlists]);

  // Di Liked view: lagu yang barusan di-unlike langsung hilang (nggak nunggu fetch)
  const visibleRows = isLikedView ? rows.filter((r) => likedTrackIds.has(r.videoId)) : rows;
  const tracks = visibleRows.map(toTrack);

  async function removeFromPlaylist(videoId: string) {
    if (!playlistId) return;
    setRows((prev) => prev.filter((r) => r.videoId !== videoId)); // optimistic
    await fetch(`/api/playlists/${playlistId}/tracks?videoId=${encodeURIComponent(videoId)}`, {
      method: "DELETE",
    }).catch(console.error);
    loadPlaylists(); // update jumlah lagu di sidebar
  }

  function handleRename() {
    if (!playlistId) return;
    const n = window.prompt("Rename playlist", title);
    if (n && n.trim()) renamePlaylist(playlistId, n);
  }

  function handleDelete() {
    if (!playlistId) return;
    if (window.confirm(`Delete "${title}"?`)) deletePlaylist(playlistId);
  }

  return (
    <div className="flex-1 rounded-xl overflow-y-auto overflow-x-hidden scrollbar-none relative z-0">
      {/* Gradient header, gaya sama kayak CenterContent */}
      <div
        className="absolute inset-0 -z-10 h-[332px]"
        style={{
          background: `radial-gradient(ellipse 100% 80% at 15% 0%, ${
            isLikedView ? "#4a2d7a" : "#2d5f7a"
          } 0%, #111111 55%, #000000 100%)`,
        }}
      />

      <div className="p-6">
        {/* Header: cover + judul + jumlah lagu */}
        <div className="flex items-end gap-6 mb-6">
          <div
            className={`w-[160px] h-[160px] rounded-md shadow-[0_8px_24px_rgba(0,0,0,0.5)] overflow-hidden flex-shrink-0 flex items-center justify-center ${
              isLikedView ? "bg-gradient-to-br from-indigo-500 to-purple-800" : "bg-[#282828]"
            }`}
          >
            {isLikedView ? (
              <Heart className="w-16 h-16 text-white" fill="currentColor" />
            ) : playlist?.cover ? (
              <img src={playlist.cover} alt={title} className="w-full h-full object-cover" />
            ) : (
              <Music className="w-16 h-16 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase text-white">Playlist</p>
            <h1 className="text-5xl font-extrabold text-white truncate py-2">{title}</h1>
            <p className="text-sm text-muted-foreground">
              {tracks.length} {tracks.length === 1 ? "song" : "songs"}
            </p>
          </div>
        </div>

        {/* Aksi: play all + rename/delete (khusus playlist) */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => tracks.length > 0 && playTrack(tracks[0], tracks)}
            disabled={tracks.length === 0}
            className="w-14 h-14 rounded-full bg-primary flex items-center justify-center hover:scale-105 transition-transform shadow-xl disabled:opacity-40"
            title="Play"
          >
            <Play className="w-6 h-6 ml-0.5 text-black" fill="currentColor" />
          </button>
          {playlistId && (
            <>
              <button onClick={handleRename} title="Rename" className="text-muted-foreground hover:text-white transition-colors">
                <Pencil className="w-5 h-5" />
              </button>
              <button onClick={handleDelete} title="Delete playlist" className="text-muted-foreground hover:text-white transition-colors">
                <Trash2 className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Daftar lagu */}
        {loading && rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : tracks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {isLikedView
              ? "No liked songs yet. Tap the heart on a song to add it here."
              : "This playlist is empty. Use the + button in the player to add the current song."}
          </p>
        ) : (
          <div className="flex flex-col">
            {visibleRows.map((r, i) => {
              const isCurrent = currentTrack?.id === r.videoId;
              return (
                <div
                  key={r.videoId}
                  onClick={() => playTrack(toTrack(r), tracks)}
                  className="group grid grid-cols-[32px_1fr_auto_auto] items-center gap-4 px-3 py-2 rounded-md hover:bg-[rgba(255,255,255,0.1)] cursor-pointer transition-colors"
                >
                  <span className={`text-sm text-center ${isCurrent ? "text-primary" : "text-muted-foreground"}`}>
                    {i + 1}
                  </span>

                  <div className="flex items-center gap-3 min-w-0">
                    <img src={r.cover ?? ""} alt={r.title} className="w-10 h-10 rounded object-cover flex-shrink-0 bg-[#282828]" />
                    <div className="min-w-0">
                      <p className={`text-[15px] font-medium truncate ${isCurrent ? "text-primary" : "text-white"}`}>
                        {r.title}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">{r.artist}</p>
                    </div>
                  </div>

                  <span className="text-sm text-muted-foreground">{formatTime(r.duration)}</span>

                  {/* stopPropagation: klik tombol ini jangan ikut mutar lagu */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isLikedView) toggleLike(r.videoId, toTrack(r));
                      else removeFromPlaylist(r.videoId);
                    }}
                    title={isLikedView ? "Remove from Liked Songs" : "Remove from playlist"}
                    className="text-muted-foreground hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {isLikedView ? (
                      <Heart className="w-4 h-4 text-primary" fill="currentColor" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}