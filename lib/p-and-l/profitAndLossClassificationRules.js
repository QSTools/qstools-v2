export function normalize_line_name(value = "") {
  return String(value).trim().toLowerCase();
}

export function is_wip_line(line_name = "") {
  const normalized = normalize_line_name(line_name);

  return (
    normalized.includes("wip") ||
    normalized.includes("work in progress") ||
    normalized.includes("opening wip") ||
    normalized.includes("closing wip") ||
    normalized.includes("wip adjustment")
  );
}

export function infer_category_from_line_name(line_name = "") {
  const normalized = normalize_line_name(line_name);

  if (!normalized) return null;

  if (is_wip_line(line_name)) {
    return null;
  }

  if (
    normalized.includes("salary") ||
    normalized.includes("salaries") ||
    normalized.includes("wages") ||
    normalized.includes("payroll") ||
    normalized.includes("kiwisaver") ||
    normalized.includes("kiwi saver") ||
    normalized.includes("esct") ||
    normalized.includes("acc levy") ||
    normalized.includes("acc ") ||
    normalized === "acc"
  ) {
    return "labour";
  }

  if (
    normalized.includes("uniform") ||
    normalized.includes("training") ||
    normalized.includes("ppe") ||
    normalized.includes("tool") ||
    normalized.includes("tools") ||
    normalized.includes("small equipment")
  ) {
    return "general_overheads";
  }

  if (
    normalized.includes("fuel") ||
    normalized.includes("diesel") ||
    normalized.includes("petrol") ||
    normalized.includes("motor vehicle") ||
    normalized.includes("vehicle") ||
    normalized.includes("registration") ||
    normalized.includes("registrations") ||
    normalized.includes("rego") ||
    normalized.includes("licence") ||
    normalized.includes("licences") ||
    normalized.includes("license") ||
    normalized.includes("licenses") ||
    normalized.includes("repair") ||
    normalized.includes("repairs") ||
    normalized.includes("maintenance") ||
    normalized.includes("servicing")
  ) {
    return "general_overheads";
  }

  if (
    normalized.includes("plant") ||
    normalized.includes("asset finance") ||
    normalized.includes("equipment finance") ||
    normalized.includes("finance lease") ||
    normalized.includes("lease interest") ||
    normalized.includes("ownership")
  ) {
    return "assets";
  }

  if (
    normalized.includes("insurance") ||
    normalized.includes("phone") ||
    normalized.includes("telephone") ||
    normalized.includes("internet") ||
    normalized.includes("office") ||
    normalized.includes("accounting") ||
    normalized.includes("legal") ||
    normalized.includes("subscription") ||
    normalized.includes("bank fees") ||
    normalized.includes("admin") ||
    normalized.includes("advertising") ||
    normalized.includes("software")
  ) {
    return "general_overheads";
  }

  return null;
}

export function infer_direct_cost_category_id(line_name = "") {
  const normalized = normalize_line_name(line_name);

  if (!normalized) return "other_direct_costs";

  if (
    normalized.includes("material") ||
    normalized.includes("materials") ||
    normalized.includes("purchase") ||
    normalized.includes("purchases") ||
    normalized.includes("stock") ||
    normalized.includes("supplies")
  ) {
    return "materials";
  }

  if (
    normalized.includes("subcontract") ||
    normalized.includes("sub contractor") ||
    normalized.includes("contractor") ||
    normalized.includes("labour hire")
  ) {
    return "subcontract_labour";
  }

  if (
    normalized.includes("hire") ||
    normalized.includes("equipment hire") ||
    normalized.includes("plant hire") ||
    normalized.includes("machine hire") ||
    normalized.includes("scaffold")
  ) {
    return "hired_equipment_plant";
  }

  if (
    normalized.includes("freight") ||
    normalized.includes("cartage") ||
    normalized.includes("delivery") ||
    normalized.includes("transport")
  ) {
    return "freight_cartage";
  }

  if (
    normalized.includes("waste") ||
    normalized.includes("tipping") ||
    normalized.includes("tip") ||
    normalized.includes("dump") ||
    normalized.includes("disposal")
  ) {
    return "waste_tipping";
  }

  if (
    normalized.includes("consumable") ||
    normalized.includes("consumables") ||
    normalized.includes("sundry") ||
    normalized.includes("fixings") ||
    normalized.includes("adhesive")
  ) {
    return "direct_consumables";
  }

  return "other_direct_costs";
}

