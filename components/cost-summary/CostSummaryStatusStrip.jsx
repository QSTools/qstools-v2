"use client";

function Pill({ children, tone = "neutral" }) {
  const toneClasses = {
    neutral:
      "border-[var(--border-strong)] bg-[var(--bg-card-muted)]/80 text-[var(--text-primary)]",
    ok: "border-[var(--success)] bg-[var(--success-soft)]/60 text-[var(--success)]",
    warn: "border-[var(--warning)] bg-[var(--warning-soft)]/60 text-[var(--warning)]",
    danger:
      "border-[var(--danger)] bg-[var(--danger-soft)]/60 text-[var(--danger)]",
    info: "border-[var(--info)] bg-[var(--info-soft)]/60 text-[var(--info)]",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-2 text-xs min-h-[40px] font-medium ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}

function StatusItem({ label, value, tone = "neutral" }) {
  const valueToneClass =
    tone === "danger"
      ? "text-[var(--danger)]"
      : tone === "warn"
        ? "text-[var(--warning)]"
        : tone === "ok"
          ? "text-[var(--success)]"
          : tone === "info"
            ? "text-[var(--info)]"
            : "text-[var(--text-primary)]";

  return (
    <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-input)]/70 p-4">
      <div className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </div>
      <div className={`mt-2 text-sm font-semibold ${valueToneClass}`}>{value}</div>
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
    <section className="ui-section">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Cost Summary Status
          </h2>
          <p className="ui-help">
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
          <div className="rounded-2xl border border-[var(--danger)]/80 bg-[var(--danger-soft)]/40 p-4">
            <div className="text-sm font-semibold text-[var(--danger)]">
              Missing Modules / Inputs
            </div>
            {hasMissingModules ? (
              <ul className="mt-3 space-y-2 text-sm text-[var(--danger)]">
                {missing_modules.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-[var(--text-muted)]">None</p>
            )}
          </div>

          <div className="rounded-2xl border border-[var(--warning)]/80 bg-[var(--warning-soft)]/40 p-4">
            <div className="text-sm font-semibold text-[var(--warning)]">
              Warnings
            </div>
            {hasWarnings ? (
              <ul className="mt-3 space-y-2 text-sm text-[var(--warning)]">
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