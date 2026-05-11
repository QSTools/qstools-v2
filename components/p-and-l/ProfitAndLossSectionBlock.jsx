"use client";

import CollapsibleSection from "@/components/common/CollapsibleSection";
import ProfitAndLossCostOfSalesGroup from "@/components/p-and-l/ProfitAndLossCostOfSalesGroup";
import ProfitAndLossCustomDirectCostCategoryPanel from "@/components/p-and-l/ProfitAndLossCustomDirectCostCategoryPanel";
import ProfitAndLossLineRow from "@/components/p-and-l/ProfitAndLossLineRow";
import ProfitAndLossOperatingExpenseGroup from "@/components/p-and-l/ProfitAndLossOperatingExpenseGroup";
import {
  detect_operating_expense_subcategory,
  infer_category_from_line_name,
  infer_direct_cost_category_id,
  is_wip_line,
  get_suggested_category_text,
} from "@/lib/p-and-l/profitAndLossClassificationRules";
import {
  group_cost_of_sales_lines,
  group_operating_expense_lines,
} from "@/lib/p-and-l/profitAndLossGroupingRules";

function get_section_lines(pnl_lines = [], section) {
  return (pnl_lines ?? []).filter((line) => line.section === section);
}

function get_section_title(section) {
  switch (section) {
    case "trading_income":
      return "Trading Income";
    case "cost_of_sales":
      return "Cost of Sales";
    case "other_income":
      return "Other Income";
    case "operating_expenses":
      return "Operating Expenses";
    default:
      return "Section";
  }
}

function get_section_help(section) {
  switch (section) {
    case "trading_income":
      return "Enter income lines as they appear on your P&L.";
    case "cost_of_sales":
      return "Classify the costs directly attached to producing, buying, or delivering what you sell.";
    case "other_income":
      return "Enter any non-trading income shown on the P&L.";
    case "operating_expenses":
      return "Classify costs to drive Labour, Assets, and General Overheads setup.";
    default:
      return "";
  }
}

function get_section_default_open(section) {
  switch (section) {
    case "trading_income":
    case "cost_of_sales":
    case "other_income":
    case "operating_expenses":
    default:
      return false;
  }
}

