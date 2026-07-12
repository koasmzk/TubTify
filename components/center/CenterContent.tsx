// components/center/CenterContent.tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { usePlayerStore } from "@/lib/store";
import LyricsView from "@/components/center/LyricsView";

const QUICK_ACCESS = [
  { id: 1, title: "Liked Songs", gradient: "bg-gradient-to-br from-indigo-500 to-purple-800" },
  { id: 2, title: "Hope (From 'One Piece')", gradient: "bg-gradient-to-br from-orange-400 to-red-500" },
  { id: 3, title: "Iki epep", gradient: "bg-gradient-to-br from-neutral-700 to-neutral-900" },
  { id: 4, title: "WOW WAR TONIGHT~時には起こせよムーヴ", gradient: "bg-gradient-to-br from-red-800 to-neutral-900" },
  { id: 5, title: "Chennai Express", gradient: "bg-gradient-to-br from-emerald-500 to-teal-700" },
  { id: 6, title: "Daily Mix 2", gradient: "bg-gradient-to-tr from-pink-500 to-orange-400" },
];

const RECOMMENDED = [
  { id: 1, title: "Daily Mix 1", artist: "Made for you", gradient: "bg-gradient-to-br from-emerald-400 to-cyan-500" },
  { id: 2, title: "Discover Weekly", artist: "New music for you", gradient: "bg-gradient-to-bl from-purple-500 to-pink-500" },
  { id: 3, title: "Release Radar", artist: "Catch up on the latest", gradient: "bg-gradient-to-t from-gray-700 to-gray-400" },
  { id: 4, title: "On Repeat", artist: "Songs you love right now", gradient: "bg-gradient-to-br from-orange-500 to-yellow-500" },
  { id: 5, title: "Time Capsule", artist: "Your favorites from the past", gradient: "bg-gradient-to-br from-blue-600 to-indigo-800" },
];

type Track = {
  id: string;
  title: string;
  artist: string;
  cover: string;
  duration: number;
};

