import {
  DEFAULT_DIRECT_COST_CATEGORIES,
  DEFAULT_PROFIT_AND_LOSS_STATE,
  make_direct_cost_category_id,
} from "@/lib/storage/profit-and-loss/profitAndLossDefaults";

function get_legacy_direct_cost_category_id(category = "") {
  switch (category) {
    case "cogs_materials":
      return "materials";
    case "cogs_subcontract":
      return "subcontract_labour";
    case "cogs_hire":
      return "hired_equipment_plant";
    case "cogs":
      return "other_direct_costs";
    default:
      return "";
  }
}

export function normalize_direct_cost_categories(categories = []) {
  const seen = new Set();
  const normalized = [];

  [...DEFAULT_DIRECT_COST_CATEGORIES, ...(categories ?? [])].forEach((category) => {
    const category_name = String(category?.category_name || "").trim();
    const category_id =
      category?.category_id || make_direct_cost_category_id(category_name);

    if (!category_id || seen.has(category_id)) return;

    seen.add(category_id);
    normalized.push({
      category_id,
      category_name:
        category_name ||
        DEFAULT_DIRECT_COST_CATEGORIES.find(
          (item) => item.category_id === category_id,
        )?.category_name ||
        "Custom direct cost",
      is_default: Boolean(
        category?.is_default ??
          DEFAULT_DIRECT_COST_CATEGORIES.some(
            (item) => item.category_id === category_id,
          ),
      ),
      is_active: category?.is_active !== false,
      created_at: category?.created_at || "",
      updated_at: category?.updated_at || "",
    });
  });

  return normalized;
}

function normalize_interest_treatment(value) {
  switch (value) {
    case "asset_finance_exclude":
      return "contains_asset_finance_interest";
    case "general_overhead_keep":
      return "no_asset_finance_interest";
    case "unknown":
    case "not_reviewed":
    case undefined:
    case null:
    case "":
      return "not_reviewed";
    default:
      return value;
  }
}

export function sanitize_profit_and_loss_state(input = {}) {
  const fallback = DEFAULT_PROFIT_AND_LOSS_STATE;

  return {
    ...fallback,
    ...input,
    financial_year: input?.financial_year ?? fallback.financial_year,
    period_month: input?.period_month ?? fallback.period_month,
    direct_cost_categories: normalize_direct_cost_categories(
      input?.direct_cost_categories ?? fallback.direct_cost_categories,
    ),
    pnl_lines: Array.isArray(input?.pnl_lines)
      ? input.pnl_lines.map((line) => ({
          ...line,
          category:
            line?.category === "employee_overheads"
              ? "general_overheads"
              : line?.category === "cogs_materials" ||
                  line?.category === "cogs_subcontract" ||
                  line?.category === "cogs_hire"
                ? "cogs"
              : line?.category ?? "unassigned",
          interest_treatment: normalize_interest_treatment(
            line?.interest_treatment,
          ),
          direct_cost_category_id:
            line?.direct_cost_category_id ||
            get_legacy_direct_cost_category_id(line?.category),
        }))
      : fallback.pnl_lines,
  };
}
