import { formatCurrency } from "@/lib/calculations/rateBuilderCalculations";

export default function RateBuilderLabourBreakdown({ labour_breakdown }) {
  if (!labour_breakdown) {
    return null;
  }

  const { rows, is_complete, issue_message, charge_rate, floor_rate } =
    labour_breakdown;

  return (
    <>
      {!is_complete ? (
        <p className="mt-4 text-xs text-amber-300">
          Labour is incomplete. {issue_message}
        </p>
      ) : null}

      {rows.length > 0 ? (
        <details className="mt-4 overflow-hidden rounded-xl border border-slate-800/80">
          <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-slate-200">
            Labour by staff type
            {is_complete
              ? ` - ${formatCurrency(charge_rate)}/hr charge, ${formatCurrency(floor_rate)}/hr cost`
              : " - incomplete"}
          </summary>

          <div className="grid grid-cols-5 border-t border-slate-800/80 bg-slate-950/40 text-xs font-semibold text-slate-300">
            <div className="px-3 py-2">Staff type</div>
            <div className="px-3 py-2 text-right">Hours</div>
            <div className="px-3 py-2 text-right">Charge / hr</div>
            <div className="px-3 py-2 text-right">Cost / hr</div>
            <div className="px-3 py-2 text-right">Per group hr</div>
          </div>

          {rows.map((row) => (
            <div
              key={row.staff_type_id}
              className="grid grid-cols-5 border-t border-slate-800/80 text-xs"
            >
              <div className="px-3 py-2 font-semibold text-slate-200">
                {row.staff_type_name}
              </div>
              <div className="px-3 py-2 text-right text-slate-100">
                {Math.round(row.assigned_hours).toLocaleString()}
              </div>
              {row.is_priced ? (
                <>
                  <div className="px-3 py-2 text-right text-slate-100">
                    {formatCurrency(row.charge_out_rate)}
                  </div>
                  <div className="px-3 py-2 text-right text-slate-100">
                    {formatCurrency(row.floor_rate)}
                  </div>
                  <div className="px-3 py-2 text-right text-slate-100">
                    {formatCurrency(row.charge_in_group)}
                  </div>
                </>
              ) : (
                <div className="col-span-3 px-3 py-2 text-right text-amber-300">
                  Unpriced - {row.issue}
                </div>
              )}
            </div>
          ))}

          <div className="grid grid-cols-5 border-t border-slate-800/80 text-xs font-semibold">
            <div className="px-3 py-2 text-cyan-300">Group labour / hr</div>
            <div className="px-3 py-2 text-right text-slate-100">
              {Math.round(labour_breakdown.total_assigned_hours).toLocaleString()}
            </div>
            {is_complete ? (
              <div className="col-span-3 px-3 py-2 text-right text-cyan-300">
                {formatCurrency(charge_rate)} charge / {formatCurrency(floor_rate)} cost
              </div>
            ) : (
              <div className="col-span-3 px-3 py-2 text-right text-amber-300">
                Incomplete
              </div>
            )}
          </div>
        </details>
      ) : null}
    </>
  );
}