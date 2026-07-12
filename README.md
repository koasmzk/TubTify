# TubTify

A pixel-perfect Spotify-inspired desktop music streaming UI built with Next.js 15, streaming audio pulled via `yt-dlp`.

## Tech Stack

- **Next.js 15** — App Router
- **Tailwind CSS v4** — via `@tailwindcss/postcss`
- **Framer Motion** — hover animations
- **Radix UI** — accessible Slider primitive
- **Zustand** — global player state (queue, playback, lyrics cache)
- **yt-dlp** + **bgutil-ytdlp-pot-provider** — audio streaming backend
- **Musixmatch** — synced lyrics (LRC)
- **Lucide React** — icons
- **TypeScript**

## Prerequisites

- Node.js 18+
- [`yt-dlp.exe`](https://github.com/yt-dlp/yt-dlp/releases) — download and place in `bin/yt-dlp.exe` (not included in repo)
- [`bgutil-ytdlp-pot-provider`](https://github.com/Brainicism/bgutil-ytdlp-pot-provider) — cloned and built separately (runs as a standalone PO Token provider server)

## Getting Started

This app needs **two terminals** running at the same time in development: the PO Token provider (required for `yt-dlp` to fetch streams reliably) and the Next.js dev server.

**Terminal 1 — PO Token provider** (keep running throughout dev)

First-time setup (clone + build, only needed once):
```bash
git clone https://github.com/Brainicism/bgutil-ytdlp-pot-provider
cd bgutil-ytdlp-pot-provider/server
npm install
npm run build
```

Then, every time you develop:
```bash
cd bgutil-ytdlp-pot-provider/server
node build/main.js
```

**Terminal 2 — Next.js dev server**
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> The PO Token provider must be running on its expected port (default `4416`) before starting playback, or stream requests to `yt-dlp` may fail or get rate-limited.

## Project Structure

```
app/
  layout.tsx       # Root layout (sets dark class, imports globals.css)
  page.tsx         # Home page
  globals.css      # Global styles + CSS variables
  api/
    stream/        # Audio streaming proxy (yt-dlp + Range header support)
    lyrics/        # Musixmatch synced lyrics fetch
    search/        # Search endpoint
components/
  layout/
    TopNav.tsx     # Top navigation bar
  center/
    CenterContent.tsx  # Main scrollable content area
    LyricsView.tsx      # Synced lyrics view with auto-scroll + seek-on-click
  sidebar/
    LeftSidebar.tsx    # Your Library sidebar
    RightSidebar.tsx   # Queue sidebar
  player/
    BottomPlayer.tsx   # Fixed bottom player bar (playback, output device picker)
  ui/
    slider.tsx     # Radix UI Slider wrapper
    MarqueeText.tsx
lib/
  store.ts         # Zustand store — playback, queue, lyrics cache
  utils.ts         # cn() utility for className merging
  usePalette.ts     # Canvas-based dominant color extraction
  ytdlp.ts          # yt-dlp wrapper
  musixmatch.ts     # Musixmatch API client
bin/
  yt-dlp.exe        # (not tracked — download manually, see Prerequisites)
```

## Build for Production

```bash
npm run build
npm run start
```

## Credits

This project relies on the following open-source tools for audio streaming and metadata:

- [**yt-dlp**](https://github.com/yt-dlp/yt-dlp) — audio extraction and streaming backend
- [**bgutil-ytdlp-pot-provider**](https://github.com/Brainicism/bgutil-ytdlp-pot-provider) — PO Token provider used alongside `yt-dlp` to keep streaming reliable
- [**Musixmatch**](https://www.musixmatch.com/) — synced lyrics data

This is an independent, non-commercial project and is not affiliated with or endorsed by Spotify, YouTube, or Musixmatch.
