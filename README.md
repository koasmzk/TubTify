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

- Node.js 18.18+ (required by Next.js 15)
- [`yt-dlp.exe`](https://github.com/yt-dlp/yt-dlp/releases) — download and place in `bin/yt-dlp.exe` (not included in repo)
- [`bgutil-ytdlp-pot-provider`](https://github.com/Brainicism/bgutil-ytdlp-pot-provider) — needs **two parts**: the standalone server (Terminal 1) and the yt-dlp plugin (see setup below). Both must be the **same version**.

## Setup

### 1. PO Token provider server (one-time)

```bash
git clone https://github.com/Brainicism/bgutil-ytdlp-pot-provider
cd bgutil-ytdlp-pot-provider
git checkout 1.3.1          # pick a release tag, use the same one for the plugin
cd server
npm install
npm run build
```

### 2. yt-dlp plugin (one-time)

yt-dlp only loads plugins from a specific folder structure. Copy **only** the `yt_dlp_plugins` folder from the cloned repo's `plugin/` directory into `bin/`:

```
bin/
├─ yt-dlp.exe
└─ yt-dlp-plugins/
   └─ bgutil-ytdlp-pot-provider/
      └─ yt_dlp_plugins/      <- this folder must sit directly here
         └─ extractor/
```

Example (git bash, from this project's root):
```bash
mkdir -p bin/yt-dlp-plugins/bgutil-ytdlp-pot-provider
cp -r /path/to/bgutil-ytdlp-pot-provider/plugin/yt_dlp_plugins bin/yt-dlp-plugins/bgutil-ytdlp-pot-provider/
```

Verify the plugin loads:
```powershell
./bin/yt-dlp.exe -v -g -f bestaudio "https://youtube.com/watch?v=dQw4w9WgXcQ" 2>&1 | Select-String "Plugin directories|PO Token Providers"
```
You should see `bgutil:http-<version> (external)` in the providers list.

## Getting Started

This app needs **two terminals** running at the same time in development.

**Terminal 1 — PO Token provider** (keep running throughout dev)
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

## Keeping yt-dlp Updated

YouTube changes its internals constantly, so `yt-dlp` releases updates almost weekly. An outdated binary is the **#1 cause of `403` errors** on `/api/stream` (the player then shows `NotSupportedError: Failed to load because no supported source was found`).

Update every few weeks, or immediately when streams start failing:
```powershell
./bin/yt-dlp.exe -U
```
If `-U` fails, download the latest `yt-dlp.exe` from the [releases page](https://github.com/yt-dlp/yt-dlp/releases/latest) and replace `bin/yt-dlp.exe`. Update the bgutil server and plugin together when you do (keep both on the same version).

## Troubleshooting

**`/api/stream` returns 403 / "no supported source was found"**
1. Update yt-dlp (see above). Check this first.
2. Make sure the PO Token server is running (`node build/main.js`, port `4416`).
3. Make sure the plugin is loaded. Run yt-dlp with `-v` and look for `Plugin directories: ...bgutil-ytdlp-pot-provider\yt_dlp_plugins`. If missing, your folder structure is wrong (see Setup step 2).
4. Make sure the server and plugin versions match.
5. Test yt-dlp directly, outside Next.js:
   ```powershell
   ./bin/yt-dlp.exe -v -g -f bestaudio "https://youtube.com/watch?v=<VIDEO_ID>"
   ```
   If this works but the app still 403s, the problem is in `app/api/stream/route.ts` (headers / how the stream is proxied).

**Plugin shows `script-node ... unavailable` in the log**
Normal. Only the `bgutil:http` provider is used here, the script providers are optional fallbacks.

**`grep` is not recognized (PowerShell)**
Use `Select-String` instead of `grep`, or run the command in git bash.

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
bin/                # (not tracked — set up manually, see Setup)
  yt-dlp.exe
  yt-dlp-plugins/
    bgutil-ytdlp-pot-provider/
      yt_dlp_plugins/
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
