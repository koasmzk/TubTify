// lib/lrclib.ts
export type SyncedLine = { time: number; text: string };

export function cleanTitle(raw: string): string {
  return raw
    .replace(/\(.*?\)|\[.*?\]/g, "")
    .replace(/\b(official|audio|video|music|lyrics?|hd|4k|mv)\b/gi, "")
    .replace(/\b(ft|feat)\.?.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseLrc(lrc: string): SyncedLine[] {
  return lrc
    .split("\n")
    .map((line) => {
      const m = line.match(/^\[(\d+):(\d+(?:\.\d+)?)\]\s*(.*)$/);
      if (!m) return null;
      return { time: Number(m[1]) * 60 + Number(m[2]), text: m[3].trim() };
    })
    .filter((l): l is SyncedLine => !!l && l.text !== "");
}

type LrclibResult = { syncedLyrics?: string | null; plainLyrics?: string | null };

export async function getLrclibLyrics(
  title: string,
  artist?: string
): Promise<{ syncedLyrics: SyncedLine[] | null; lyrics: string | null } | null> {
  const track = cleanTitle(title).replace(/^.*?\s-\s/, "");
  const q = new URLSearchParams({ q: artist ? `${track} ${artist}` : track });

  const res = await fetch(`https://lrclib.net/api/search?${q}`, {
    headers: { "User-Agent": "TubTify (personal project)" },
    signal: AbortSignal.timeout(5000), 
  });
  if (!res.ok) return null;

  const results: LrclibResult[] = await res.json();
  const hit = results.find((r) => r.syncedLyrics) ?? results.find((r) => r.plainLyrics);
  if (!hit) return null;

  const synced = hit.syncedLyrics ? parseLrc(hit.syncedLyrics) : [];
  return {
    syncedLyrics: synced.length > 0 ? synced : null,
    lyrics: hit.plainLyrics ?? null,
  };
}