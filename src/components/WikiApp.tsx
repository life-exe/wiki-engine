import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import type { WikiConfig, WikiData } from "../types";
import { WikiProvider, useWiki } from "../context/WikiContext";
import { AnalyticsTracker } from "../analytics";
import { WikiLayout } from "./WikiLayout";
import { WikiPageView } from "./WikiPageView";
import { LecturePageView } from "./LecturePageView";

export interface WikiAppProps {
  config: WikiConfig;
  data: WikiData;
  basename?: string;
}

function LegacyWikiRedirect() {
  const location = useLocation();
  const target = location.pathname.replace(/^\/wiki/, "") || "/";
  return <Navigate to={`${target}${location.search}${location.hash}`} replace />;
}

export function WikiRoutes() {
  const { basePath } = useWiki();
  const prefix = basePath ? basePath.replace(/^\/+/, "") : "";

  return (
    <Routes>
      <Route element={<WikiLayout />}>
        <Route index element={<WikiPageView isIndex />} />
        {prefix ? (
          <>
            <Route path={`${prefix}/:slug`} element={<WikiPageView />} />
            <Route path={`${prefix}/:section/:lecture`} element={<LecturePageView />} />
            <Route path={`${prefix}/:section/:parent/:lecture`} element={<LecturePageView />} />
          </>
        ) : (
          <>
            <Route path=":slug" element={<WikiPageView />} />
            <Route path=":section/:lecture" element={<LecturePageView />} />
            <Route path=":section/:parent/:lecture" element={<LecturePageView />} />
            {/* Backward compatibility redirects from /wiki/... to /... */}
            <Route path="wiki/:slug" element={<LegacyWikiRedirect />} />
            <Route path="wiki/:section/:lecture" element={<LegacyWikiRedirect />} />
            <Route path="wiki/:section/:parent/:lecture" element={<LegacyWikiRedirect />} />
          </>
        )}
      </Route>
    </Routes>
  );
}

export function WikiApp({ config, data, basename }: WikiAppProps) {
  return (
    <WikiProvider config={config} data={data}>
      <BrowserRouter basename={basename}>
        <AnalyticsTracker />
        <WikiRoutes />
      </BrowserRouter>
    </WikiProvider>
  );
}
export default WikiApp;
