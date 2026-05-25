"use client";

import CollapsibleSection from "@/components/common/CollapsibleSection";

function format_currency(value) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function get_interest_treatment_label(row) {
  switch (row?.interest_treatment) {
    case "contains_asset_finance_interest":
      return "Contains asset finance interest";
    case "no_asset_finance_interest":
      return "Does not contain asset finance interest";
    case "not_reviewed":
      return "Interest not reviewed";
    default:
      return "";
  }
}

function SummaryRow({ row }) {
  const interest_treatment_label = get_interest_treatment_label(row);

  return (
    <div className="labour-summary-table-row">
      <div className="labour-summary-table-label">
        <div>{row.label}</div>

        {row.is_synced_from_pnl ? (
          <div className="ui-help">Synced from P&amp;L</div>
        ) : null}

        {interest_treatment_label ? (
          <div className="ui-help">{interest_treatment_label}</div>
        ) : null}

        {row.system_allocation_label ? (
          <div className="ui-help">
            System allocation: {row.system_allocation_label}
          </div>
        ) : null}
      </div>

      <div className="labour-summary-table-value">{row.amount_display}</div>
    </div>
  );
}

function format_pool_status(status) {
  const labels = {
    unallocated: "Unallocated",
    partially_allocated: "Partially allocated",
    fully_allocated: "Fully allocated",
    over_allocated: "Over allocated",
  };

  return labels[status] || "Unallocated";
}

function AllocationPoolSummary({ group }) {
  return (
    <div className="ui-readonly">
      <div className="grid grid-cols-1 gap-2">
        <div>
          <span className="ui-label">P&amp;L source total</span>
          <div className="mt-1 text-sm text-[var(--text-primary)]">
            {format_currency(group.source_total_amount)}
          </div>
        </div>

        <div>
          <span className="ui-label">Allocation pool used</span>
          <div className="mt-1 text-sm text-[var(--text-primary)]">
            {format_currency(group.allocation_pool_used)}
          </div>
        </div>

        <div>
          <span className="ui-label">Remaining as general overhead</span>
          <div className="mt-1 text-sm text-[var(--text-primary)]">
            {format_currency(group.allocation_pool_remaining)}
          </div>
        </div>

        <div>
          <span className="ui-label">Status</span>
          <div className="mt-1 text-sm text-[var(--text-primary)]">
            {format_pool_status(group.allocation_pool_status)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GeneralOverheadSummaryCard({
  total_general_overheads,
  total_general_overheads_display,
  grouped_overhead_rows = [],
  output_contract,
}) {
  return (
    <div className="ui-card ui-stack">
      <div className="ui-stack-sm">
        <div className="ui-kicker">Summary</div>
        <div className="ui-card-title">General Overheads Summary</div>

        <p className="ui-help">
          Locked downstream total for Cost Summary consumption.
        </p>

        <p className="ui-help">
          Asset finance / interest lines are excluded from this total when
          selected. They are reviewed separately against the Assets module
          finance / interest cost in Model Readiness.
        </p>
      </div>

      <div className="ui-panel ui-stack-sm">
        <div className="ui-label">Net General Overheads</div>
        <div className="ui-display">{total_general_overheads_display}</div>

        <p className="ui-help">
          This is the net overhead total sent to Cost Summary after any selected
          asset finance / interest amount has been removed from General
          Overheads.
        </p>
      </div>

      <div className="ui-stack-sm">
        {grouped_overhead_rows.map((group) => (
          <CollapsibleSection
            key={group.category_key}
            title={group.category_label}
            summary={group.total_amount_display}
            defaultOpen={false}
          >
            <div className="ui-panel ui-stack-sm">
              <AllocationPoolSummary group={group} />

              {group.rows.length === 0 ? (
                <div className="ui-help">No items in this category yet.</div>
              ) : (
                <div className="labour-summary-table">
                  {group.rows.map((row) => (
                    <SummaryRow key={row.key} row={row} />
                  ))}
                </div>
              )}
            </div>
          </CollapsibleSection>
        ))}
      </div>

      <div className="ui-panel ui-stack-sm">
        <div className="ui-label">Output Contract</div>

        <div className="ui-readonly">
          total_general_overheads = {format_currency(total_general_overheads)}
        </div>

        <p className="ui-help">
          This contract value is the net General Overheads amount consumed
          downstream.
        </p>

        {output_contract?.overhead_rows ? (
          <div className="ui-help">
            {output_contract.overhead_rows.length} overhead rows included in the
            current output.
          </div>
        ) : null}

        {output_contract?.asset_overhead_pools ? (
          <div className="ui-stack-sm">
            <div className="ui-label">Asset overhead pools</div>

            {Object.entries(output_contract.asset_overhead_pools).map(
              ([pool_key, pool]) => (
                <div key={pool_key} className="ui-readonly">
                  <div className="ui-row-between">
                    <span>{pool.label}</span>
                    <span>{format_currency(pool.amount)}</span>
                  </div>
                </div>
              ),
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}