"use client";

import Tooltip from "@/components/common/Tooltip";
import {
  get_category_help_text,
  is_wip_line,
} from "@/lib/p-and-l/profitAndLossClassificationRules";
import {
  get_cost_of_sales_group_key,
  get_direct_cost_categories,
  get_direct_cost_category_name,
} from "@/lib/p-and-l/profitAndLossGroupingRules";
import {
  format_number_with_commas,
  parse_number_string,
} from "@/lib/formatters/numberFormatters";

function MoneyInput({ value, onChange, disabled = false }) {
  return (
    <input
      type="text"
      inputMode="decimal"
      className="ui-input"
      value={format_number_with_commas(value)}
      onChange={(event) => onChange(parse_number_string(event.target.value))}
      disabled={disabled}
    />
  );
}

export default function ProfitAndLossCostOfSalesLineRow({
  line,
  state,
  actions,
  handle_line_name_change,
}) {
  const current_group_key = get_cost_of_sales_group_key(line);
  const direct_cost_categories = get_direct_cost_categories(state);

  const select_value =
    line.category === "cogs"
      ? `direct:${current_group_key}`
      : line.category || "unassigned";

  return (
    <div key={line.pnl_line_id} className="ui-panel ui-stack-sm">
      <div className="ui-stack-sm">
        <span className="ui-label">Line Name</span>
        <input
          className="ui-input"
          value={line.line_name}
          placeholder="Enter line name"
          onChange={(event) => handle_line_name_change(line, event.target.value)}
        />
      </div>

      <div className="ui-stack-sm">
        <span className="ui-label">Amount</span>
        <MoneyInput
          value={line.amount}
          onChange={(value) =>
            actions.update_pnl_line(line.pnl_line_id, "amount", value)
          }
        />
      </div>

      <div className="ui-stack-sm">
        <span className="ui-label inline-flex items-center gap-2">
          Direct Cost Category
          <Tooltip text="This groups Cost of Sales into useful direct cost categories for Mirra's benchmark view." />
        </span>

        <select
          className="ui-select"
          value={select_value}
          onChange={(event) => {
            const selected_value = event.target.value;

            if (selected_value.startsWith("direct:")) {
              const direct_cost_category_id = selected_value.replace(
                "direct:",
                "",
              );

              actions.update_pnl_line(line.pnl_line_id, "category", "cogs");
              actions.update_pnl_line(
                line.pnl_line_id,
                "direct_cost_category_id",
                direct_cost_category_id,
              );
              actions.update_pnl_line(
                line.pnl_line_id,
                "review_subcategory",
                direct_cost_category_id,
              );
              return;
            }

            actions.update_pnl_line(
              line.pnl_line_id,
              "category",
              selected_value,
            );

            if (selected_value === "review_required") {
              actions.update_pnl_line(
                line.pnl_line_id,
                "review_subcategory",
                "direct_cost_review_required",
              );
              actions.update_pnl_line(
                line.pnl_line_id,
                "wip_treatment",
                "unresolved",
              );
            }

            if (selected_value === "excluded") {
              actions.update_pnl_line(
                line.pnl_line_id,
                "review_subcategory",
                "excluded_non_qs",
              );
            }

            if (selected_value === "unassigned") {
              actions.update_pnl_line(
                line.pnl_line_id,
                "review_subcategory",
                "",
              );
            }
          }}
        >
          {direct_cost_categories.map((category) => (
            <option
              key={category.category_id}
              value={`direct:${category.category_id}`}
            >
              {category.category_name} → Materials / Cost of Goods Sold
            </option>
          ))}

          <option value="review_required">Review required</option>
          <option value="excluded">Excluded / Non-Mirra Cost</option>
          <option value="unassigned">Unassigned</option>
        </select>

        <p className="ui-help">
          {line.category === "cogs"
            ? `${get_direct_cost_category_name(
                state,
                current_group_key,
              )} is treated as Materials / Cost of Goods Sold.`
            : get_category_help_text(line.category || "unassigned")}
        </p>
      </div>

      {is_wip_line(line.line_name) ? (
        <div className="ui-panel ui-stack-sm theme-warn-soft">
          <span className="ui-label">WIP Decision Guide</span>
          <p className="ui-help">
            Mirra cannot classify this WIP line from the P&amp;L alone. Check
            the WIP schedule, accountant journal, or source detail, then choose
            the correct treatment.
          </p>
        </div>
      ) : null}

      <div className="ui-actions">
        <button
          type="button"
          className="ui-button-danger"
          onClick={() => actions.remove_pnl_line(line.pnl_line_id)}
        >
          Remove
        </button>
      </div>
    </div>
  );
}
