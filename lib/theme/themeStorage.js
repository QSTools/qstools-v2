const THEME_STORAGE_KEY = "qstools-theme";
const DEFAULT_THEME = "dark";
const ALLOWED_THEMES = ["light", "medium", "dark"];

export function getAllowedThemes() {
  return ALLOWED_THEMES;
}

export function getDefaultTheme() {
  return DEFAULT_THEME;
}

export function isValidTheme(value) {
  return ALLOWED_THEMES.includes(value);
}

export function readStoredTheme() {
  if (typeof window === "undefined") return DEFAULT_THEME;

  const value = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isValidTheme(value) ? value : DEFAULT_THEME;
}

export function writeStoredTheme(theme) {
  if (typeof window === "undefined") return;
  if (!isValidTheme(theme)) return;

  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function applyThemeToDocument(theme) {
  if (typeof document === "undefined") return;
  if (!isValidTheme(theme)) return;

  document.documentElement.setAttribute("data-theme", theme);
}