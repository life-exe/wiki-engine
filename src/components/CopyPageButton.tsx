import { useState, useRef, useEffect } from "react";
import { Copy, Check, ChevronDown } from "lucide-react";
import clsx from "clsx";
import { stripFrontmatter } from "../data";

export interface CopyPageButtonProps {
  content: string;
  className?: string;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fallback below
  }
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}

export function CopyPageButton({ content, className }: CopyPageButtonProps) {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = async () => {
    if (!content) return;
    const textToCopy = stripFrontmatter(content).trim();
    const success = await copyToClipboard(textToCopy);
    if (success) {
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    }
    setMenuOpen(false);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <div ref={menuRef} className={clsx("relative inline-flex items-center select-none", className)}>
      <div className="inline-flex items-center rounded-md border border-border bg-accent text-xs text-muted-foreground transition-colors shadow-xs">
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 hover:text-foreground hover:bg-border rounded-l-[5px] transition-colors cursor-pointer"
          title="Copy page as Markdown"
          aria-label="Copy page as Markdown"
        >
          {copied ? (
            <>
              <Check size={14} className="text-foreground shrink-0" />
              <span className="font-medium text-foreground">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} className="shrink-0" />
              <span className="font-medium">Copy</span>
            </>
          )}
        </button>

        <div className="w-[1px] h-3.5 bg-border shrink-0" />

        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="flex items-center justify-center px-1.5 py-1 hover:text-foreground hover:bg-border rounded-r-[5px] transition-colors cursor-pointer"
          title="More options"
          aria-label="More options"
          aria-expanded={menuOpen}
        >
          <ChevronDown
            size={14}
            className={clsx("transition-transform duration-150 shrink-0", menuOpen && "rotate-180")}
          />
        </button>
      </div>

      {menuOpen && (
        <div className="absolute right-0 top-full mt-1.5 z-50 min-w-[270px] rounded-lg border border-border bg-accent p-1.5 text-foreground shadow-2xl">
          <button
            type="button"
            onClick={handleCopy}
            className="w-full flex items-start gap-3 p-2.5 rounded-md hover:bg-border transition-colors text-left cursor-pointer group"
          >
            <Copy size={16} className="text-muted-foreground group-hover:text-foreground shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-foreground leading-snug">Copy page</div>
              <div className="text-[11px] text-muted-foreground leading-normal mt-0.5">
                Copy page as Markdown for LLMs
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

export default CopyPageButton;
