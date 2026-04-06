"use client";

function Pill({ children, tone = "neutral" }) {
  const toneClasses = {
    neutral:
      "border-[var(--border-strong)] bg-[var(--bg-card-muted)] text-[var(--text-primary)]",
    ok: "border-[var(--success)] bg-[var(--success-soft)] text-[var(--success)]",
    warn: "border-[var(--warning)] bg-[var(--warning-soft)] text-[var(--warning)]",
    danger:
      "border-[var(--danger)] bg-[var(--danger-soft)] text-[var(--danger)]",
    info: "border-[var(--info)] bg-[var(--info-soft)] text-[var(--info)]",
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
          : tone === "info"
            ? "text-[var(--info)]"
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

  const structureLabel = hasMissingModules
    ? "Missing Upstream Inputs"
    : hasWarnings || !is_structure_complete
      ? "Warnings Present"
      : "Structure Complete";

  return (
    <section className="ui-section">
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Cost Summary Status
          </h2>
          <p className="ui-help">
            Live recovery structure and upstream readiness.
          </p>
        </div>

        <div className="ui-actions">
          <Pill tone={recoveryTone}>
            Recovery Model: {recovery_model_label}
          </Pill>

          <Pill tone={structureTone}>{structureLabel}</Pill>
        </div>

        <div className="ui-stack">
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