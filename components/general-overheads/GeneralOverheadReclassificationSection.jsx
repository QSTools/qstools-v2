"use client";

import GeneralOverheadReclassificationGroup from "./GeneralOverheadReclassificationGroup";

function resolve_row_amount_change(form, row, value) {
  if (row.is_custom) {
    form.update_custom_item(row.key, "custom_overhead_amount", value);
    return;
  }

  form.update_field(row.key, value);
}

export default function GeneralOverheadReclassificationSection({
  reclassification,
  form,
}) {
  function handle_move_row(row, category_key) {
    reclassification.update_category_override(row.key, category_key);
  }

  function handle_change_row_amount(row, value) {
    resolve_row_amount_change(form, row, value);
  }

  return (
    <div className="ui-panel ui-stack-sm">
      <div className="ui-kicker">Working Layer</div>
      <div className="ui-card-title-sm">
        {reclassification.title}
      </div>
      <p className="ui-help">
        {reclassification.help_text}
      </p>

      <div className="ui-stack">
        {reclassification.grouped_overhead_rows?.map((group) => (
          <GeneralOverheadReclassificationGroup
            key={group.category_key}
            group={group}
            on_move_row={handle_move_row}
            on_change_row_amount={handle_change_row_amount}
          />
        ))}
      </div>
    </div>
  );
}