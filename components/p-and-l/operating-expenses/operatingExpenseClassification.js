import { OPERATING_EXPENSE_CLASSIFICATION_OPTIONS } from "@/components/p-and-l/operating-expenses/operatingExpenseOptions";
import { detect_operating_expense_subcategory } from "@/components/p-and-l/operating-expenses/operatingExpenseDetection";

export function is_wip_line(line_name = "") {
  const normalized = String(line_name).trim().toLowerCase();

  return (
    normalized.includes("wip") ||
    normalized.includes("work in progress") ||
    normalized.includes("opening wip") ||
    normalized.includes("closing wip") ||
    normalized.includes("wip adjustment")
  );
}

export function is_interest_line(line) {
  return String(line?.line_name || "").toLowerCase().includes("interest");
}

export function get_operating_expense_classification_option_value(line) {
  const category = line.category || "unassigned";
  const subcategory = line.review_subcategory || "";
  const detected_classification = detect_operating_expense_subcategory(
    line.line_name,
  );

  if (
    detected_classification &&
    detected_classification.category === category &&
    detected_classification.subcategory === subcategory
  ) {
    const detectedOption = OPERATING_EXPENSE_CLASSIFICATION_OPTIONS.find(
      (option) =>
        option.category === category &&
        option.review_subcategory === subcategory &&
        option.label.startsWith(detected_classification.label),
    );

    if (detectedOption) {
      return detectedOption.value;
    }
  }

  const matchedOption = OPERATING_EXPENSE_CLASSIFICATION_OPTIONS.find(
    (option) =>
      option.category === category && option.review_subcategory === subcategory,
  );

  if (matchedOption) {
    return matchedOption.value;
  }

  const genericOption = OPERATING_EXPENSE_CLASSIFICATION_OPTIONS.find(
    (option) => option.value === category,
  );

  return genericOption?.value || "unassigned";
}

export function build_line_category_options(line) {
  if (is_wip_line(line.line_name)) {
    return [
      {
        value: "review_required",
        label: "WIP / Accounting Adjustment",
        category: "review_required",
        review_subcategory: "wip_accounting_adjustment",
        wip_treatment: "unresolved",
      },
      {
        value: "excluded",
        label: "Exclude from Mirra Cost Model",
        category: "excluded",
        review_subcategory: "wip_accounting_adjustment_excluded",
        wip_treatment: "excluded_from_qs_cost_model",
      },
      {
        value: "cogs",
        label: "Include as COGS / Direct Job Cost",
        category: "cogs",
        review_subcategory: "wip_direct_job_cost",
        wip_treatment: "include_as_direct_job_cost",
      },
      {
        value: "income",
        label: "Income / Revenue Timing Adjustment",
        category: "income",
        review_subcategory: "wip_income_timing_adjustment",
        wip_treatment: "income_timing_adjustment",
      },
      ...OPERATING_EXPENSE_CLASSIFICATION_OPTIONS,
    ];
  }

  const operating_expense_classification = detect_operating_expense_subcategory(
    line.line_name,
  );

  if (operating_expense_classification) {
    const { category, subcategory } = operating_expense_classification;

    const inferredOption = OPERATING_EXPENSE_CLASSIFICATION_OPTIONS.find(
      (option) =>
        option.category === category &&
        option.review_subcategory === subcategory,
    );

    return inferredOption
      ? [
          inferredOption,
          ...OPERATING_EXPENSE_CLASSIFICATION_OPTIONS.filter(
            (option) => option.value !== inferredOption.value,
          ),
        ]
      : OPERATING_EXPENSE_CLASSIFICATION_OPTIONS;
  }

  return OPERATING_EXPENSE_CLASSIFICATION_OPTIONS;
}

export function get_category_help_text(category) {
  switch (category) {
    case "labour":
      return "Feeds the Labour benchmark. Use for wages and direct staff cost.";
    case "employee_overheads":
    case "general_overheads":
      return "Feeds the General Overheads benchmark. Use for business-wide costs such as insurance, phones, internet, office, accounting, and subscriptions.";
    case "finance_interest":
    case "mixed_finance":
      return "Use when finance or interest may contain both asset-related and business finance. It will flow to General Overheads first, then asset-related portions can be assigned later.";
    case "assets":
      return "Feeds the Assets benchmark. Use for vehicle, plant, finance, running costs, repairs, maintenance, licences, registrations, and ownership costs.";
    case "review_required":
      return "Review required. This line needs further review before model assignment.";
    case "excluded":
      return "Excluded from the Mirra cost model. This cost will not be included in the recovery benchmark.";
    case "cogs":
      return "Included as COGS / Direct Job Cost for benchmark and reconciliation.";
    case "income":
      return "Income / Revenue Timing Adjustment. This line is treated as timing-related revenue rather than an operating cost.";
    case "unassigned":
    default:
      return "Not ready yet. Leave here only if you still need to decide where this line belongs.";
  }
}

export function get_option_help_text(option_value) {
  if (option_value === "mixed_finance") {
    return "Use when finance or interest may contain both asset-related and business finance. It will flow to General Overheads first, then asset-related portions can be assigned later.";
  }

  return "";
}

export function get_interest_treatment_help_text(interest_treatment) {
  switch (interest_treatment) {
    case "contains_asset_finance_interest":
    case "asset_finance_exclude":
      return "This line contains asset finance interest. Mirra keeps the full P&L interest amount and uses this flag for later comparison with Assets finance cost.";
    case "no_asset_finance_interest":
    case "general_overhead_keep":
      return "This line does not contain asset finance interest.";
    case "not_reviewed":
    case "unknown":
    default:
      return "Select whether this P&L interest line contains asset finance interest.";
  }
}

export function normalise_interest_treatment(value) {
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

