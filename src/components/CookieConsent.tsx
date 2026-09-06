import { useState, useEffect } from "react";
import { X, Cookie } from "lucide-react";
import { useWiki } from "../context/WikiContext";
import { updateConsentState } from "../analytics";

export function CookieConsent() {
  const { lang, config } = useWiki();
  const consentConfig = config.cookieConsent;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (consentConfig?.enabled === false) return;
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [consentConfig?.enabled]);

  if (consentConfig?.enabled === false || !isVisible) return null;

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "true");
    updateConsentState(true);
    consentConfig?.onConsentChange?.(true);
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookie-consent", "false");
    updateConsentState(false);
    consentConfig?.onConsentChange?.(false);
    setIsVisible(false);
  };

  const isEn = lang === "en";
  const defaultRu = "Мы используем cookies для сбора анонимной аналитики и улучшения материалов базы знаний.";
  const defaultEn = "We use cookies to analyze traffic and improve the wiki experience.";

  const messageText = isEn
    ? consentConfig?.message?.en ?? defaultEn
    : consentConfig?.message?.ru ?? defaultRu;

  return (
    <div
      role="dialog"
      aria-label={isEn ? "Cookie consent" : "Согласие на использование cookies"}
      className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-md z-50 p-4 rounded-lg border border-border bg-background/95 backdrop-blur-md shadow-lg text-foreground transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-md bg-accent text-foreground shrink-0 mt-0.5">
          <Cookie size={18} />
        </div>

        <div className="flex-1 text-xs leading-relaxed">
          <p className="text-muted-foreground mb-1.5">
            {messageText}{" "}
            {consentConfig?.privacyPolicyUrl && (
              <a
                href={consentConfig.privacyPolicyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-2 hover:opacity-80 transition-opacity"
              >
                {isEn ? "Privacy Policy" : "Политика конфиденциальности"}
              </a>
            )}
          </p>

          <div className="flex items-center gap-2 mt-3 justify-end">
            <button
              onClick={handleDecline}
              className="px-3 py-1.5 rounded text-xs font-medium border border-border bg-background hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {isEn ? "Decline" : "Отклонить"}
            </button>
            <button
              onClick={handleAccept}
              className="px-3.5 py-1.5 rounded text-xs font-medium bg-foreground text-background hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
            >
              {isEn ? "Accept" : "Принять"}
            </button>
          </div>
        </div>

        <button
          onClick={handleDecline}
          aria-label={isEn ? "Close" : "Закрыть"}
          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer shrink-0 -mr-1 -mt-1"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
export default CookieConsent;
