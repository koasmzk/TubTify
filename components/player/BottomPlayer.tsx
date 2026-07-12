"use client";

import { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Mic2,
  ListMusic,
  MonitorSpeaker,
  Bluetooth,
  Headphones,
  Speaker,
  Volume2,
  Maximize2,
  Heart,
  Check,
  AlertCircle,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { MarqueeText } from "@/components/ui/MarqueeText";
import { usePlayerStore } from "@/lib/store";

function formatTime(seconds: number) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type OutputDevice = {
  deviceId: string;
  label: string;
};

function getDeviceIcon(label: string) {
  const l = label.toLowerCase();
  if (l.includes("bluetooth") || l.includes("airpods") || l.includes("buds") || l.includes("tws")) {
    return Bluetooth;
  }
  if (l.includes("headphone") || l.includes("headset") || l.includes("earphone")) {
    return Headphones;
  }
  return Speaker;
}

function filterOutputDevices(devices: MediaDeviceInfo[]) {
  return devices
    .filter((d) => d.kind === "audiooutput")
    .filter((d) => !d.label.toLowerCase().startsWith("communications"))
    .map((d) => ({
      deviceId: d.deviceId,
      label: d.label || (d.deviceId === "default" ? "System Default" : "Unknown device"),
    }));
}

export default function BottomPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const outputMenuRef = useRef<HTMLDivElement>(null);

  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);
  const showLyrics = usePlayerStore((state) => state.showLyrics);
  const toggleLyrics = usePlayerStore((state) => state.toggleLyrics);
  const setCurrentTrackLyrics = usePlayerStore((state) => state.setCurrentTrackLyrics);
  const setCurrentTrackSyncedLyrics = usePlayerStore((state) => state.setCurrentTrackSyncedLyrics);
  const setCurrentTime = usePlayerStore((state) => state.setCurrentTime);
  const seekRequest = usePlayerStore((state) => state.seekRequest);
  const clearSeekRequest = usePlayerStore((state) => state.clearSeekRequest);
  const playNext = usePlayerStore((state) => state.playNext);
  const playPrevious = usePlayerStore((state) => state.playPrevious);
  const lyricsCache = usePlayerStore((state) => state.lyricsCache);

  const [localTime, setLocalTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(60);

  const [outputSupported, setOutputSupported] = useState(true);
  const [outputDevices, setOutputDevices] = useState<OutputDevice[]>([]);
  const [activeOutputId, setActiveOutputId] = useState<string>("default");
  const [outputMenuOpen, setOutputMenuOpen] = useState(false);
  const [labelsRequested, setLabelsRequested] = useState(false);
  const [outputError, setOutputError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentTrack || !audioRef.current) return;

    audioRef.current.src = `/api/stream?id=${currentTrack.id}`;
    audioRef.current.play().catch((err) => {
      if (err.name !== "AbortError") console.error("Play failed:", err);
    });

    if (currentTrack.id in lyricsCache) return;

    fetch(`/api/lyrics?title=${encodeURIComponent(currentTrack.title)}&artist=${encodeURIComponent(currentTrack.artist)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Lyrics fetch failed: ${res.status}`);
        const text = await res.text();
        return text ? JSON.parse(text) : { lyrics: null, syncedLyrics: null };
      })
      .then((data) => {
        setCurrentTrackLyrics(data.lyrics ?? null);
        setCurrentTrackSyncedLyrics(data.syncedLyrics ?? null);
      })
      .catch((err) => console.error("Lyrics fetch error:", err));
  }, [currentTrack?.id]);

  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.play().catch((err) => {
        if (err.name !== "AbortError") console.error("Play failed:", err);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  useEffect(() => {
    if (seekRequest === null || !audioRef.current) return;
    audioRef.current.currentTime = seekRequest;
    setLocalTime(seekRequest);
    clearSeekRequest();
  }, [seekRequest]);

  // re-apply sinkId setiap kali src audio ganti (browser suka reset sinkId
  // ke default begitu .src di-assign ulang / track baru di-load)
  useEffect(() => {
    const el = audioRef.current as any;
    if (!el?.setSinkId || activeOutputId === "default") return;
    el.setSinkId(activeOutputId)
      .then(() => console.log("[audio-output] re-applied sinkId after track change:", activeOutputId))
      .catch((err: any) => console.warn("[audio-output] re-apply sinkId failed:", err?.name, err?.message));
  }, [currentTrack?.id, activeOutputId]);

  useEffect(() => {
    const el = audioRef.current as any;
    if (typeof el?.setSinkId !== "function" || !navigator.mediaDevices?.enumerateDevices) {
      setOutputSupported(false);
      return;
    }

    const loadDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        setOutputDevices(filterOutputDevices(devices));
      } catch (err) {
        console.warn("Failed to enumerate audio devices:", err);
      }
    };

    loadDevices();

    navigator.mediaDevices.addEventListener("devicechange", loadDevices);
    return () => navigator.mediaDevices.removeEventListener("devicechange", loadDevices);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (outputMenuRef.current && !outputMenuRef.current.contains(e.target as Node)) {
        setOutputMenuOpen(false);
      }
    }
    if (outputMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [outputMenuOpen]);

  // cache permission mic biar getUserMedia gak re-trigger tiap buka dropdown
  // (tiap getUserMedia dipanggil, Windows bisa switch profile Bluetooth ke HFP,
  // yang bikin OS ngunci output audio balik ke TWS meski sinkId di-set ke device lain)
  const requestDeviceLabels = async () => {
    setOutputError(null);

    if (typeof window !== "undefined" && sessionStorage.getItem("wavr_audio_labels_granted") === "1") {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setOutputDevices(filterOutputDevices(devices));
      setLabelsRequested(true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      sessionStorage.setItem("wavr_audio_labels_granted", "1");
      const devices = await navigator.mediaDevices.enumerateDevices();
      setOutputDevices(filterOutputDevices(devices));
      setLabelsRequested(true);
    } catch (err: any) {
      setLabelsRequested(true);

      if (err?.name === "NotAllowedError") {
        setOutputError(
          "Akses mikrofon diblokir. Klik ikon kunci di address bar → set Microphone ke 'Allow', lalu refresh halaman."
        );
      } else if (err?.name === "NotFoundError") {
        setOutputError("Tidak ada perangkat mikrofon terdeteksi di sistem kamu.");
      } else {
        setOutputError(`Gagal meminta izin: ${err?.message ?? "unknown error"}`);
      }

      console.warn("Permission request for device labels failed:", err?.name, err?.message);
    }
  };

  const handleSelectOutput = async (deviceId: string) => {
    const el = audioRef.current as any;
    if (!el?.setSinkId) return;

    if (!deviceId) {
      setOutputError("Device ID tidak valid. Coba klik 'Show names' dulu untuk resolve device.");
      return;
    }

    try {
      await el.setSinkId(deviceId);
      // DEBUG: cek apakah sinkId beneran ke-apply di elemen audio.
      // Kalau ini kepanggil sukses tapi suara TETAP di device lama,
      // berarti ini bukan bug JS — itu OS/driver yang override routing
      // (paling sering karena Bluetooth device masih di HFP/communication profile).
      console.log("[audio-output] setSinkId success. el.sinkId now:", el.sinkId, "target was:", deviceId);
      setActiveOutputId(deviceId);
      setOutputMenuOpen(false);
      setOutputError(null);
    } catch (err: any) {
      console.warn("[audio-output] setSinkId FAILED:", err?.name, err?.message);
      setOutputError("Gagal switch ke device ini. Coba klik 'Show names' dulu untuk resolve device ID.");
    }
  };

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    const newTime = (value[0] / 100) * duration;
    audioRef.current.currentTime = newTime;
    setLocalTime(newTime);
  };

  const activeDevice = outputDevices.find((d) => d.deviceId === activeOutputId);
  const ActiveIcon = activeDevice ? getDeviceIcon(activeDevice.label) : MonitorSpeaker;

  return (
    <footer className="h-[88px] bg-black border-t border-[rgba(255,255,255,0.08)] flex items-center justify-between px-4 shrink-0 z-20">
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => {
          const time = e.currentTarget.currentTime;
          setLocalTime(time);
          setCurrentTime(time);
        }}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => playNext()}
      />

      <div className="flex items-center gap-3 w-1/3 min-w-[180px]">
        <div className="w-14 h-14 rounded bg-gradient-to-br from-red-800 to-neutral-900 flex-shrink-0 shadow-sm relative group cursor-pointer overflow-hidden">
          {currentTrack ? (
            <img src={currentTrack.cover} alt={currentTrack.title} className="w-full h-full object-cover" />
          ) : null}
          <div className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <div className="w-2.5 h-2.5 border-t border-r border-white"></div>
          </div>
        </div>
        <div className="flex flex-col justify-center overflow-hidden mr-2 w-full">
          <MarqueeText
            text={currentTrack?.title ?? "No track playing"}
            className="text-sm font-medium text-white"
          />
          <MarqueeText
            text={currentTrack?.artist ?? "—"}
            className="text-xs text-muted-foreground"
          />
        </div>
        <button className="text-primary hover:scale-105 transition-transform">
          <Heart className="w-4 h-4 fill-current" strokeWidth={2} />
        </button>
      </div>

      <div className="flex flex-col items-center justify-center max-w-[722px] w-1/3">
        <div className="flex items-center gap-5 mb-1">
          <button className="text-muted-foreground hover:text-white transition-colors">
            <Shuffle className="w-4 h-4" strokeWidth={2} />
          </button>
          <button onClick={playPrevious} className="text-muted-foreground hover:text-white transition-colors">
            <SkipBack className="w-5 h-5" strokeWidth={2} fill="currentColor" />
          </button>
          <button
            onClick={togglePlay}
            disabled={!currentTrack}
            className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform text-black shadow-md disabled:opacity-50"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" strokeWidth={2} fill="currentColor" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" strokeWidth={2} fill="currentColor" />
            )}
          </button>
          <button onClick={() => playNext()} className="text-muted-foreground hover:text-white transition-colors">
            <SkipForward className="w-5 h-5" strokeWidth={2} fill="currentColor" />
          </button>
          <button className="text-muted-foreground hover:text-white transition-colors">
            <Repeat className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        <div className="flex items-center gap-2 w-full max-w-md group">
          <span className="text-[11px] font-medium text-muted-foreground min-w-[30px] text-right">
            {formatTime(localTime)}
          </span>
          <Slider
            value={[duration ? (localTime / duration) * 100 : 0]}
            max={100}
            step={1}
            onValueChange={handleSeek}
            className="w-full cursor-pointer h-1"
          />
          <span className="text-[11px] font-medium text-muted-foreground min-w-[30px] text-left">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 w-1/3 min-w-[180px]">
        <button
          onClick={toggleLyrics}
          className={`transition-colors ${showLyrics ? "text-primary" : "text-muted-foreground hover:text-white"}`}
          title="Lyrics"
        >
          <Mic2 className="w-4 h-4" strokeWidth={2} />
        </button>
        <button className="text-primary transition-colors relative" title="Queue">
          <ListMusic className="w-4 h-4" strokeWidth={2} />
        </button>

        <div className="relative" ref={outputMenuRef}>
          <button
            onClick={() => setOutputMenuOpen((v) => !v)}
            disabled={!outputSupported}
            className={`transition-colors ${
              outputMenuOpen ? "text-primary" : "text-muted-foreground hover:text-white"
            } disabled:opacity-40 disabled:cursor-not-allowed`}
            title={outputSupported ? activeDevice?.label ?? "Connect to a device" : "Not supported in this browser"}
          >
            <ActiveIcon className="w-4 h-4" strokeWidth={2} />
          </button>

          {outputMenuOpen && outputSupported && (
            <div className="absolute bottom-full right-0 mb-2 w-72 bg-[#282828] rounded-md shadow-2xl py-2 z-50">
              <div className="flex items-center justify-between px-3 pb-2">
                <p className="text-xs font-bold text-muted-foreground uppercase">Audio Output</p>
                {!labelsRequested && (
                  <button onClick={requestDeviceLabels} className="text-xs text-primary hover:underline flex-shrink-0">
                    Show names
                  </button>
                )}
              </div>

              {outputDevices.length === 0 ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">No devices found</p>
              ) : (
                outputDevices.map((device) => {
                  const Icon = getDeviceIcon(device.label);
                  const isActive = device.deviceId === activeOutputId;
                  return (
                    <button
                      key={device.deviceId || device.label}
                      onClick={() => handleSelectOutput(device.deviceId)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#3a3a3a] transition-colors text-left"
                    >
                      <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" strokeWidth={2} />
                      <MarqueeText
                        text={device.label}
                        className={`text-sm flex-1 ${isActive ? "text-primary" : "text-white"}`}
                      />
                      {isActive && <Check className="w-4 h-4 text-primary flex-shrink-0" strokeWidth={2} />}
                    </button>
                  );
                })
              )}

              {outputError && (
                <div className="flex items-start gap-2 mx-3 mt-2 p-2 rounded bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
                  <p className="text-xs text-red-400 leading-snug">{outputError}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 w-24 group">
          <button className="text-muted-foreground hover:text-white transition-colors">
            <Volume2 className="w-4 h-4" strokeWidth={2} />
          </button>
          <Slider
            value={[volume]}
            max={100}
            step={1}
            onValueChange={(v) => setVolume(v[0])}
            className="w-full cursor-pointer h-1"
          />
        </div>
        <button className="text-muted-foreground hover:text-white transition-colors" title="Full screen">
          <Maximize2 className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>
    </footer>
  );
}