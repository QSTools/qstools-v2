"use client";

import { useEffect, useState } from "react";
import {
  applyThemeToDocument,
  getAllowedThemes,
  getDefaultTheme,
  isValidTheme,
  readStoredTheme,
  writeStoredTheme,
} from "@/lib/theme/themeStorage";

export default function useTheme() {
  const [theme, setThemeState] = useState(getDefaultTheme());

  useEffect(() => {
    const storedTheme = readStoredTheme();
    setThemeState(storedTheme);
    applyThemeToDocument(storedTheme);
  }, []);

  function setTheme(nextTheme) {
    if (!isValidTheme(nextTheme)) return;

    setThemeState(nextTheme);
    writeStoredTheme(nextTheme);
    applyThemeToDocument(nextTheme);
  }

  return {
    theme,
    setTheme,
    availableThemes: getAllowedThemes(),
  };
}