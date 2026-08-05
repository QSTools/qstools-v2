function make_pnl_line_id() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `pnl_import_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function clean_amount(value) {
  if (value === null || value === undefined) return 0;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  let text = String(value).trim();
  if (!text) return 0;

  let is_negative = false;

  if (text.startsWith("(") && text.endsWith(")")) {
    is_negative = true;
    text = text.slice(1, -1);
  }

  text = text
    .replace(/\$/g, "")
    .replace(/,/g, "")
    .replace(/\s/g, "")
    .replace(/−/g, "-");

  const parsed = Number(text);
  if (!Number.isFinite(parsed)) return 0;

  return is_negative ? -Math.abs(parsed) : parsed;
}

export function make_imported_cogs_category_id(line_name) {
  const cleaned = String(line_name || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return cleaned ? `imported_cogs_${cleaned}` : "imported_cogs_review_required";
}

export function make_imported_cogs_category(line_name) {
  const category_name = String(line_name || "").trim() || "Imported cost of sales";

  return {
    category_id: make_imported_cogs_category_id(category_name),
    category_name,
    is_default: false,
    is_active: true,
    created_at: "",
    updated_at: "",
  };
}

export function infer_line_mapping(line_name) {
  const name = String(line_name || "").toLowerCase();

  if (["sales", "revenue", "turnover"].some((word) => name.includes(word))) {
    return {
      section: "trading_income",
      category: "revenue",
      direct_cost_category_id: "",
      review_subcategory: "",
    };
  }

  if (
    name.includes("other income") ||
    name.includes("interest income") ||
    name.includes("rebate")
  ) {
    return {
      section: "other_income",
      category: "unassigned",
      direct_cost_category_id: "",
      review_subcategory: "review_required",
    };
  }

  if (
    [
      "cartage",
      "freight",
      "delivery",
      "material",
      "materials",
      "concrete purchase",
      "purchase - fill",
      "purchases - fill",
      "purchase - steel",
      "purchases - steel",
      "subcontracting - general",
      "subcontracting general",
      "concrete laying",
      "concrete pumping",
      "pumping",
      "blocklaying",
      "bricklaying",
      "reinforcing",
      "waterproofing",
      "cutting",
      "sawing",
      "drilling",
      "scaffold",
      "scaffolding",
      "subcontracting - labour",
      "subcontract labour",
      "subcontracting labour",
      "subcontractor labour",
      "subcontract",
      "subcontractor",
      "subcontracting",
      "equipment hire",
      "plant hire",
      "hire",
      "waste",
      "tipping",
      "dump",
      "consumable",
      "consumables",
      "testing",
      "site works",
      "traffic",
      "temporary",
      "direct cost",
      "job cost",
      "contract cost",
      "project cost",
      "site cost",
      "opening work in progress",
      "wip",
      "purchases - other",
    ].some((word) => name.includes(word))
  ) {
    return {
      section: "cost_of_sales",
      category: "cogs",
      direct_cost_category_id: make_imported_cogs_category_id(line_name),
      review_subcategory: "",
    };
  }

  if (
    ["wages", "salary", "salaries", "payroll"].some((word) =>
      name.includes(word),
    )
  ) {
    return {
      section: "operating_expenses",
      category: "labour",
      direct_cost_category_id: "",
      review_subcategory: "salary_wages",
    };
  }

  if (name.includes("kiwisaver")) {
    return {
      section: "operating_expenses",
      category: "labour",
      direct_cost_category_id: "",
      review_subcategory: "employer_kiwisaver",
    };
  }

  if (name.includes("acc levy") || name === "acc") {
    return {
      section: "operating_expenses",
      category: "labour",
      direct_cost_category_id: "",
      review_subcategory: "employer_acc",
    };
  }

  if (name.includes("insurance")) {
    return {
      section: "operating_expenses",
      category: "general_overheads",
      direct_cost_category_id: "",
      review_subcategory: "insurance_compliance",
    };
  }

  if (name.includes("mixed finance") || name.includes("mixed")) {
    return {
      section: "operating_expenses",
      category: "general_overheads",
      direct_cost_category_id: "",
      review_subcategory: "finance_interest",
    };
  }

  if (
    ["asset finance", "equipment finance", "finance lease"].some((word) =>
      name.includes(word),
    )
  ) {
    return {
      section: "operating_expenses",
      category: "assets",
      direct_cost_category_id: "",
      review_subcategory: "asset_finance",
    };
  }

  if (
    ["bank fees", "loan interest", "finance", "interest"].some((word) =>
      name.includes(word),
    )
  ) {
    return {
      section: "operating_expenses",
      category: "general_overheads",
      direct_cost_category_id: "",
      review_subcategory: "finance_interest",
    };
  }

  if (
  ["asset finance", "equipment finance", "finance lease"].some((word) =>
    name.includes(word),
  )
) {
  return {
    section: "operating_expenses",
    category: "assets",
    direct_cost_category_id: "",
    review_subcategory: "asset_finance",
  };
}

if (
  [
    "vehicle",
    "fuel",
    "registration",
    "licence",
    "license",
    "repairs",
    "maintenance",
    "plant",
    "machinery",
  ].some((word) => name.includes(word))
) {
  return {
    section: "operating_expenses",
    category: "general_overheads",
    direct_cost_category_id: "",
    review_subcategory: "vehicle_running_costs",
  };
}

  if (
    [
      "accounting",
      "legal",
      "insurance",
      "software",
      "subscription",
      "subscriptions",
      "rent",
      "office",
      "telephone",
      "internet",
      "advertising",
      "marketing",
      "bank fees",
      "administration",
      "admin",
      "cleaning",
      "stationery",
      "storage",
      "power",
      "electricity",
    ].some((word) => name.includes(word))
  ) {
    return {
      section: "operating_expenses",
      category: "general_overheads",
      direct_cost_category_id: "",
      review_subcategory: "",
    };
  }

  return {
    section: "operating_expenses",
    category: "unassigned",
    direct_cost_category_id: "",
    review_subcategory: "review_required",
  };
}

export function normalise_direct_cost_categories(categories = []) {
  const seen = new Set();

  return (categories ?? []).filter((category) => {
    const category_id = category?.category_id || "";

    if (!category_id || seen.has(category_id) || category?.is_active === false) {
      return false;
    }

    seen.add(category_id);
    return true;
  });
}

export function normalise_import_line(item = {}) {
  const line_name = item.line_name || item.name || item.description || "";
  const inferred = infer_line_mapping(line_name);
  const is_insurance_operating_expense = String(line_name || "")
    .toLowerCase()
    .includes("insurance");
  const normalised_line_name = String(line_name || "").toLowerCase();

  let section = item.section || inferred.section;
  let category = item.category || inferred.category;
  let direct_cost_category_id =
    item.direct_cost_category_id || inferred.direct_cost_category_id || "";
  let review_subcategory =
    item.review_subcategory || inferred.review_subcategory || "";

  const is_asset_specific_finance = [
    "asset finance",
    "equipment finance",
    "finance lease",
  ].some((word) => normalised_line_name.includes(word));

  const is_mixed_or_generic_finance =
    !is_asset_specific_finance &&
    (review_subcategory === "mixed_finance" ||
      [
        "mixed finance",
        "mixed",
        "bank fees",
        "loan interest",
        "finance",
        "interest",
      ].some((word) => normalised_line_name.includes(word)));

  if (section === "cost_of_sales") {
    category = "cogs";
    direct_cost_category_id = make_imported_cogs_category_id(line_name);
    review_subcategory = "";
  }

  if (
    (section === "trading_income" || section === "other_income") &&
    category === "unassigned"
  ) {
    review_subcategory = review_subcategory || "review_required";
  }

  if (section === "operating_expenses" && category === "unassigned") {
    review_subcategory = review_subcategory || "review_required";
  }

  if (section === "operating_expenses" && is_mixed_or_generic_finance) {
    category = "general_overheads";
    direct_cost_category_id = "";
    review_subcategory = "finance_interest";
  }

  if (section === "operating_expenses" && is_insurance_operating_expense) {
    category = "general_overheads";
    direct_cost_category_id = "";
    review_subcategory = "insurance_compliance";
  }

  return {
    pnl_line_id: item.pnl_line_id || make_pnl_line_id(),
    line_name,
    amount: clean_amount(item.amount ?? item.value ?? 0),
    section,
    category,
    interest_treatment: item.interest_treatment || "not_reviewed",
    review_subcategory,
    direct_cost_category_id,
    source_type: item.source_type || "",
    import_source: item.import_source || "",
  };
}

export function build_direct_cost_categories_from_pnl_lines(pnl_lines = []) {
  return pnl_lines
    .filter((line) => line.section === "cost_of_sales")
    .map((line) => make_imported_cogs_category(line.line_name));
}

export function build_draft_import(payload = {}) {
  const raw_lines = payload.line_items || payload.pnl_lines || [];

  if (!Array.isArray(raw_lines)) {
    throw new Error("Import must contain line_items[] or pnl_lines[].");
  }

  const pnl_lines = raw_lines.map(normalise_import_line);

  return {
    source_type: payload.source_type || "",
    source_file: payload.source_file || "",
    financial_year: payload.financial_year || "",
    period_month: payload.period_month || "",
    pnl_lines,
    direct_cost_categories: normalise_direct_cost_categories(
      build_direct_cost_categories_from_pnl_lines(pnl_lines),
    ),
    unmatched_lines: payload.unmatched_lines || [],
  };
}

export function parse_json_import(raw_text) {
  return build_draft_import(JSON.parse(raw_text));
}

export function count_by_section(lines = []) {
  return lines.reduce(
    (acc, line) => {
      const section = line.section || "unknown";
      acc[section] = (acc[section] || 0) + 1;
      return acc;
    },
    {
      trading_income: 0,
      cost_of_sales: 0,
      other_income: 0,
      operating_expenses: 0,
    },
  );
}

export function is_excel_or_csv_file(file) {
  const file_name = String(file?.name || "").toLowerCase();

  return (
    file_name.endsWith(".xlsx") ||
    file_name.endsWith(".xls") ||
    file_name.endsWith(".csv")
  );
}

export function is_pdf_file(file) {
  const file_name = String(file?.name || "").toLowerCase();
  return file_name.endsWith(".pdf");
}

