import TopNav from "@/components/layout/TopNav";
import LeftSidebar from "@/components/sidebar/LeftSidebar";
import RightSidebar from "@/components/sidebar/RightSidebar";
import CenterContent from "@/components/center/CenterContent";
import BottomPlayer from "@/components/player/BottomPlayer";

export default function Home() {
  return (
    <div className="flex flex-col h-screen w-full bg-black text-white overflow-hidden p-2 gap-2">
      <TopNav />
      <div className="flex flex-1 gap-2 min-h-0">
        <LeftSidebar />
        <CenterContent />
        <RightSidebar />
      </div>
      <BottomPlayer />
    </div>
  );
}
