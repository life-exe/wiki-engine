// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { MemoryRouter, useNavigate, type NavigateFunction } from "react-router-dom";
import { WikiProvider } from "../context/WikiContext";
import { createWikiData } from "../data";
import type { WikiConfig } from "../types";
import { WikiRoutes } from "./WikiApp";

const data = createWikiData({
  sectionsRu: {
    "/docs/ru/README.md": "# Главная\n\nДобро пожаловать.",
    "/docs/ru/01-intro.md": "# Введение\n\nО курсе.",
  },
  lecturesRu: {
    "/docs/ru/01-intro/01-about.md": "# О курсе\n\nТекст лекции.",
  },
});

const config: WikiConfig = { brand: { title: "Test Wiki" }, cookieConsent: { enabled: false } };

function ExposeNavigate({ onReady }: { onReady: (navigate: NavigateFunction) => void }) {
  const navigate = useNavigate();
  useEffect(() => {
    onReady(navigate);
  }, [navigate, onReady]);
  return null;
}

function renderAt(path: string) {
  const router: { navigate?: NavigateFunction } = {};
  render(
    <WikiProvider config={config} data={data}>
      <MemoryRouter initialEntries={[path]}>
        <ExposeNavigate
          onReady={(navigate) => {
            router.navigate = navigate;
          }}
        />
        <WikiRoutes />
      </MemoryRouter>
    </WikiProvider>,
  );
  return { navigate: (to: string) => act(async () => router.navigate?.(to)) };
}

beforeAll(() => {
  // Browser APIs jsdom does not implement
  window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as typeof window.matchMedia;
  window.scrollTo = vi.fn() as typeof window.scrollTo;
  Element.prototype.scrollTo = vi.fn() as typeof Element.prototype.scrollTo;
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(cleanup);

describe("WikiApp smoke", () => {
  it("renders layout, sidebar and the index page", () => {
    renderAt("/");
    expect(screen.getAllByText("Test Wiki").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Введение").length).toBeGreaterThan(0);
    expect(screen.getByText("Добро пожаловать.")).toBeTruthy();
  });

  it("navigates between section, lecture and missing pages without hook-order errors", async () => {
    const router = renderAt("/01-intro");
    expect(screen.getByText("О курсе.")).toBeTruthy();

    await router.navigate("/01-intro/01-about");
    expect(screen.getByText("Текст лекции.")).toBeTruthy();

    // Unknown lecture redirects to its section
    await router.navigate("/01-intro/missing");
    expect(screen.getByText("О курсе.")).toBeTruthy();

    await router.navigate("/01-intro/01-about");
    expect(screen.getByText("Текст лекции.")).toBeTruthy();
  });
});
