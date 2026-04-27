export const THEME_MODE_KEY = "cr_theme_mode";

export function getSystemTheme() {
  if (typeof window === "undefined" || !window.matchMedia) return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function readThemeMode() {
  if (typeof window === "undefined") return "system";
  try {
    const mode = localStorage.getItem(THEME_MODE_KEY);
    return mode === "dark" || mode === "light" || mode === "system" ? mode : "system";
  } catch {
    return "system";
  }
}

export function resolveTheme(mode) {
  return mode === "system" ? getSystemTheme() : mode;
}

export function applyTheme(mode) {
  const resolved = resolveTheme(mode);
  const root = document.documentElement;
  root.setAttribute("data-theme", resolved);
  root.style.colorScheme = resolved;
  return resolved;
}
