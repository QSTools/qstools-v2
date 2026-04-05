"use client";

function Pill({ children, tone = "neutral" }) {
  const toneClasses = {
    neutral: "border-[var(--border-strong)] bg-[var(--bg-card-muted)]/80 text-[var(--text-primary)]",
    ok: "border-emerald-800 bg-emerald-950/60 text-emerald-300",
    warn: "border-amber-800 bg-amber-950/60 text-amber-300",
    danger: "border-red-800 bg-red-950/60 text-red-300",
    info: "border-sky-800 bg-sky-950/60 text-sky-300",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}

function StatusItem({ label, value, tone = "neutral" }) {
  return (
    <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-input)]/70 p-4">
      <div className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </div>
      <div
        className={`mt-2 text-sm font-semibold ${
          tone === "danger"
            ? "text-red-300"
            : tone === "warn"
              ? "text-amber-300"
              : tone === "ok"
                ? "text-emerald-300"
                : tone === "info"
                  ? "text-sky-300"
                  : "text-[var(--text-primary)]"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

export default function CostSummaryStatusStrip({
  recovery_model_label = "Not set",
  linked_staff_count = 0,
  linked_asset_count = 0,
  unlinked_active_staff_count = 0,
  missing_modules = [],
  warnings = [],
  is_structure_complete = false,
}) {
  const hasMissingModules = missing_modules.length > 0;
  const hasWarnings = warnings.length > 0;

  const structureTone = hasMissingModules
    ? "danger"
    : hasWarnings || !is_structure_complete
      ? "warn"
      : "ok";

  const recoveryTone =
    recovery_model_label === "Asset Driven"
      ? "info"
      : recovery_model_label === "Labour Only"
        ? "ok"
        : "warn";

  return (
    <section className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Cost Summary Status
          </h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Live recovery structure and upstream readiness.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Pill tone={recoveryTone}>Recovery Model: {recovery_model_label}</Pill>
          <Pill tone={structureTone}>
            {hasMissingModules
              ? "Missing Upstream Inputs"
              : hasWarnings || !is_structure_complete
                ? "Warnings Present"
                : "Structure Complete"}
          </Pill>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatusItem
          label="Recovery Model"
          value={recovery_model_label}
          tone={recoveryTone}
        />
        <StatusItem
          label="Linked Staff"
          value={linked_staff_count}
          tone={linked_staff_count > 0 ? "ok" : "warn"}
        />
        <StatusItem
          label="Linked Assets"
          value={linked_asset_count}
          tone={linked_asset_count > 0 ? "ok" : "warn"}
        />
        <StatusItem
          label="Unlinked Staff"
          value={unlinked_active_staff_count}
          tone={unlinked_active_staff_count > 0 ? "warn" : "ok"}
        />
      </div>

      {(hasMissingModules || hasWarnings) && (
        <div className="mt-5 grid grid-cols-1 gap-3 xl:grid-cols-2">
          <div className="rounded-2xl border border-red-900/80 bg-red-950/40 p-4">
            <div className="text-sm font-semibold text-red-300">
              Missing Modules / Inputs
            </div>
            {hasMissingModules ? (
              <ul className="mt-3 space-y-2 text-sm text-red-200">
                {missing_modules.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-[var(--text-muted)]">None</p>
            )}
          </div>

          <div className="rounded-2xl border border-amber-900/80 bg-amber-950/40 p-4">
            <div className="text-sm font-semibold text-amber-300">Warnings</div>
            {hasWarnings ? (
              <ul className="mt-3 space-y-2 text-sm text-amber-200">
                {warnings.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-[var(--text-muted)]">None</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}