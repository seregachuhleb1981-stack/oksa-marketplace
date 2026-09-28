"use client";

import { useEffect, useState } from "react";

type Mode = "light" | "dark" | "system";
const KEY = "oksa-theme";

function apply(mode: Mode) {
  const resolved = mode === "system"
    ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : mode;
  document.documentElement.dataset.theme = resolved;
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("system");

  useEffect(() => {
    const saved = localStorage.getItem(KEY) as Mode | null;
    const next: Mode = saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
    setMode(next);
    apply(next);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (next === "system") apply("system");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  function cycle() {
    const next: Mode = mode === "light" ? "dark" : mode === "dark" ? "system" : "light";
    setMode(next);
    localStorage.setItem(KEY, next);
    apply(next);
  }

  const label = mode === "light" ? "Світла тема" : mode === "dark" ? "Темна тема" : "Системна тема";
  const icon = mode === "light" ? "☀" : mode === "dark" ? "☾" : "◐";

  return (
    <button className="theme-toggle" type="button" onClick={cycle} aria-label={label} title={label}>
      <span aria-hidden="true">{icon}</span>
    </button>
  );
}
