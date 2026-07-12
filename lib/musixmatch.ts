// lib/musixmatch.ts
const BASE_URL = "https://apic-desktop.musixmatch.com/ws/1.1";
const APP_ID = "web-desktop-app-v1.0";

let cachedToken: string | null = null;
let cachedAt = 0;
const TOKEN_TTL = 1000 * 60 * 60; // 1 jam

async function getUserToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now - cachedAt < TOKEN_TTL) return cachedToken;

  const res = await fetch(`${BASE_URL}/token.get?app_id=${APP_ID}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  const data = await res.json();
  const token = data?.message?.body?.user_token;

  if (!token) throw new Error("Failed to get Musixmatch token");

  cachedToken = token;
  cachedAt = now;
  return token;
}

export async function matchTrack(title: string, artist: string) {
  const token = await getUserToken();

  const url = `${BASE_URL}/matcher.track.get?q_track=${encodeURIComponent(title)}&q_artist=${encodeURIComponent(artist)}&app_id=${APP_ID}&usertoken=${token}`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  const data = await res.json();

  const track = data?.message?.body?.track;
  if (!track) return null;

  return {
    trackId: track.track_id,
    title: track.track_name,
    artist: track.artist_name,
    album: track.album_name,
    hasLyrics: track.has_lyrics === 1,
  };
}

export async function getLyrics(trackId: number) {
  const token = await getUserToken();

  const url = `${BASE_URL}/track.lyrics.get?track_id=${trackId}&app_id=${APP_ID}&usertoken=${token}`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  const data = await res.json();

  const lyrics = data?.message?.body?.lyrics?.lyrics_body;
  return lyrics ?? null;
}

export type LyricLine = { time: number; text: string };

// parse format LRC: "[00:12.34]Lirik baris ini"
function parseLRC(lrc: string): LyricLine[] {
  const lines = lrc.split("\n");
  const result: LyricLine[] = [];

  for (const line of lines) {
    const match = line.match(/\[(\d+):(\d+\.\d+)\](.*)/);
    if (!match) continue;
    const minutes = parseInt(match[1]);
    const seconds = parseFloat(match[2]);
    const text = match[3].trim();
    if (text) result.push({ time: minutes * 60 + seconds, text });
  }

  return result.sort((a, b) => a.time - b.time);
}

export async function getSyncedLyrics(trackId: number): Promise<LyricLine[] | null> {
  const token = await getUserToken();

  const url = `${BASE_URL}/track.subtitle.get?track_id=${trackId}&subtitle_format=lrc&app_id=${APP_ID}&usertoken=${token}`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  const data = await res.json();

  const lrcBody = data?.message?.body?.subtitle?.subtitle_body;
  if (!lrcBody) return null;

  return parseLRC(lrcBody);
}

export async function enrichTrack(title: string, artist: string) {
  try {
    const match = await matchTrack(title, artist);
    if (!match) return { album: undefined, lyrics: null, syncedLyrics: null };

    const lyrics = match.hasLyrics ? await getLyrics(match.trackId) : null;
    const syncedLyrics = match.hasLyrics ? await getSyncedLyrics(match.trackId) : null;

    return { album: match.album, lyrics, syncedLyrics };
  } catch (err) {
    console.error("Musixmatch enrich failed:", err);
    return { album: undefined, lyrics: null, syncedLyrics: null };
  }
}