export default function CenterContent() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  const playTrack = usePlayerStore((state) => state.playTrack);
  const searchQuery = usePlayerStore((state) => state.searchQuery);
  const showLyrics = usePlayerStore((state) => state.showLyrics);

  useEffect(() => {
    async function fetchTracks() {
      setLoading(true);
      try {
        const q = searchQuery || "top hits 2026";
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setTracks(data.tracks ?? []);
      } catch (err) {
        console.error("Failed to fetch tracks:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTracks();
  }, [searchQuery]);

  // conditional render di JSX, BUKAN early return sebelum hook lain dideklarasi
  return (
    <>
      {showLyrics ? (
        <LyricsView />
      ) : (
        <div className="flex-1 rounded-xl overflow-y-auto scrollbar-none relative group">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#34225f] via-[#111111] to-[#000000] -z-10 h-[332px]" />
          <div className="absolute inset-0 bg-black/60 -z-10 h-[332px]" />

          <div className="p-6 relative z-0">
            {/* Filters */}
            <div className="flex items-center gap-2 mb-6">
              <button className="bg-white text-black px-4 py-1.5 rounded-full text-sm font-medium transition-transform duration-200 hover:scale-105">All</button>
              <button className="bg-[rgba(255,255,255,0.08)] text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-[rgba(255,255,255,0.12)] transition-colors duration-200">Music</button>
              <button className="bg-[rgba(255,255,255,0.08)] text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-[rgba(255,255,255,0.12)] transition-colors duration-200">Podcasts</button>
            </div>

            {/* Quick Access Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
              {QUICK_ACCESS.map((item) => (
                <motion.button
                  whileHover={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                  transition={{ duration: 0.2 }}
                  key={item.id}
                  className="bg-[rgba(255,255,255,0.08)] rounded-lg flex items-center h-[60px] overflow-hidden group/card shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                >
                  <div className={`w-[60px] h-[60px] flex-shrink-0 ${item.gradient} shadow-[4px_0_12px_rgba(0,0,0,0.3)]`}></div>
                  <div className="flex-1 px-4 text-left">
                    <span className="text-[15px] font-bold text-white truncate block max-w-full leading-tight">{item.title}</span>
                  </div>
                  <div className="pr-4 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg transform translate-y-2 group-hover/card:translate-y-0 transition-transform duration-300">
                      <div className="w-0 h-0 border-t-[7px] border-t-transparent border-l-[12px] border-l-black border-b-[7px] border-b-transparent ml-1"></div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* From YouTube section */}
            <section className="mb-10">
              <div className="flex items-end justify-between mb-4">
                <h2 className="text-2xl font-bold text-white hover:underline cursor-pointer">
                  {searchQuery ? `Results for "${searchQuery}"` : "From YouTube"}
                </h2>
                <button className="text-sm font-bold text-muted-foreground hover:underline">Show all</button>
              </div>

              {loading ? (
                <p className="text-muted-foreground text-sm">Loading tracks...</p>
              ) : (
                <div className="flex gap-6 overflow-x-auto scrollbar-none pb-4 -mx-6 px-6">
                  {tracks.map((track) => (
                    <motion.div
                      key={track.id}
                      whileHover={{ scale: 1.02 }}
                      className="bg-[#181818] p-4 rounded-xl hover:bg-[#282828] transition-colors duration-300 cursor-pointer w-[212px] flex-shrink-0 group"
                      onClick={() => playTrack(track, tracks)}
                    >
                      <div className="w-full aspect-square rounded-md mb-4 shadow-[0_8px_24px_rgba(0,0,0,0.5)] relative overflow-hidden">
                        <img src={track.cover} alt={track.title} className="w-full h-full object-cover" />
                        <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-xl">
                            <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-black border-b-[8px] border-b-transparent ml-1"></div>
                          </div>
                        </div>
                      </div>
                      <h3 className="font-bold text-white mb-1 truncate">{track.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-tight">{track.artist}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>

            {/* Pre-save section */}
            <section className="mb-10">
              <div className="flex items-end justify-between mb-4">
                <h2 className="text-2xl font-bold text-white hover:underline cursor-pointer">Pre-save upcoming releases</h2>
                <button className="text-sm font-bold text-muted-foreground hover:underline">Show all</button>
              </div>
              <div className="flex gap-6">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-[#181818] p-4 rounded-xl hover:bg-[#282828] transition-colors duration-300 cursor-pointer w-[212px] group"
                >
                  <div className="w-full aspect-square bg-gradient-to-b from-pink-300 to-rose-500 rounded-md mb-4 shadow-[0_8px_24px_rgba(0,0,0,0.5)] relative">
                    <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-xl">
                        <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-black border-b-[8px] border-b-transparent ml-1"></div>
                      </div>
                    </div>
                  </div>
                  <h3 className="font-bold text-white mb-1 truncate">petal</h3>
                  <p className="text-sm text-muted-foreground truncate mb-1">Ariana Grande</p>
                  <span className="inline-block mt-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border border-muted-foreground rounded-sm px-1.5 py-0.5">Pre-save</span>
                </motion.div>
              </div>
            </section>

            {/* Recommended section */}
            <section className="mb-10">
              <div className="flex items-end justify-between mb-4">
                <h2 className="text-2xl font-bold text-white hover:underline cursor-pointer">Recommended for today</h2>
                <button className="text-sm font-bold text-muted-foreground hover:underline">Show all</button>
              </div>
              <div className="flex gap-6 overflow-x-auto scrollbar-none pb-4 -mx-6 px-6">
                {RECOMMENDED.map((item) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ scale: 1.02 }}
                    className="bg-[#181818] p-4 rounded-xl hover:bg-[#282828] transition-colors duration-300 cursor-pointer w-[212px] flex-shrink-0 group"
                  >
                    <div className={`w-full aspect-square ${item.gradient} rounded-md mb-4 shadow-[0_8px_24px_rgba(0,0,0,0.5)] relative`}>
                      <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-xl">
                          <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-black border-b-[8px] border-b-transparent ml-1"></div>
                        </div>
                      </div>
                    </div>
                    <h3 className="font-bold text-white mb-1 truncate">{item.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-tight">{item.artist}</p>
                  </motion.div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}
    </>
  );
}