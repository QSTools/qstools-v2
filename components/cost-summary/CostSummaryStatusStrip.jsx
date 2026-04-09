"use client";

function Pill({ children, tone = "neutral" }) {
  const toneClasses = {
    neutral:
      "border-[var(--border-strong)] bg-[var(--bg-card-muted)] text-[var(--text-primary)]",
    ok: "border-[var(--success)] bg-[var(--success-soft)] text-[var(--success)]",
    warn: "border-[var(--warning)] bg-[var(--warning-soft)] text-[var(--warning)]",
    danger:
      "border-[var(--danger)] bg-[var(--danger-soft)] text-[var(--danger)]",
  };

  return <div className={`ui-pill ${toneClasses[tone]}`}>{children}</div>;
}

function StatusItem({ label, value, tone = "neutral" }) {
  const valueToneClass =
    tone === "danger"
      ? "text-[var(--danger)]"
      : tone === "warn"
        ? "text-[var(--warning)]"
        : tone === "ok"
          ? "text-[var(--success)]"
          : "text-[var(--text-primary)]";

  return (
    <div className="ui-panel">
      <div className="ui-kicker">{label}</div>
      <div className={`mt-2 text-base font-semibold ${valueToneClass}`}>
        {value}
      </div>
    </div>
  );
}

function MessagePanel({ title, tone = "neutral", items = [] }) {
  const toneClasses = {
    neutral:
      "border-[var(--border-primary)] bg-[var(--bg-card-muted)] text-[var(--text-primary)]",
    danger:
      "border-[var(--danger)]/80 bg-[var(--danger-soft)]/40 text-[var(--danger)]",
    warn:
      "border-[var(--warning)]/80 bg-[var(--warning-soft)]/40 text-[var(--warning)]",
  };

  return (
    <div className={`rounded-2xl border p-4 ${toneClasses[tone]}`}>
      <div className="text-sm font-semibold">{title}</div>

      {items.length > 0 ? (
        <div className="mt-3 space-y-2 text-sm">
          {items.map((item) => (
            <div key={item}>• {item}</div>
          ))}
        </div>
      ) : (
        <p className="ui-help mt-3">None</p>
      )}
    </div>
  );
}

export default function CostSummaryStatusStrip({
  labour_profiles_label = "0 active",
  employee_overheads_label = "Missing",
  asset_costs_label = "Missing",
  general_overheads_label = "Missing",
  productive_output_label = "0",
  missing_modules = [],
  warnings = [],
  is_ready = false,
}) {
  const hasMissingModules = missing_modules.length > 0;
  const hasWarnings = warnings.length > 0;

  const readinessTone = hasMissingModules
    ? "danger"
    : hasWarnings || !is_ready
      ? "warn"
      : "ok";

  const readinessLabel = hasMissingModules
    ? "Missing Upstream Inputs"
    : hasWarnings || !is_ready
      ? "Warnings Present"
      : "Ready";

  return (
    <section className="ui-section">
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Cost Summary Status
          </h2>
          <p className="ui-help">
            Live cost-input readiness for Cost Summary aggregation.
          </p>
        </div>

        <div className="ui-actions">
          <Pill tone={readinessTone}>{readinessLabel}</Pill>
        </div>

        <div className="ui-stack">
          <StatusItem
            label="Labour Profiles"
            value={labour_profiles_label}
            tone={labour_profiles_label !== "0 active" ? "ok" : "warn"}
          />

          <StatusItem
            label="Employee Overheads"
            value={employee_overheads_label}
            tone={employee_overheads_label === "Connected" ? "ok" : "warn"}
          />

          <StatusItem
            label="Asset Costs"
            value={asset_costs_label}
            tone={asset_costs_label === "Connected" ? "ok" : "warn"}
          />

          <StatusItem
            label="General Overheads"
            value={general_overheads_label}
            tone={general_overheads_label === "Connected" ? "ok" : "warn"}
          />

          <StatusItem
            label="Productive Output"
            value={productive_output_label}
            tone={productive_output_label !== "0" ? "ok" : "warn"}
          />
        </div>

        {(hasMissingModules || hasWarnings) && (
          <div className="space-y-3">
            <MessagePanel
              title="Missing Modules / Inputs"
              tone="danger"
              items={missing_modules}
            />

            <MessagePanel
              title="Warnings"
              tone="warn"
              items={warnings}
            />
          </div>
        )}
      </div>
    </section>
  );
}