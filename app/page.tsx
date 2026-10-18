"use client";

import { useEffect } from "react";
import TopNav from "@/components/layout/TopNav";
import LeftSidebar from "@/components/sidebar/LeftSidebar";
import RightSidebar from "@/components/sidebar/RightSidebar";
import CenterContent from "@/components/center/CenterContent";
import BottomPlayer from "@/components/player/BottomPlayer";
import LyricsView from "@/components/center/LyricsView";
import { usePlayerStore } from "@/lib/store";

export default function Home() {
  const isImmersive = usePlayerStore((state) => state.isImmersive);
  const loadLikes = usePlayerStore((state) => state.loadLikes);
  const loadPlaylists = usePlayerStore((state) => state.loadPlaylists); // NEW

  // Sekali pas app dibuka: ambil liked songs + daftar playlist user dari DB
  useEffect(() => {
    loadLikes();
    loadPlaylists(); // NEW
  }, [loadLikes, loadPlaylists]);

  return (
    <div className="flex flex-col h-screen w-full bg-black text-white overflow-hidden">
      {isImmersive ? (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <LyricsView />
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0 p-2 gap-2">
          <TopNav />
          <div className="flex flex-1 gap-2 min-h-0">
            <LeftSidebar />
            <CenterContent />
            <RightSidebar />
          </div>
        </div>
      )}
      <BottomPlayer />
    </div>
  );
}