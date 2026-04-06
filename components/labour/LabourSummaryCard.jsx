"use client";

export default function LabourSummaryCard({ state, outputs, has_profile }) {
  const rows = [
    ["Paid Hours per Year", format_number(outputs.paid_hours_per_year)],
    ["Non-Productive Paid Hours", format_number(outputs.non_productive_paid_hours)],
    ["Productive Hours", format_number(outputs.productive_hours)],
    ["Loaded Labour Cost Rate", format_currency(outputs.loaded_labour_cost_rate)],
    ["Productive Labour Cost Rate", format_currency(outputs.productive_labour_cost_rate)],
    ["Minimum Charge Out Rate", format_currency(outputs.minimum_charge_out_rate)],
    ["Actual Margin Percent", `${format_number(outputs.actual_margin_percent)}%`],
    ["Margin Gap", format_currency(outputs.margin_gap)],
  ];

  return (
    <section className="ui-section">
      <div className="ui-stack">
        <div>
          <h2 className="text-lg font-semibold">Labour Summary</h2>
          <p className="ui-help">
            Live commercial outputs from the active labour profile
          </p>
        </div>

        {!has_profile ? (
          <div className="rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-input)] px-4 py-6 text-sm text-[var(--text-muted)]">
            Create a labour profile to unlock live outputs.
          </div>
        ) : (
          <div className="ui-stack">
            <div className="ui-panel">
              <div className="ui-kicker">Active Profile</div>
              <div className="mt-1 text-sm text-[var(--text-primary)]">
                {state.staff_name || "Unnamed"} · {state.staff_role || "No role"}
              </div>
            </div>

            {rows.map(([label, value]) => (
              <div
                key={label}
                className="ui-panel"
              >
                <div className="text-sm text-[var(--text-secondary)]">{label}</div>
                <div className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                  {value}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function format_number(value) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function format_currency(value) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}