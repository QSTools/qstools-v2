"use client";

function formatMoney(value) {
  const n = Number(value || 0);
  return `$${n.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;
}

export default function CostSummaryCard({
  recovery_model_label,
  linked_staff_count,
  linked_asset_count,
  recovery_warnings = [],

  people_cost_total,
  gross_wages_total = 0,
  entitlements_total = 0,
  esct_total = 0,
  employee_overheads_total = 0,
  people_rows = [],

  business_cost_total,
  asset_cost_total,
  general_overheads_total,
  asset_rows = [],
  general_overhead_rows = [],

  total_cost_burden,
  required_revenue,
  required_recovery_rate,
  highlight_insight,
}) {
  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
      <h2 className="text-2xl font-semibold text-white">Cost Summary</h2>
      <p className="mt-1 text-sm text-neutral-400">
        Internal cost burden and required recovery view.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[2.2fr_1fr]">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
          <h3 className="text-lg font-semibold text-white">Recovery Model Block</h3>
          <p className="mt-1 text-sm text-neutral-400">
            Active structural recovery settings from Cost Allocation.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-neutral-800 bg-black p-4">
              <div className="text-xs uppercase tracking-wide text-neutral-500">
                Recovery Model
              </div>
              <div className="mt-2 text-lg font-semibold text-emerald-400">
                {recovery_model_label}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-black p-4">
              <div className="text-xs uppercase tracking-wide text-neutral-500">
                Linked Staff
              </div>
              <div className="mt-2 text-lg font-semibold text-white">
                {linked_staff_count}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-black p-4">
              <div className="text-xs uppercase tracking-wide text-neutral-500">
                Linked Assets
              </div>
              <div className="mt-2 text-lg font-semibold text-white">
                {linked_asset_count}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-black p-4">
          <div className="text-xs uppercase tracking-wide text-neutral-500">
            Current Warnings
          </div>
          <div className="mt-4 space-y-2 text-sm">
            {recovery_warnings.length > 0 ? (
              recovery_warnings.map((warning) => (
                <div key={warning} className="text-amber-400">
                  {warning}
                </div>
              ))
            ) : (
              <div className="text-emerald-400">No active warnings</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">People Cost</h3>
            <p className="mt-1 text-sm text-neutral-400">
              Gross Wages + Entitlements + ESCT + Employee Overheads
            </p>
          </div>

          <div className="text-right">
            <div className="text-3xl font-bold text-white">
              {formatMoney(people_cost_total)}
              <span className="ml-1 text-base font-normal text-neutral-400">/ year</span>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-neutral-800 bg-black p-4">
          <div className="space-y-4 text-base">
            <div className="flex items-center justify-between text-white">
              <span>Gross Wages</span>
              <span>{formatMoney(gross_wages_total)}</span>
            </div>

            <div className="flex items-center justify-between text-white">
              <span>Entitlements</span>
              <span>{formatMoney(entitlements_total)}</span>
            </div>

            <div className="flex items-center justify-between text-white">
              <span>ESCT</span>
              <span>{formatMoney(esct_total)}</span>
            </div>

            <div className="flex items-center justify-between text-white">
              <span>Employee Overheads</span>
              <span>{formatMoney(employee_overheads_total)}</span>
            </div>

            <div className="border-t border-neutral-800 pt-4 flex items-center justify-between font-semibold text-white">
              <span>Total People Cost</span>
              <span>{formatMoney(people_cost_total)}</span>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-sm font-medium text-neutral-300">Staff Drilldown</div>

            <div className="mt-3 space-y-3">
              {people_rows.length > 0 ? (
                people_rows.map((row) => (
                  <div
                    key={row.staff_id ?? row.staff_name}
                    className="rounded-xl border border-neutral-800 bg-neutral-950 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-semibold text-white">{row.staff_name}</div>
                        <div className="text-sm text-neutral-400">
                          {[row.staff_role, row.labour_class].filter(Boolean).join(" • ")}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-semibold text-white">
                          {formatMoney(row.total_people_cost)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-2 text-sm md:grid-cols-5">
                      <div className="rounded-lg border border-neutral-800 bg-black p-3">
                        <div className="text-neutral-500">Gross Wages</div>
                        <div className="mt-1 text-white">
                          {formatMoney(row.gross_wages_total)}
                        </div>
                      </div>

                      <div className="rounded-lg border border-neutral-800 bg-black p-3">
                        <div className="text-neutral-500">Entitlements</div>
                        <div className="mt-1 text-white">
                          {formatMoney(row.entitlement_cost_total)}
                        </div>
                      </div>

                      <div className="rounded-lg border border-neutral-800 bg-black p-3">
                        <div className="text-neutral-500">ESCT</div>
                        <div className="mt-1 text-white">
                          {formatMoney(row.esct_total)}
                        </div>
                      </div>

                      <div className="rounded-lg border border-neutral-800 bg-black p-3">
                        <div className="text-neutral-500">Employee Overheads</div>
                        <div className="mt-1 text-white">
                          {formatMoney(row.employee_overheads_total)}
                        </div>
                      </div>

                      <div className="rounded-lg border border-neutral-800 bg-black p-3">
                        <div className="text-neutral-500">Productive Hours</div>
                        <div className="mt-1 text-white">
                          {Number(row.productive_hours || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 text-neutral-500">
                  No staff cost records available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
        <h3 className="text-lg font-semibold text-white">Business Cost</h3>
        <p className="mt-1 text-sm text-neutral-400">
          Assets + General Overheads
        </p>

        <div className="mt-5 rounded-2xl border border-neutral-800 bg-black p-4 space-y-4">
          <div className="flex items-center justify-between text-white">
            <span>Assets</span>
            <span>{formatMoney(asset_cost_total)}</span>
          </div>

          <div className="flex items-center justify-between text-white">
            <span>General Overheads</span>
            <span>{formatMoney(general_overheads_total)}</span>
          </div>

          <div className="border-t border-neutral-800 pt-4 flex items-center justify-between font-semibold text-white">
            <span>Total Business Cost</span>
            <span>{formatMoney(business_cost_total)}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
        <h3 className="text-lg font-semibold text-white">Total Cost & Recovery</h3>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-neutral-800 bg-black p-4">
            <div className="text-xs uppercase tracking-wide text-neutral-500">
              Total Cost Burden
            </div>
            <div className="mt-2 text-2xl font-bold text-white">
              {formatMoney(total_cost_burden)}
            </div>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-black p-4">
            <div className="text-xs uppercase tracking-wide text-neutral-500">
              Required Revenue
            </div>
            <div className="mt-2 text-2xl font-bold text-white">
              {formatMoney(required_revenue)}
            </div>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-black p-4">
            <div className="text-xs uppercase tracking-wide text-neutral-500">
              Required Recovery Rate
            </div>
            <div className="mt-2 text-2xl font-bold text-white">
              {formatMoney(required_recovery_rate)}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-neutral-800 bg-black p-4 text-sm text-emerald-400">
          {highlight_insight}
        </div>
      </div>
    </section>
  );
}