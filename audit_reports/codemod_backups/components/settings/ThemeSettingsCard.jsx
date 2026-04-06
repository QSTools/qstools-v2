"use client";

export default function ThemeSettingsCard({
  theme,
  setTheme,
  availableThemes,
}) {
  const labels = {
    light: "Light",
    medium: "Medium",
    dark: "Dark",
  };

  return (
    <section className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5">
      <h2 className="text-xl font-semibold text-[var(--text-primary)]">
        Theme
      </h2>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        Choose how QS Tools looks across the whole app.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        {availableThemes.map((option) => {
          const active = theme === option;

          return (
            <button
              key={option}
              type="button"
              onClick={() => setTheme(option)}
              className={[
                "rounded-2xl border p-4 text-left transition-colors",
                active
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text-primary)]"
                  : "border-[var(--border-primary)] bg-[var(--bg-card-muted)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]",
              ].join(" ")}
            >
              <div className="text-base font-semibold">{labels[option]}</div>
              <div className="mt-1 text-sm text-[var(--text-muted)]">
                {option === "light" && "Bright workspace with light surfaces."}
                {option === "medium" &&
                  "Balanced darker interface with softer contrast."}
                {option === "dark" && "Deep dark mode for lower glare."}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}