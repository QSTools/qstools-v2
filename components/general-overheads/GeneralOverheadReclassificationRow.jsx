"use client";

import {
  format_number_with_commas,
  parse_number_string,
} from "@/lib/formatters/numberFormatters";

export default function GeneralOverheadReclassificationRow({
  row,
  on_move_row,
  on_change_row_amount,
  on_change_system_allocation_type,
}) {
  function handle_drag_start(event) {
    event.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        row_key: row.key,
        source_category_key: row.effective_category_key,
      })
    );
  }

  function handle_change_category(event) {
    on_move_row(row, event.target.value);
  }

  function handle_change_amount(event) {
    const raw_value = parse_number_string(event.target.value);
    on_change_row_amount(row, raw_value);
  }

  function handle_change_system_allocation_type(event) {
    on_change_system_allocation_type(row, event.target.value);
  }

  const amount_label = row.is_balanced_parent_pool
    ? "Remaining amount"
    : "Amount";

  const amount_help = row.is_balanced_parent_pool
    ? "This is the unassigned balance left in the pool after the split rows below."
    : row.is_pool_split_row
      ? "Enter the portion of the parent pool assigned to this line. This does not change Cost Summary."
      : "Enter the overhead amount for this line.";

  return (
    <div
      className="ui-panel ui-stack-sm"
      draggable
      onDragStart={handle_drag_start}
    >
      <div className="ui-row-between">
        <div className="ui-stack-sm">
          <div className="ui-label">{row.label}</div>

          <div className="ui-help">Current: {row.effective_category_label}</div>

          {row.is_reclassified && (
            <div className="ui-help">From: {row.default_category_label}</div>
          )}
        </div>

        <div className="ui-help">Drag</div>
      </div>

      <label className="ui-field">
        <span className="ui-label">{amount_label}</span>
        <input
          type="text"
          inputMode="decimal"
          className="ui-input"
          value={format_number_with_commas(row.amount)}
          onChange={handle_change_amount}
          readOnly={row.is_balanced_parent_pool}
        />
      </label>

      <label className="ui-field">
        <span className="ui-label">Move to</span>
        <select
          className="ui-input"
          value={row.effective_category_key}
          onChange={handle_change_category}
        >
          {row.category_options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <label className="ui-field">
        <span className="ui-label">System allocation type</span>
        <select
          className="ui-input"
          value={row.system_allocation_type}
          onChange={handle_change_system_allocation_type}
        >
          {row.system_allocation_options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <div className="ui-help">{amount_help}</div>
    </div>
  );
}