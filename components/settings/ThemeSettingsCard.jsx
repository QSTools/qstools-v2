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
    <section className="ui-section">
      <div className="ui-stack">

        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Theme
          </h2>
          <p className="ui-help">
            Choose how QS Tools looks across the whole app.
          </p>
        </div>

        <div className="ui-stack">
          {availableThemes.map((option) => {
            const active = theme === option;

            return (
              <button
                key={option}
                type="button"
                onClick={() => setTheme(option)}
                className={[
                  "ui-panel text-left transition-colors",
                  active
                    ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                    : "hover:bg-[var(--bg-card-muted)]",
                ].join(" ")}
              >
                <div className="ui-stack">
                  <div className="text-base font-semibold text-[var(--text-primary)]">
                    {labels[option]}
                  </div>

                  <div className="ui-help">
                    {option === "light" &&
                      "Bright workspace with light surfaces."}
                    {option === "medium" &&
                      "Balanced darker interface with softer contrast."}
                    {option === "dark" &&
                      "Deep dark mode for lower glare."}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

      </div>
    </section>
  );
}