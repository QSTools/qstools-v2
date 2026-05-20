"use client";

import CollapsibleSection from "@/components/common/CollapsibleSection";
import GeneralOverheadReclassificationRow from "./GeneralOverheadReclassificationRow";

function format_currency(value) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function format_status(value) {
  const label_map = {
    unallocated: "Unallocated",
    partially_allocated: "Partially assigned",
    fully_allocated: "Fully assigned",
    over_allocated: "Over assigned",
  };

  return label_map[value] || "Not reviewed";
}

function AllocationSummary({ group }) {
  const source_total = Number(group?.source_total_amount ?? 0);
  const assigned_amount = Number(group?.assigned_amount ?? 0);
  const asset_pool_used = Number(group?.allocation_pool_used ?? 0);
  const remaining = Number(group?.remaining_amount ?? 0);

  return (
    <div className="ui-readonly">
      <div className="ui-stack-sm">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {group.category_label} allocation summary
          </p>
          <p className="ui-help">
            Assign portions of this overhead pool to the correct system type.
            This does not change the P&amp;L total or Cost Summary.
          </p>
        </div>

        <div className="labour-summary-table">
          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">
              P&amp;L source total
            </div>
            <div className="labour-summary-table-value">
              {format_currency(source_total)}
            </div>
          </div>

          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">Assigned amount</div>
            <div className="labour-summary-table-value">
              {format_currency(assigned_amount)}
            </div>
          </div>

          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">
              Asset-related pool amount
            </div>
            <div className="labour-summary-table-value">
              {format_currency(asset_pool_used)}
            </div>
          </div>

          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">
              Remaining unassigned
            </div>
            <div className="labour-summary-table-value">
              {format_currency(remaining)}
            </div>
          </div>

          <div className="labour-summary-table-row total">
            <div className="labour-summary-table-label">Allocation status</div>
            <div className="labour-summary-table-value">
              {format_status(group?.allocation_pool_status)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GeneralOverheadReclassificationGroup({
  group,
  on_move_row,
  on_change_row_amount,
  on_change_system_allocation_type,
}) {
  function handle_drag_over(event) {
    event.preventDefault();
  }

  function handle_drop(event) {
    event.preventDefault();

    try {
      const data = JSON.parse(event.dataTransfer.getData("application/json"));

      if (!data?.row_key) return;

      on_move_row({ key: data.row_key }, group.category_key);
    } catch {
      // ignore invalid drag payload
    }
  }

  return (
    <div
      className="ui-panel"
      onDragOver={handle_drag_over}
      onDrop={handle_drop}
    >
      <CollapsibleSection
        title={group.category_label}
        summary={group.total_amount_display}
        defaultOpen={false}
      >
        {group.rows.length ? (
          <div className="ui-stack-sm">
            <AllocationSummary group={group} />

            {group.rows.map((row) => (
              <GeneralOverheadReclassificationRow
                key={row.key}
                row={row}
                on_move_row={on_move_row}
                on_change_row_amount={on_change_row_amount}
                on_change_system_allocation_type={
                  on_change_system_allocation_type
                }
              />
            ))}
          </div>
        ) : (
          <div className="ui-help">No items in this category</div>
        )}
      </CollapsibleSection>
    </div>
  );
}