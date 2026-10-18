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

  useEffect(() => {
    loadLikes();
  }, [loadLikes]);

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