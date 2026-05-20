"use client";

import CollapsibleSection from "@/components/common/CollapsibleSection";
import GeneralOverheadReclassificationRow from "./GeneralOverheadReclassificationRow";

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
      const data = JSON.parse(
        event.dataTransfer.getData("application/json")
      );

      if (!data?.row_key) return;

      on_move_row(
        { key: data.row_key },
        group.category_key
      );
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
          <div className="ui-help">
            No items in this category
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
}
