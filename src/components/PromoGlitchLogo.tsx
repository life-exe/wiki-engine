import { useState, useContext, type CSSProperties } from "react";
import { WikiContext } from "../context/WikiContext";

export interface PromoGlitchLogoProps {
  src?: string;
  srcDark?: string;
  srcWhite?: string;
  "src-dark"?: string;
  "src-white"?: string;
  alt?: string;
  className?: string;
  style?: CSSProperties;
  maxWidth?: number | string;
  node?: unknown;
}

export function PromoGlitchLogo({
  src,
  srcDark,
  srcWhite,
  alt = "LIFE.EXE",
  className = "",
  style,
  maxWidth = 380,
  node: _node,
  ...props
}: PromoGlitchLogoProps & Record<string, any>) {
  const [isGlitched, setIsGlitched] = useState(false);
  const wiki = useContext(WikiContext);
  const theme = wiki?.theme ?? "dark";
  const wikiImages = wiki?.data?.wikiImages ?? {};

  const triggerGlitch = () => {
    setIsGlitched(true);
    setTimeout(() => setIsGlitched(false), 400);
  };

  const effectiveDark = srcDark ?? props["src-dark"] ?? "./life-exe-promo-logo-dark.png";
  const effectiveWhite = srcWhite ?? props["src-white"] ?? "./life-exe-promo-logo-white.png";

  const resolve = (s?: string) => {
    if (!s) return undefined;
    if (s.startsWith("./")) {
      const fileName = s.replace(/^\.\//, "");
      const found =
        Object.keys(wikiImages).find((p) => p.endsWith(`/${fileName}`)) ??
        Object.keys(wikiImages).find((p) => p.includes(fileName));
      return found ? wikiImages[found] : s;
    }
    return s;
  };

  const resolvedSrc = resolve(src);
  const resolvedDark = resolve(effectiveDark) ?? resolvedSrc;
  const resolvedWhite = resolve(effectiveWhite) ?? resolvedSrc;

  const currentSrc = theme === "dark" ? (resolvedWhite ?? resolvedDark) : (resolvedDark ?? resolvedWhite);

  if (!currentSrc) return null;

  return (
    <>
      <style>{`
        @keyframes glitch-anim-1 {
          0% { clip-path: inset(20% 0 60% 0); transform: translate(-4px, -2px) scale(1.02); }
          10% { clip-path: inset(80% 0 5% 0); transform: translate(4px, 2px); }
          20% { clip-path: inset(10% 0 80% 0); transform: translate(-3px, 3px); }
          30% { clip-path: inset(45% 0 35% 0); transform: translate(3px, -2px); }
          40% { clip-path: inset(65% 0 15% 0); transform: translate(-2px, 4px); }
          50% { clip-path: inset(15% 0 75% 0); transform: translate(4px, -3px); }
          60% { clip-path: inset(50% 0 30% 0); transform: translate(-4px, 2px); }
          70% { clip-path: inset(5% 0 85% 0); transform: translate(3px, -4px); }
          80% { clip-path: inset(70% 0 20% 0); transform: translate(-2px, 3px); }
          90% { clip-path: inset(35% 0 50% 0); transform: translate(5px, -1px); }
          100% { clip-path: inset(20% 0 60% 0); transform: translate(-4px, -2px); }
        }

        @keyframes glitch-anim-2 {
          0% { clip-path: inset(65% 0 15% 0); transform: translate(4px, 2px); }
          15% { clip-path: inset(10% 0 75% 0); transform: translate(-4px, -3px); }
          30% { clip-path: inset(80% 0 5% 0); transform: translate(3px, 4px); }
          45% { clip-path: inset(30% 0 50% 0); transform: translate(-3px, -2px); }
          60% { clip-path: inset(5% 0 85% 0); transform: translate(5px, 2px); }
          75% { clip-path: inset(45% 0 35% 0); transform: translate(-5px, -4px); }
          90% { clip-path: inset(25% 0 60% 0); transform: translate(2px, 3px); }
          100% { clip-path: inset(65% 0 15% 0); transform: translate(4px, 2px); }
        }

        @keyframes glitch-burst {
          0% { transform: scale(1) translate(0, 0); filter: none; }
          20% { transform: scale(1.08) translate(-10px, 5px) skewX(8deg); filter: invert(1) hue-rotate(180deg); }
          40% { transform: scale(0.96) translate(12px, -6px) skewX(-12deg); filter: contrast(300%); }
          60% { transform: scale(1.04) translate(-6px, 8px); filter: saturate(400%); }
          80% { transform: scale(1.01) translate(4px, -3px); filter: brightness(150%); }
          100% { transform: scale(1) translate(0, 0); filter: none; }
        }

        .glitch-layer-red {
          animation: glitch-anim-1 2.2s infinite steps(2, end);
          filter: drop-shadow(-4px 0 #ff0055);
          opacity: 0.85;
          mix-blend-mode: multiply;
        }

        .dark .glitch-layer-red {
          mix-blend-mode: screen;
        }

        .glitch-layer-cyan {
          animation: glitch-anim-2 2.8s infinite steps(2, end);
          filter: drop-shadow(4px 0 #00ffff);
          opacity: 0.85;
          mix-blend-mode: multiply;
        }

        .dark .glitch-layer-cyan {
          mix-blend-mode: screen;
        }

        .glitch-active {
          animation: glitch-burst 0.4s ease-out;
        }
      `}</style>

      <div
        onClick={triggerGlitch}
        onMouseEnter={triggerGlitch}
        style={{
          maxWidth: typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth,
          width: "100%",
          ...style,
        }}
        className={`relative inline-block cursor-pointer select-none group max-w-full ${
          isGlitched ? "glitch-active" : ""
        } ${className}`}
      >
        {/* Layer 1: Red Glitch Offset */}
        <img
          src={currentSrc}
          alt={`${alt} Red`}
          data-no-zoom
          className="absolute inset-0 w-full h-auto object-contain glitch-layer-red pointer-events-none"
        />

        {/* Layer 2: Cyan Glitch Offset */}
        <img
          src={currentSrc}
          alt={`${alt} Cyan`}
          data-no-zoom
          className="absolute inset-0 w-full h-auto object-contain glitch-layer-cyan pointer-events-none"
        />

        {/* Layer 3: Main Base Logo */}
        <img
          src={currentSrc}
          alt={alt}
          data-no-zoom
          className="relative w-full h-auto object-contain transition-transform duration-300 group-hover:scale-105"
        />
      </div>
    </>
  );
}
