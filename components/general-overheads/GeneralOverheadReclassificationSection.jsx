"use client";

import GeneralOverheadReclassificationGroup from "./GeneralOverheadReclassificationGroup";

function resolve_row_amount_change(form, row, value) {
  if (row.is_allocation_only_amount || row.is_pool_split_row) {
    return;
  }

  if (row.is_custom) {
    form.update_custom_item(row.key, "custom_overhead_amount", value);
    return;
  }

  form.update_field(row.key, value);
}

function get_group_help_text(group) {
  switch (group.category_key) {
    case "finance_interest":
      return "Finance / Interest stays in General Overheads unless it includes asset finance. Enter only the asset finance portion that relates to vehicles, plant, equipment, or financed assets. The remaining balance stays as business finance overhead.";

    case "vehicles_running":
      return "Redistribute the fixed P&L vehicle running cost pool into fuel, repairs / maintenance, and registration / compliance. The total remains locked to the P&L source amount.";

    case "insurance_compliance":
      return "Redistribute the fixed P&L insurance / compliance pool into business insurance, vehicle / asset insurance, professional indemnity, and compliance / H&S. Compliance / H&S auto-balances.";

    default:
      return "";
  }
}

export default function GeneralOverheadReclassificationSection({
  reclassification,
  form,
}) {
  function handle_move_row(row, category_key) {
    reclassification.update_category_override(row.key, category_key);
  }

  function handle_change_row_amount(row, value) {
    if (row.is_balanced_parent_pool || row.is_pool_split_row) {
      reclassification.update_system_allocation_amount_override(row.key, value);
      return;
    }

    resolve_row_amount_change(form, row, value);
  }

  function handle_change_system_allocation_type(row, system_allocation_type) {
    reclassification.update_system_allocation_override(
      row.key,
      system_allocation_type
    );
  }

  return (
    <div className="ui-panel ui-stack-sm">
      <div className="ui-kicker">Working Layer</div>
      <div className="ui-card-title-sm">{reclassification.title}</div>
      <p className="ui-help">{reclassification.help_text}</p>

      <div className="ui-stack">
        {reclassification.grouped_overhead_rows?.map((group) => {
          const group_help_text = get_group_help_text(group);

          return (
            <div key={group.category_key} className="ui-stack-sm">
              {group_help_text ? (
                <div className="ui-readonly">
                  <div className="ui-label">{group.category_label} Review</div>
                  <div className="ui-help">{group_help_text}</div>
                </div>
              ) : null}

              <GeneralOverheadReclassificationGroup
                group={group}
                on_move_row={handle_move_row}
                on_change_row_amount={handle_change_row_amount}
                on_change_system_allocation_type={
                  handle_change_system_allocation_type
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}