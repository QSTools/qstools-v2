"use client";

export default function LabourSummaryCard({
  meta = {},
  rows = [],
}) {
  const has_rows = Array.isArray(rows) && rows.length > 0;

  return (
    <section className="ui-section">
      <div className="ui-stack">
        <div>
          <h2 className="text-lg font-semibold">Labour Summary</h2>
          <p className="ui-help">
            Live commercial outputs from the active labour profile
          </p>
        </div>

        {!has_rows ? (
          <div className="rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-input)] px-4 py-6 text-sm text-[var(--text-muted)]">
            Create a labour profile to unlock live outputs.
          </div>
        ) : (
          <div className="ui-stack">
            <div className="ui-panel">
              <div className="ui-kicker">Active Profile</div>
              <div className="mt-1 text-sm text-[var(--text-primary)]">
                {meta.staff_name || "Unnamed"} · {meta.staff_role || "No role"}
              </div>
              <div className="mt-1 text-sm text-[var(--text-secondary)]">
                {meta.labour_class || "No class"}
              </div>
            </div>

            {rows.map((row) => (
              <div key={row.label} className="ui-panel">
                <div className="text-sm text-[var(--text-secondary)]">
                  {row.label}
                </div>
                <div
                  className={[
                    "mt-1 text-sm text-[var(--text-primary)]",
                    row.emphasis ? "font-semibold" : "font-medium",
                  ].join(" ")}
                >
                  {row.value}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}