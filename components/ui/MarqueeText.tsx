"use client";

import { useEffect, useRef, useState } from "react";

export function MarqueeText({ text, className = "" }: { text: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    if (!containerRef.current || !textRef.current) return;
    const containerWidth = containerRef.current.offsetWidth;
    const textWidth = textRef.current.scrollWidth;

    if (textWidth > containerWidth) {
      setShouldScroll(true);
      setDistance(textWidth - containerWidth + 8);
    } else {
      setShouldScroll(false);
    }
  }, [text]);

  return (
    <div ref={containerRef} className={`overflow-hidden whitespace-nowrap relative ${className}`}>
      <span
        ref={textRef}
        className="inline-block"
        style={
          shouldScroll
            ? ({
                animation: `marquee-slide 6s ease-in-out infinite`,
                "--marquee-distance": `-${distance}px`,
              } as React.CSSProperties)
            : undefined
        }
      >
        {text}
      </span>

      {shouldScroll && (
        <style jsx>{`
          @keyframes marquee-slide {
            0%, 15% { transform: translateX(0); }
            45%, 65% { transform: translateX(var(--marquee-distance)); }
            95%, 100% { transform: translateX(0); }
          }
        `}</style>
      )}
    </div>
  );
}