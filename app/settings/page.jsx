"use client";

import useTheme from "@/hooks/useTheme";
import ThemeSettingsCard from "@/components/settings/ThemeSettingsCard";

export default function SettingsPage() {
  const { theme, setTheme, availableThemes } = useTheme();

  return (
    <main className="space-y-6">
      <section className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-input)] p-5">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Settings
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Manage app-level preferences for QS Tools.
        </p>
      </section>

      <ThemeSettingsCard
        theme={theme}
        setTheme={setTheme}
        availableThemes={availableThemes}
      />
    </main>
  );
}