export function get_category_help_text(category) {
  switch (category) {
    case "revenue":
      return "P&L benchmark only. This stays on the P&L page as income context.";
    case "labour":
      return "Feeds the Labour benchmark. Use for wages and direct labour burden.";
    case "assets":
      return "Feeds the Assets benchmark. Use for owned plant, equipment, asset finance, and ownership-related costs.";
    case "general_overheads":
      return "Feeds the General Overheads benchmark. Use for business-wide overheads, staff overheads, shared vehicle running costs, office, admin, insurance, and compliance.";
    case "review_required":
      return "Review required. This line needs further review before model assignment.";
    case "excluded":
      return "Excluded from Mirra cost model. This cost will not be included in the recovery benchmark.";
    case "cogs":
      return "Included as Materials / Cost of Goods Sold for benchmark and reconciliation.";
    case "income":
      return "Income / Revenue Timing Adjustment. This line is treated as timing-related revenue rather than an operating cost.";
    case "unassigned":
    default:
      return "Not ready yet. Leave here only if you still need to decide where this line belongs.";
  }
}

export function detect_operating_expense_subcategory(line_name = "") {
  const normalized = String(line_name).trim().toLowerCase();

  if (
    normalized.includes("salary") ||
    normalized.includes("wages") ||
    normalized.includes("payroll")
  ) {
    return {
      category: "labour",
      subcategory: "salary_wages",
      label: "Salary & Wages",
    };
  }

  if (normalized.includes("kiwisaver") || normalized.includes("kiwi saver")) {
    return {
      category: "labour",
      subcategory: "employer_kiwisaver",
      label: "KiwiSaver",
    };
  }

  if (normalized.includes("acc levy") || normalized.includes("acc ")) {
    return {
      category: "labour",
      subcategory: "employer_acc",
      label: "ACC Levy",
    };
  }

  if (
    normalized.includes("staff expense") ||
    normalized.includes("staff expenses") ||
    normalized.includes("staff welfare") ||
    normalized.includes("staff amenities") ||
    normalized.includes("staff support")
  ) {
    return {
      category: "general_overheads",
      subcategory: "staff_overheads",
      label: "Staff Overheads",
    };
  }

  if (normalized.includes("entertainment")) {
    return {
      category: "general_overheads",
      subcategory: "staff_overheads",
      label: "Entertainment",
    };
  }

  if (
    normalized.includes("fuel") ||
    normalized.includes("diesel") ||
    normalized.includes("petrol") ||
    normalized.includes("motor vehicle") ||
    normalized.includes("vehicle") ||
    normalized.includes("registration") ||
    normalized.includes("registrations") ||
    normalized.includes("rego") ||
    normalized.includes("licence") ||
    normalized.includes("licences") ||
    normalized.includes("license") ||
    normalized.includes("licenses") ||
    normalized.includes("repair") ||
    normalized.includes("repairs") ||
    normalized.includes("maintenance") ||
    normalized.includes("servicing")
  ) {
    return {
      category: "general_overheads",
      subcategory: "vehicle_running_costs",
      label: "Vehicle Running Costs",
    };
  }

  if (
    normalized.includes("computer") ||
    normalized.includes("printing") ||
    normalized.includes("stationery") ||
    normalized.includes("office") ||
    normalized.includes("supplies") ||
    normalized.includes("phone") ||
    normalized.includes("telephone") ||
    normalized.includes("internet") ||
    normalized.includes("software") ||
    normalized.includes("subscription")
  ) {
    return {
      category: "general_overheads",
      subcategory: "office_admin",
      label: "Office / Admin",
    };
  }

  if (
    normalized.includes("asset finance") ||
    normalized.includes("equipment finance") ||
    normalized.includes("finance lease")
  ) {
    return {
      category: "assets",
      subcategory: "asset_finance",
      label: "Asset Finance",
    };
  }

  if (normalized.includes("mixed") || normalized.includes("mixed finance")) {
    return {
      category: "review_required",
      subcategory: "mixed_finance",
      label: "Mixed Finance",
    };
  }

  if (normalized.includes("accounting") || normalized.includes("bookkeeper")) {
    return {
      category: "general_overheads",
      subcategory: "finance_admin",
      label: "Accounting / Admin",
    };
  }

  if (
    normalized.includes("bank fees") ||
    normalized.includes("loan interest") ||
    normalized.includes("finance") ||
    normalized.includes("interest")
  ) {
    return {
      category: "general_overheads",
      subcategory: "finance_interest",
      label: "Finance / Interest",
    };
  }

  if (normalized.includes("insurance")) {
    return {
      category: "general_overheads",
      subcategory: "insurance_compliance",
      label: "Insurance / Compliance",
    };
  }

  if (
    normalized.includes("legal") ||
    normalized.includes("compliance") ||
    normalized.includes("audit")
  ) {
    return {
      category: "general_overheads",
      subcategory: "insurance_compliance",
      label: "Insurance / Compliance",
    };
  }

  if (normalized.includes("travel")) {
    return {
      category: "general_overheads",
      subcategory: "travel",
      label: "Travel",
    };
  }

  if (normalized.includes("advertising") || normalized.includes("marketing")) {
    return {
      category: "general_overheads",
      subcategory: "sales_growth",
      label: "Sales / Growth",
    };
  }

  if (
    normalized.includes("penalt") ||
    normalized.includes("fee") ||
    normalized.includes("fine") ||
    normalized.includes("non-deductible")
  ) {
    return {
      category: "excluded",
      subcategory: "penalties_non_deductible",
      label: "Penalties / Non-Deductible",
    };
  }

  if (
    normalized.includes("excluded") ||
    normalized.includes("non-qs") ||
    normalized.includes("non qs")
  ) {
    return {
      category: "excluded",
      subcategory: "excluded_non_qs",
      label: "Excluded / Non-QS Cost",
    };
  }

  if (normalized.includes("other") || normalized.includes("review required")) {
    return {
      category: "review_required",
      subcategory: "other_review_required",
      label: "Other / Review Required",
    };
  }

  return null;
}

