import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Music Streaming App",
  description: "A Spotify-inspired music streaming interface",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
