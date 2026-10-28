"use client";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [night, setNight] = useState(false);
  useEffect(() => setNight(document.documentElement.dataset.theme === "night"), []);
  function flip() {
    const next = !night;
    setNight(next);
    document.documentElement.dataset.theme = next ? "night" : "day";
    try {
      localStorage.setItem("fc-theme", next ? "night" : "day");
    } catch {}
  }
  return (
    <button
      onClick={flip}
      aria-label={night ? "Switch to day theme" : "Switch to night theme"}
      className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-card text-lg transition hover:border-soft"
    >
      <span aria-hidden>{night ? "☀️" : "🌙"}</span>
    </button>
  );
}