export function build_line_category_options(line, category_options) {
  if (is_wip_line(line.line_name)) {
    return [
      {
        value: "review_required",
        label: "WIP / Accounting Adjustment",
        review_subcategory: "wip_accounting_adjustment",
        wip_treatment: "unresolved",
      },
      {
        value: "excluded",
        label: "Exclude from Mirra Cost Model",
        review_subcategory: "wip_accounting_adjustment_excluded",
        wip_treatment: "excluded_from_qs_cost_model",
      },
      {
        value: "cogs",
        label: "Include as Materials / Cost of Goods Sold",
        review_subcategory: "wip_direct_job_cost",
        wip_treatment: "include_as_direct_job_cost",
      },
      {
        value: "income",
        label: "Income / Revenue Timing Adjustment",
        review_subcategory: "wip_income_timing_adjustment",
        wip_treatment: "income_timing_adjustment",
      },
      ...category_options,
    ];
  }

  const operating_expense_classification = detect_operating_expense_subcategory(
    line.line_name,
  );

  if (operating_expense_classification) {
    const { category, subcategory, label } = operating_expense_classification;

    return [
      {
        value: category,
        label: `${label} → ${
          category === "general_overheads"
            ? "General Overheads"
            : category === "labour"
              ? "Labour"
              : category === "assets"
                ? "Assets"
                : category === "excluded"
                  ? "Excluded"
                  : category === "review_required"
                    ? "Review Required"
                    : category
        }`,
        review_subcategory: subcategory,
      },
      ...category_options,
    ];
  }

  return category_options;
}

export function get_suggested_category_text(line_name) {
  const suggested_category = infer_category_from_line_name(line_name);

  if (!suggested_category) return null;

  switch (suggested_category) {
    case "labour":
      return "Suggested: Labour";
    case "assets":
      return "Suggested: Assets";
    case "general_overheads":
      return "Suggested: General Overheads";
    default:
      return null;
  }
}
