"use client";

import { X, MoreHorizontal, ChevronLeft } from "lucide-react";
import { usePlayerStore } from "@/lib/store";

export default function RightSidebar() {
  const isOpen = usePlayerStore((s) => s.showQueue);
  const toggleQueue = usePlayerStore((s) => s.toggleQueue);

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const queue = usePlayerStore((s) => s.queue);
  const queueIndex = usePlayerStore((s) => s.queueIndex);
  const playTrack = usePlayerStore((s) => s.playTrack);

  const nextTracks = queue.slice(queueIndex + 1);

  if (!isOpen) {
    return (
      <div className="hidden lg:flex w-10 bg-[#0A0A0A] rounded-xl items-center justify-center ml-2">
        <button
          onClick={toggleQueue}
          className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-[#1A1A1A] rounded-full transition-colors"
          aria-label="Buka Queue"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={2} />
        </button>
      </div>
    );
  }

  return (
    <div className="hidden lg:flex w-[300px] bg-[#0A0A0A] rounded-xl flex flex-col overflow-hidden">
      <div className="p-4 flex items-center justify-between">
        <h2 className="font-bold text-[15px] text-white">Queue</h2>
        <div className="flex items-center gap-1">
          <button className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-[#1A1A1A] rounded-full transition-colors">
            <MoreHorizontal className="w-5 h-5" strokeWidth={2} />
          </button>
          <button
            onClick={toggleQueue}
            className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-[#1A1A1A] rounded-full transition-colors"
            aria-label="Tutup Queue"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none px-4 pb-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase mb-3">Now playing</h3>

        {currentTrack ? (
          <button className="w-full flex items-center gap-3 p-2 -mx-2 rounded-md hover:bg-[#1A1A1A] transition-colors duration-200">
            <div className="w-12 h-12 rounded flex-shrink-0 overflow-hidden bg-gradient-to-br from-red-800 to-neutral-900">
              <img src={currentTrack.cover} alt={currentTrack.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col items-start overflow-hidden flex-1">
              <span className="text-[15px] font-medium truncate w-full text-left text-primary">
                {currentTrack.title}
              </span>
              <span className="text-sm text-muted-foreground truncate w-full text-left">
                {currentTrack.artist}
              </span>
            </div>
          </button>
        ) : (
          <p className="text-sm text-muted-foreground">Belum ada lagu yang diputar</p>
        )}

        {nextTracks.length > 0 && (
          <>
            <h3 className="text-xs font-bold text-muted-foreground mt-6 mb-3 truncate">
              Next from: {currentTrack?.title}
            </h3>
            <div className="flex flex-col gap-1 -mx-2">
              {nextTracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => playTrack(track, queue)}
                  className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-[#1A1A1A] transition-colors duration-200 group"
                >
                  <div className="w-12 h-12 rounded flex-shrink-0 overflow-hidden bg-neutral-800">
                    <img src={track.cover} alt={track.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col items-start overflow-hidden flex-1">
                    <span className="text-[15px] font-medium truncate w-full text-left text-white group-hover:text-white transition-colors">
                      {track.title}
                    </span>
                    <span className="text-sm text-muted-foreground truncate w-full text-left group-hover:text-white transition-colors">
                      {track.artist}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}