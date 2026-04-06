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
      <h2 className="text-lg font-semibold">Labour Summary</h2>
      <p className="mt-1 mb-5 text-sm text-[var(--text-muted)]">
        Live commercial outputs from the active labour profile
      </p>

      {!has_profile ? (
        <div className="rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-input)] px-4 py-6 text-sm text-[var(--text-muted)]">
          Create a labour profile to unlock live outputs.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-input)] px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
              Active Profile
            </div>
            <div className="mt-1 text-sm text-[var(--text-primary)]">
              {state.staff_name || "Unnamed"} · {state.staff_role || "No role"}
            </div>
          </div>

          {rows.map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-xl border border-[var(--border-primary)] bg-[var(--bg-input)] px-4 py-3"
            >
              <span className="text-sm text-[var(--text-secondary)]">{label}</span>
              <span className="text-sm font-medium text-white">{value}</span>
            </div>
          ))}
        </div>
      )}
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