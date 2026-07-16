// components/center/LyricsView.tsx
"use client";

import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/lib/store";

export default function LyricsView() {
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const currentTime = usePlayerStore((state) => state.currentTime);
  const requestSeek = usePlayerStore((state) => state.requestSeek);

  const activeLineRef = useRef<HTMLButtonElement>(null);

  const activeIndex = currentTrack?.syncedLyrics
    ? currentTrack.syncedLyrics.findIndex((line, i) => {
        const next = currentTrack.syncedLyrics![i + 1];
        return currentTime >= line.time && (!next || currentTime < next.time);
      })
    : -1;

  useEffect(() => {
    activeLineRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeIndex]);

  if (!currentTrack) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        No track playing
      </div>
    );
  }

  const hasSynced = currentTrack.syncedLyrics && currentTrack.syncedLyrics.length > 0;

  return (
    <div className="flex-1 rounded-xl overflow-hidden relative flex flex-col">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${currentTrack.cover})`, filter: "blur(40px)" }}
      />
      <div className="absolute inset-0 bg-black/60" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black" />

      <div className="relative flex items-center gap-4 p-8 pb-4 flex-shrink-0">
        <img src={currentTrack.cover} alt={currentTrack.title} className="w-16 h-16 rounded-md object-cover shadow-lg" />
        <div>
          <h2 className="text-xl font-bold text-white">{currentTrack.title}</h2>
          <p className="text-muted-foreground text-sm">{currentTrack.artist}</p>
        </div>
      </div>

      <div className="relative flex-1 overflow-y-auto overflow-x-hidden scrollbar-none px-8 pb-32">
        {hasSynced ? (
          <div className="max-w-2xl mx-auto space-y-6 py-12">
            {currentTrack.syncedLyrics!.map((line, i) => (
              <button
                key={i}
                ref={i === activeIndex ? activeLineRef : null}
                onClick={() => requestSeek(line.time)}
                className={`block w-full text-left text-3xl font-bold leading-tight transition-all duration-300 hover:text-white/70 ${
                  i === activeIndex ? "text-white scale-105" : "text-white/30"
                }`}
              >
                {line.text}
              </button>
            ))}
          </div>
        ) : currentTrack.lyrics ? (
          <p className="text-white text-2xl leading-relaxed whitespace-pre-line max-w-2xl mx-auto py-12">
            {currentTrack.lyrics}
          </p>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            <p className="font-bold">No lyrics are available for this song.</p>
            <p>Lyrics will appear when they become available.</p>
          </div>
        )}
      </div>
    </div>
  );
}