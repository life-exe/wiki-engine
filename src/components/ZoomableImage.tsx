import { useEffect, useState, type ComponentProps } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const TRANSITION_MS = 200;

export function ZoomableImage({ src, alt, className, onClick, ...props }: ComponentProps<"img">) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  const open = () => {
    if (!src) return;
    setMounted(true);
    requestAnimationFrame(() => setVisible(true));
  };

  const close = () => {
    setVisible(false);
  };

  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted || visible) return;
    const t = setTimeout(() => setMounted(false), TRANSITION_MS);
    return () => clearTimeout(t);
  }, [mounted, visible]);

  const triggerClass = className ? `${className} cursor-zoom-in` : "cursor-zoom-in";

  return (
    <>
      <img
        src={src}
        alt={alt}
        className={triggerClass}
        onClick={(e) => {
          open();
          onClick?.(e);
        }}
        {...props}
      />
      {mounted &&
        src &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className={`fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 cursor-zoom-out transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
            onClick={close}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={(e) => {
                e.stopPropagation();
                close();
              }}
              className="absolute top-4 right-4 flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
            <img
              src={src}
              alt={alt}
              className={`max-w-full max-h-full object-contain transition duration-200 ${visible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
            />
          </div>,
          document.body,
        )}
    </>
  );
}