export default function ProfitAndLossSectionBlock({
  section,
  state,
  category_options,
  actions,
  summary = {},
}) {
  const lines = get_section_lines(state.pnl_lines, section);
  const title = get_section_title(section);
  const help = get_section_help(section);

  let subtotal_label = "";
  let subtotal_value = "";

  if (section === "trading_income") {
    subtotal_label = "Total Trading Income";
    subtotal_value = summary.total_trading_income;
  } else if (section === "cost_of_sales") {
    subtotal_label = "Total Cost of Sales";
    subtotal_value = summary.total_cost_of_sales;
  } else if (section === "other_income") {
    subtotal_label = "Total Other Income";
    subtotal_value = summary.total_other_income;
  } else if (section === "operating_expenses") {
    subtotal_label = "Total Operating Expenses";
    subtotal_value = summary.total_operating_expenses;
  }

  function handle_line_name_change(line, next_line_name) {
    actions.update_pnl_line(line.pnl_line_id, "line_name", next_line_name);

    if (
      is_wip_line(next_line_name) &&
      (line.category === "unassigned" || !line.category)
    ) {
      actions.update_pnl_line(
        line.pnl_line_id,
        "category",
        "review_required",
      );
      return;
    }

    if (line.section === "cost_of_sales") {
      if (line.category === "unassigned" || !line.category) {
        const direct_cost_category_id =
          infer_direct_cost_category_id(next_line_name);

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
      }

      return;
    }

    const specific_classification = detect_operating_expense_subcategory(
      next_line_name,
    );

    const suggested_category =
      specific_classification?.category ||
      infer_category_from_line_name(next_line_name);

    if (!suggested_category) return;

    const current_category = line.category ?? "unassigned";
    const is_current_manual =
      current_category !== "unassigned" && current_category !== "";

    if (!is_current_manual) {
      actions.update_pnl_line(
        line.pnl_line_id,
        "category",
        suggested_category,
      );

      if (specific_classification?.subcategory) {
        actions.update_pnl_line(
          line.pnl_line_id,
          "review_subcategory",
          specific_classification.subcategory,
        );
      }
    }
  }

  const operating_expense_groups = group_operating_expense_lines(lines);
  const cost_of_sales_groups = group_cost_of_sales_lines(state, lines);

  return (
    <CollapsibleSection
      title={title}
      summary={help}
      defaultOpen={get_section_default_open(section)}
    >
      <div className="ui-stack">
        <div className="ui-actions">
          <div className="ui-stack-sm">
            <span className="ui-kicker">{title}</span>
          </div>

          <button
            type="button"
            className="ui-button-secondary"
            onClick={() => actions.add_pnl_line(section)}
          >
            Add Custom Line
          </button>
        </div>

        {section === "cost_of_sales" ? (
          <div className="ui-panel ui-stack-sm">
            <div className="ui-label">Direct cost classification</div>
            <div className="ui-help">
              Start with the main Cost of Sales categories. Open a category only
              when you need to review or reclassify the lines inside it.
            </div>
            <div className="ui-help">
              These are the costs directly attached to producing, buying, or
              delivering what you sell.
            </div>
          </div>
        ) : null}

        {section === "operating_expenses" ? (
          <div className="ui-panel ui-stack-sm">
            <div className="ui-label">Important</div>
            <div className="ui-help">
              This is the most important classification section on the page.
            </div>
            <div className="ui-help">
              Salary &amp; Wages, KiwiSaver, ESCT, and ACC usually belong in{" "}
              <strong>Labour</strong>.
            </div>
            <div className="ui-help">
              PPE, uniforms, training, tools, staff support costs, phones, and
              shared staff overheads usually belong in{" "}
              <strong>General Overheads</strong>.
            </div>
            <div className="ui-help">
              Vehicle fuel, licences, registrations, repairs, and maintenance
              usually belong in <strong>General Overheads</strong> for the macro
              setup layer.
            </div>
            <div className="ui-help">
              Owned plant, equipment, asset finance, and asset ownership costs
              usually belong in <strong>Assets</strong>.
            </div>
            <div className="ui-help">
              If classification is wrong here, the next modules will not line up
              properly.
            </div>
          </div>
        ) : null}

        {section === "cost_of_sales" ? (
          <div className="ui-stack-sm">
            {cost_of_sales_groups.map((group) => (
              <ProfitAndLossCostOfSalesGroup
                key={group.key}
                group={group}
                state={state}
                actions={actions}
                handle_line_name_change={handle_line_name_change}
              />
            ))}

            <ProfitAndLossCustomDirectCostCategoryPanel
              state={state}
              actions={actions}
            />
          </div>
        ) : section === "operating_expenses" ? (
          <div className="ui-stack-sm">
            {operating_expense_groups.map((group) => (
              <ProfitAndLossOperatingExpenseGroup
                key={group.key}
                title={group.title}
                help={group.help}
                lines={group.lines}
                category_options={category_options}
                actions={actions}
                handle_line_name_change={handle_line_name_change}
                get_suggested_category_text={get_suggested_category_text}
                defaultOpen={group.defaultOpen}
              />
            ))}
          </div>
        ) : (
          <div className="ui-stack-sm">
            {lines.map((line) => (
              <ProfitAndLossLineRow
                key={line.pnl_line_id}
                line={line}
                state={state}
                category_options={category_options}
                actions={actions}
                handle_line_name_change={handle_line_name_change}
              />
            ))}
          </div>
        )}

        <div className="ui-actions justify-end">
          <button
            type="button"
            className="ui-button-secondary"
            onClick={() => actions.add_pnl_line(section)}
          >
            Add Custom Line
          </button>
        </div>

        <div className="ui-panel ui-stack-sm">
          <span className="ui-label">{subtotal_label}</span>
          <div>{subtotal_value}</div>
        </div>
      </div>
    </CollapsibleSection>
  );
}
