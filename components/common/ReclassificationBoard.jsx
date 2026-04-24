"use client";

import { useState } from "react";

function RowAmountInput({ row, on_change_row_amount }) {
  if (!on_change_row_amount) {
    return (
      <div className="ui-help">
        {row.amount_display}
      </div>
    );
  }

  return (
    <label className="ui-field">
      <span className="ui-label">Amount</span>
      <input
        type="number"
        inputMode="decimal"
        className="ui-input"
        value={row.amount ?? 0}
        onChange={(event) => on_change_row_amount(row, event.target.value)}
      />
    </label>
  );
}

function ReclassificationRow({
  row,
  on_move_row,
  on_change_row_amount,
  drag_state,
  set_drag_state,
}) {
  function handle_drag_start() {
    set_drag_state({
      row_key: row.key,
      source_category_key: row.effective_category_key,
    });
  }

  function handle_drag_end() {
    set_drag_state(null);
  }

  return (
    <div
      className="ui-panel ui-stack-sm"
      draggable
      onDragStart={handle_drag_start}
      onDragEnd={handle_drag_end}
    >
      <div className="ui-row-between">
        <div className="ui-stack-sm">
          <div className="ui-label">{row.label}</div>

          <div className="ui-help">
            Current category: {row.effective_category_label}
          </div>

          {row.is_reclassified ? (
            <div className="ui-help">
              Reclassified from {row.default_category_label}
            </div>
          ) : null}
        </div>

        <div className="ui-help">
          Drag to move
        </div>
      </div>

      <RowAmountInput
        row={row}
        on_change_row_amount={on_change_row_amount}
      />

      <label className="ui-field">
        <span className="ui-label">Move to category</span>
        <select
          className="ui-input"
          value={row.effective_category_key}
          onChange={(event) => on_move_row(row, event.target.value)}
        >
          {(row.category_options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function ReclassificationColumn({
  group,
  on_move_row,
  on_change_row_amount,
  drag_state,
  set_drag_state,
}) {
  function handle_drag_over(event) {
    event.preventDefault();
  }

  function handle_drop(event) {
    event.preventDefault();

    if (!drag_state?.row_key) {
      return;
    }

    if (drag_state.source_category_key === group.category_key) {
      set_drag_state(null);
      return;
    }

    on_move_row(
      { key: drag_state.row_key },
      group.category_key
    );

    set_drag_state(null);
  }

  return (
    <CollapsibleGroup
      title={group.category_label}
      summary={group.total_amount_display}
      on_drag_over={handle_drag_over}
      on_drop={handle_drop}
      is_drag_target={
        drag_state &&
        drag_state.source_category_key !== group.category_key
      }
    >
      {group.rows.length ? (
        <div className="ui-stack-sm">
          {group.rows.map((row) => (
            <ReclassificationRow
              key={row.key}
              row={row}
              on_move_row={on_move_row}
              on_change_row_amount={on_change_row_amount}
              drag_state={drag_state}
              set_drag_state={set_drag_state}
            />
          ))}
        </div>
      ) : (
        <div className="ui-help">No overhead items in this category.</div>
      )}
    </CollapsibleGroup>
  );
}

function CollapsibleGroup({
  title,
  summary,
  children,
  on_drag_over,
  on_drop,
  is_drag_target,
}) {
  return (
    <div
      className="ui-panel ui-stack-sm"
      onDragOver={on_drag_over}
      onDrop={on_drop}
      data-drag-target={is_drag_target ? "true" : "false"}
    >
      <div className="ui-row-between">
        <div className="ui-stack-sm">
          <div className="ui-card-title-sm">{title}</div>
          <div className="ui-help">{summary}</div>
        </div>
        <div className="ui-help">Drop items here</div>
      </div>

      {children}
    </div>
  );
}

export default function ReclassificationBoard({
  groups,
  on_move_row,
  on_change_row_amount,
}) {
  const [drag_state, set_drag_state] = useState(null);

  return (
    <div className="ui-stack">
      {(groups ?? []).map((group) => (
        <ReclassificationColumn
          key={group.category_key}
          group={group}
          on_move_row={on_move_row}
          on_change_row_amount={on_change_row_amount}
          drag_state={drag_state}
          set_drag_state={set_drag_state}
        />
      ))}
    </div>
  );
}