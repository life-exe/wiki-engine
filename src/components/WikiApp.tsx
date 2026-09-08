import { BrowserRouter, Routes, Route } from "react-router-dom";
import type { WikiConfig, WikiData } from "../types";
import { WikiProvider } from "../context/WikiContext";
import { AnalyticsTracker } from "../analytics";
import { WikiLayout } from "./WikiLayout";
import { WikiPageView } from "./WikiPageView";
import { LecturePageView } from "./LecturePageView";

export interface WikiAppProps {
  config: WikiConfig;
  data: WikiData;
  basename?: string;
}

export function WikiRoutes() {
  return (
    <Routes>
      <Route element={<WikiLayout />}>
        <Route index element={<WikiPageView isIndex />} />
        <Route path="wiki/:slug" element={<WikiPageView />} />
        <Route path="wiki/:section/:lecture" element={<LecturePageView />} />
        <Route path="wiki/:section/:parent/:lecture" element={<LecturePageView />} />
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
