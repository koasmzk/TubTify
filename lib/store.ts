import { create } from "zustand";

export type LyricLine = { time: number; text: string };

export type Track = {
  id: string;
  title: string;
  artist: string;
  cover: string;
  duration: number;
  album?: string;
  lyrics?: string | null;
  syncedLyrics?: LyricLine[] | null;
};

type LyricsCacheEntry = {
  lyrics: string | null;
  syncedLyrics: LyricLine[] | null;
};

type PlayerState = {
  currentTrack: Track | null;
  isPlaying: boolean;
  queue: Track[];
  queueIndex: number;
  isFetchingNext: boolean;
  searchQuery: string;
  showLyrics: boolean;
  currentTime: number;
  seekRequest: number | null;
  lyricsCache: Record<string, LyricsCacheEntry>;

  playTrack: (track: Track, queue?: Track[]) => void;
  playNext: () => Promise<void>;
  playPrevious: () => void;
  togglePlay: () => void;
  setIsPlaying: (val: boolean) => void;
  setSearchQuery: (q: string) => void;
  toggleLyrics: () => void;
  setCurrentTrackLyrics: (lyrics: string | null) => void;
  setCurrentTrackSyncedLyrics: (synced: LyricLine[] | null) => void;
  setCurrentTime: (time: number) => void;
  requestSeek: (time: number) => void;
  clearSeekRequest: () => void;
};

// setiap kali currentTrack diganti (dari queue, related, dsb), cek dulu
// apakah lirik-nya udah pernah kita fetch sebelumnya -> pakai dari cache
// biar gak balik "No lyrics available" padahal sebenarnya udah pernah ke-resolve
function enrichWithCache(track: Track, cache: Record<string, LyricsCacheEntry>): Track {
  const cached = cache[track.id];
  if (!cached) return track;
  return { ...track, lyrics: cached.lyrics, syncedLyrics: cached.syncedLyrics };
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  queue: [],
  queueIndex: -1,
  isFetchingNext: false,
  searchQuery: "",
  showLyrics: false,
  currentTime: 0,
  seekRequest: null,
  lyricsCache: {},

  playTrack: (track, queue = []) => {
    const { lyricsCache } = get();
    const idx = queue.findIndex((t) => t.id === track.id);
    set({
      currentTrack: enrichWithCache(track, lyricsCache),
      isPlaying: true,
      queue,
      queueIndex: idx === -1 ? 0 : idx,
    });
  },

  playNext: async () => {
    const { queue, queueIndex, currentTrack, isFetchingNext, lyricsCache } = get();
    const nextIndex = queueIndex + 1;

    // masih ada lagu tersisa di queue saat ini -> langsung next
    if (nextIndex < queue.length) {
      set({
        currentTrack: enrichWithCache(queue[nextIndex], lyricsCache),
        queueIndex: nextIndex,
        isPlaying: true,
      });
      return;
    }

    // queue habis -> ambil rekomendasi related (mix) dari /api/related
    if (!currentTrack || isFetchingNext) return;
    set({ isFetchingNext: true });
    try {
      const res = await fetch(
        `/api/related?id=${currentTrack.id}&artist=${encodeURIComponent(currentTrack.artist)}`
      );
      const data = await res.json();
      const related: Track[] = data.tracks ?? [];

      if (related.length > 0) {
        const freshCache = get().lyricsCache;
        set((state) => ({
          queue: [...state.queue, ...related],
          queueIndex: nextIndex,
          currentTrack: enrichWithCache(related[0], freshCache),
          isPlaying: true,
        }));
      } else {
        set({ isPlaying: false });
      }
    } catch (err) {
      console.error("Failed to fetch related tracks:", err);
      set({ isPlaying: false });
    } finally {
      set({ isFetchingNext: false });
    }
  },

  playPrevious: () => {
    const { queue, queueIndex, lyricsCache } = get();
    const prevIndex = queueIndex - 1;
    if (prevIndex >= 0) {
      set({
        currentTrack: enrichWithCache(queue[prevIndex], lyricsCache),
        queueIndex: prevIndex,
        isPlaying: true,
      });
    }
  },

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setIsPlaying: (val) => set({ isPlaying: val }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  toggleLyrics: () => set((state) => ({ showLyrics: !state.showLyrics })),

  setCurrentTrackLyrics: (lyrics) =>
    set((state) => {
      if (!state.currentTrack) return {};
      const id = state.currentTrack.id;
      return {
        currentTrack: { ...state.currentTrack, lyrics },
        lyricsCache: {
          ...state.lyricsCache,
          [id]: {
            lyrics,
            syncedLyrics: state.lyricsCache[id]?.syncedLyrics ?? state.currentTrack.syncedLyrics ?? null,
          },
        },
      };
    }),

  setCurrentTrackSyncedLyrics: (synced) =>
    set((state) => {
      if (!state.currentTrack) return {};
      const id = state.currentTrack.id;
      return {
        currentTrack: { ...state.currentTrack, syncedLyrics: synced },
        lyricsCache: {
          ...state.lyricsCache,
          [id]: {
            lyrics: state.lyricsCache[id]?.lyrics ?? state.currentTrack.lyrics ?? null,
            syncedLyrics: synced,
          },
        },
      };
    }),

  setCurrentTime: (time) => set({ currentTime: time }),
  requestSeek: (time) => set({ seekRequest: time }),
  clearSeekRequest: () => set({ seekRequest: null }),
}));