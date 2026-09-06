import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useWiki } from "../context/WikiContext";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let gaInitialized = false;
let initialisedWithConsent = false;

export const initGA = (measurementId?: string, linkerDomains: string[] = []) => {
  if (typeof window === "undefined" || gaInitialized || !measurementId) return;
  gaInitialized = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function () {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer?.push(arguments);
    };

  const isConsentGranted =
    typeof localStorage !== "undefined" && localStorage.getItem("cookie-consent") === "true";
  const isDebugMode =
    window.location.search.includes("debug_mode=true") ||
    window.location.search.includes("debug_mode=1");

  initialisedWithConsent = isConsentGranted || isDebugMode;
  const consentStatus = initialisedWithConsent ? "granted" : "denied";

  window.gtag("consent", "default", {
    analytics_storage: consentStatus,
    ad_storage: consentStatus,
    ad_user_data: consentStatus,
    ad_personalization: consentStatus,
  });

  const scriptId = "google-analytics-gtag";
  if (!document.getElementById(scriptId)) {
    const script = document.createElement("script");
    script.id = scriptId;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
  }

  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    send_page_view: false,
    linker: linkerDomains.length
      ? {
          domains: linkerDomains,
          accept_incoming: true,
        }
      : undefined,
  });
};

export const updateConsentState = (granted: boolean) => {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;

  const state = granted ? "granted" : "denied";

  window.gtag("consent", "update", {
    analytics_storage: state,
    ad_storage: state,
    ad_user_data: state,
    ad_personalization: state,
  });

  if (granted && !initialisedWithConsent) {
    trackPageView(window.location.pathname + window.location.search + window.location.hash);
  }
};

export const trackPageView = (path: string, title?: string) => {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;

  window.gtag("event", "page_view", {
    page_location: window.location.href,
    page_path: path,
    page_title: title || document.title,
  });
};

export function AnalyticsTracker() {
  const location = useLocation();
  const { config } = useWiki();

  useEffect(() => {
    if (config.analytics?.googleAnalyticsId) {
      initGA(config.analytics.googleAnalyticsId, config.analytics.linkerDomains);
    }
  }, [config.analytics]);

  useEffect(() => {
    if (!config.analytics?.googleAnalyticsId) return;
    const timer = setTimeout(() => {
      trackPageView(location.pathname + location.search + location.hash, document.title);
    }, 50);

    return () => clearTimeout(timer);
  }, [location, config.analytics?.googleAnalyticsId]);

  return null;
}
