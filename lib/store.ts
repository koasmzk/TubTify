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

type RepeatMode = "off" | "all" | "one";

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

  // --- state baru ---
  isShuffle: boolean;
  repeatMode: RepeatMode;
  showQueue: boolean;
  likedTrackIds: Set<string>;

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

  toggleShuffle: () => void;
  cycleRepeat: () => void;
  toggleQueue: () => void;
  toggleLike: (trackId: string) => void;
};

function enrichWithCache(track: Track, cache: Record<string, LyricsCacheEntry>): Track {
  const cached = cache[track.id];
  if (!cached) return track;
  return { ...track, lyrics: cached.lyrics, syncedLyrics: cached.syncedLyrics };
}

// pilih index random di queue selain queueIndex saat ini (biar gak dobel lagu yang sama)
function pickShuffleIndex(queue: Track[], excludeIndex: number): number {
  if (queue.length <= 1) return 0;
  let idx = Math.floor(Math.random() * queue.length);
  while (idx === excludeIndex) {
    idx = Math.floor(Math.random() * queue.length);
  }
  return idx;
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

  isShuffle: false,
  repeatMode: "off",
  showQueue: false,
  likedTrackIds: new Set(),

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
    const { queue, queueIndex, currentTrack, isFetchingNext, lyricsCache, isShuffle, repeatMode } = get();

    // masih ada slot di queue -> shuffle pilih random index, kalau gak ya next sequential
    const hasMoreInQueue = isShuffle ? queue.length > 1 : queueIndex + 1 < queue.length;
    if (hasMoreInQueue) {
      const nextIndex = isShuffle ? pickShuffleIndex(queue, queueIndex) : queueIndex + 1;
      set({
        currentTrack: enrichWithCache(queue[nextIndex], lyricsCache),
        queueIndex: nextIndex,
        isPlaying: true,
      });
      return;
    }

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
        const newQueue = [...get().queue, ...related];
        const nextIndex = isShuffle ? pickShuffleIndex(newQueue, queueIndex) : newQueue.length - related.length;
        set({
          queue: newQueue,
          queueIndex: nextIndex,
          currentTrack: enrichWithCache(newQueue[nextIndex], freshCache),
          isPlaying: true,
        });
      } else if (repeatMode === "all" && queue.length > 0) {
        // gak ada related lagi -> loop balik ke awal queue
        const nextIndex = isShuffle ? pickShuffleIndex(queue, queueIndex) : 0;
        set({
          currentTrack: enrichWithCache(queue[nextIndex], get().lyricsCache),
          queueIndex: nextIndex,
          isPlaying: true,
        });
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

  toggleShuffle: () => set((state) => ({ isShuffle: !state.isShuffle })),

  cycleRepeat: () =>
    set((state) => {
      const order: RepeatMode[] = ["off", "all", "one"];
      const next = order[(order.indexOf(state.repeatMode) + 1) % order.length];
      return { repeatMode: next };
    }),

  toggleQueue: () => set((state) => ({ showQueue: !state.showQueue })),

  toggleLike: (trackId) =>
    set((state) => {
      const next = new Set(state.likedTrackIds);
      if (next.has(trackId)) next.delete(trackId);
      else next.add(trackId);
      return { likedTrackIds: next };
    }),
}));