// Cross-import alignment check (v6.0 Phase 1).
// PURE and READ-ONLY: takes plain objects, writes nothing, imports nothing.
// Each check returns { id, label, status, detail, ... } where status is
// "pass" | "fail" | "cannot_compare". Cannot-compare is never a pass.
// Financial year is assumed to mean YEAR ENDING. The year-end month is an
// INPUT (options.financial_year_end_month, 1-12) and is never assumed.

const TOLERANCE = 0.01;

const MONTH_NAMES = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

function to_number(value) {
  const parsed = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function is_finite_number(value) {
  return value !== null && value !== undefined && value !== "" &&
    Number.isFinite(Number(String(value).replace(/,/g, "")));
}

// Mirrors normalise_category in profitAndLossCalculations.js
function normalise_category(category) {
  if (category === "employee_overheads") return "general_overheads";
  if (
    category === "cogs_materials" ||
    category === "cogs_subcontract" ||
    category === "cogs_hire"
  ) {
    return "cogs";
  }
  return category || "unassigned";
}

function summarise_line(line, reason) {
  return {
    pnl_line_id: line?.pnl_line_id ?? "",
    line_name: line?.line_name ?? "",
    section: line?.section ?? "",
    category: line?.category ?? "",
    direct_cost_category_id: line?.direct_cost_category_id ?? "",
    amount: to_number(line?.amount),
    reason,
  };
}

function make_result(id, label, status, detail, extra = {}) {
  return { id, label, status, detail, ...extra };
}

function compare_pair(id, label, a_name, a_value, b_name, b_value, extra = {}) {
  if (!is_finite_number(a_value) || !is_finite_number(b_value)) {
    return make_result(id, label, "cannot_compare",
      `${a_name} or ${b_name} is missing.`, extra);
  }
  const a = to_number(a_value);
  const b = to_number(b_value);
  const difference = a - b;
  const matches = Math.abs(difference) <= TOLERANCE;
  return make_result(
    id, label, matches ? "pass" : "fail",
    matches ? `${a_name} matches ${b_name}.` : `${a_name} differs from ${b_name}.`,
    { values: { [a_name]: a, [b_name]: b, difference }, ...extra },
  );
}

export function parse_as_at_date(raw) {
  if (!raw) return null;
  const text = String(raw).trim();

  const named = text.match(/(\d{1,2})\s+([A-Za-z]{3,})\.?,?\s+(\d{4})/);
  if (named) {
    const prefix = named[2].toLowerCase().slice(0, 3);
    const index = MONTH_NAMES.findIndex((name) => name.startsWith(prefix));
    if (index >= 0) {
      return { day: Number(named[1]), month: index + 1, year: Number(named[3]) };
    }
  }

  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return { day: Number(iso[3]), month: Number(iso[2]), year: Number(iso[1]) };
  }

  return null;
}

function check_revenue(pnl) {
  const label = "P&L revenue: section-based vs category-based";
  const in_section = Array.isArray(pnl.trading_income_lines) ? pnl.trading_income_lines : [];
  const in_category = Array.isArray(pnl.revenue_lines) ? pnl.revenue_lines : [];

  const category_ids = new Set(in_category.map((l) => l?.pnl_line_id));
  const section_ids = new Set(in_section.map((l) => l?.pnl_line_id));

  const offenders = [
    ...in_section
      .filter((l) => !category_ids.has(l?.pnl_line_id))
      .map((l) => summarise_line(l, "In trading_income section but category is not revenue")),
    ...in_category
      .filter((l) => !section_ids.has(l?.pnl_line_id))
      .map((l) => summarise_line(l, "Category is revenue but not in trading_income section")),
  ];

  return compare_pair(
    "revenue_section_vs_category", label,
    "total_trading_income", pnl.total_trading_income,
    "total_revenue", pnl.total_revenue,
    { offenders },
  );
}

function check_cost_of_sales(pnl) {
  const label = "P&L cost of sales: section-based vs direct-cost categories";
  const in_section = Array.isArray(pnl.cost_of_sales_lines) ? pnl.cost_of_sales_lines : [];
  const category_totals = Array.isArray(pnl.direct_cost_category_totals)
    ? pnl.direct_cost_category_totals : [];

  const counted = category_totals.flatMap((c) => (Array.isArray(c?.lines) ? c.lines : []));
  const counted_ids = new Set(counted.map((l) => l?.pnl_line_id));
  const section_ids = new Set(in_section.map((l) => l?.pnl_line_id));

  const offenders = [
    ...in_section
      .filter((l) => !counted_ids.has(l?.pnl_line_id))
      .map((l) => {
        const is_cogs = normalise_category(l?.category) === "cogs";
        return summarise_line(
          l,
          is_cogs
            ? "In cost_of_sales section, cogs category, but direct cost category ID is missing or not an active category"
            : "In cost_of_sales section but category is not cogs",
        );
      }),
    ...counted
      .filter((l) => !section_ids.has(l?.pnl_line_id))
      .map((l) => summarise_line(l, "Counted as a direct cost but not in cost_of_sales section")),
  ];

  return compare_pair(
    "cost_of_sales_section_vs_category", label,
    "total_cost_of_sales", pnl.total_cost_of_sales,
    "total_direct_costs", pnl.total_direct_costs,
    { offenders },
  );
}

function check_revenue_cogs_passthrough(pnl, revenue_cogs) {
  const label = "Revenue/COGS output vs P&L output";
  if (!revenue_cogs || typeof revenue_cogs !== "object") {
    return make_result("revenue_cogs_passthrough", label, "cannot_compare",
      "Revenue/COGS output contract was not supplied.");
  }

  const revenue = compare_pair("", "", "revenue_cogs.total_revenue",
    revenue_cogs.total_revenue, "pnl.total_revenue", pnl.total_revenue);
  const costs = compare_pair("", "", "revenue_cogs.total_direct_costs",
    revenue_cogs.total_direct_costs, "pnl.total_direct_costs", pnl.total_direct_costs);

  const parts = [revenue, costs];
  const status = parts.some((p) => p.status === "fail")
    ? "fail"
    : parts.some((p) => p.status === "cannot_compare") ? "cannot_compare" : "pass";

  return make_result("revenue_cogs_passthrough", label, status,
    status === "pass"
      ? "Revenue/COGS totals match P&L totals."
      : "Revenue/COGS totals do not match P&L totals.",
    { values: { revenue: revenue.values ?? null, direct_costs: costs.values ?? null } });
}

function check_period(pnl_state, balance_sheet_state, options) {
  const id = "period_pnl_vs_balance_sheet";
  const label = "P&L period vs Balance Sheet as-at date";
  const raw = balance_sheet_state?.as_at_date;

  if (!raw) {
    return make_result(id, label, "cannot_compare", "Balance Sheet has no as-at date.");
  }

  const as_at = parse_as_at_date(raw);
  if (!as_at) {
    return make_result(id, label, "cannot_compare",
      "Balance Sheet as-at date could not be parsed.", { values: { as_at_raw: String(raw) } });
  }

  const financial_year = Number(pnl_state?.financial_year) || null;
  const period_month = pnl_state?.period_month ? Number(pnl_state.period_month) : null;
  const raw_end = Number(options?.financial_year_end_month);
  const year_end_month = raw_end >= 1 && raw_end <= 12 ? raw_end : null;
  const values = { as_at, financial_year, period_month, year_end_month };

  // Annual P&L: the balance date IS the year end, so we need the setting.
  const expected_month = period_month || year_end_month;
  if (!expected_month) {
    return make_result(id, label, "cannot_compare",
      "P&L is annual and no financial_year_end_month was supplied.", { values });
  }

  const problems = [];
  const notes = [];

  if (as_at.month !== expected_month) {
    problems.push(`as-at month ${as_at.month} vs expected month ${expected_month}`);
  }

  // Financial year = YEAR ENDING. Months after the year-end month belong
  // to the previous calendar year (e.g. FY2026, 31 March: June = 2025).
  if (financial_year && year_end_month) {
    const expected_year = period_month && period_month > year_end_month
      ? financial_year - 1
      : financial_year;
    if (as_at.year !== expected_year) {
      problems.push(`as-at year ${as_at.year} vs expected year ${expected_year}`);
    }
  } else {
    notes.push("Year not verified (financial_year_end_month not supplied).");
  }

  return make_result(
    id, label,
    problems.length ? "fail" : "pass",
    problems.length
      ? `Period mismatch: ${problems.join("; ")}.`
      : `Month matches.${notes.length ? " " + notes.join(" ") : ""}`,
    { values },
  );
}

const RECOGNISED_SECTIONS = [
  "trading_income",
  "cost_of_sales",
  "other_income",
  "operating_expenses",
];

// I3: every operating expense line should sit in exactly one cost bucket.
// A fail is not automatically a bug: category "excluded" may be deliberate.
// Lines are matched by object reference (the output arrays are subsets of
// the same line objects), so missing or duplicate line ids cannot mislead.
function check_operating_expenses_vs_business_costs(pnl) {
  const label = "P&L operating expenses vs business cost buckets";
  const opex = Array.isArray(pnl.operating_expense_lines) ? pnl.operating_expense_lines : [];
  const bucketed = new Set([
    ...(Array.isArray(pnl.labour_lines) ? pnl.labour_lines : []),
    ...(Array.isArray(pnl.assets_lines) ? pnl.assets_lines : []),
    ...(Array.isArray(pnl.general_overheads_lines) ? pnl.general_overheads_lines : []),
    ...(Array.isArray(pnl.unassigned_lines) ? pnl.unassigned_lines : []),
  ]);

  const excluded_lines = opex.filter(
    (l) => !bucketed.has(l) && normalise_category(l?.category) === "excluded",
  );
  const excluded_total = excluded_lines.reduce((sum, l) => sum + to_number(l?.amount), 0);

  const offenders = opex
    .filter((l) => !bucketed.has(l) && normalise_category(l?.category) !== "excluded")
    .map((l) => summarise_line(
      l,
      "Operating expense line is in no cost bucket (labour, assets, general overheads or unassigned)",
    ));

  const result = compare_pair(
    "operating_expenses_vs_business_costs", label,
    "total_operating_expenses", pnl.total_operating_expenses,
    "total_business_costs_plus_excluded",
    to_number(pnl.total_business_costs) + excluded_total,
    { offenders },
  );

  result.values = {
    ...(result.values ?? {}),
    excluded_operating_expenses_total: excluded_total,
    excluded_lines: excluded_lines.map((l) => (l?.line_name || "(unnamed)") + ": " + to_number(l?.amount)),
    labour_benchmark_total: to_number(pnl.labour_benchmark_total),
    assets_benchmark_total: to_number(pnl.assets_benchmark_total),
    general_overheads_benchmark_total: to_number(pnl.general_overheads_benchmark_total),
    unassigned_balance: to_number(pnl.unassigned_balance),
  };
  return result;
}

// I4: no non-zero line may sit outside the four recognised sections.
function check_lines_vs_sections(pnl) {
  const label = "P&L all lines vs the four section totals";
  if (!Array.isArray(pnl.pnl_lines)) {
    return make_result("lines_vs_sections", label, "cannot_compare",
      "pnl_lines is missing from the P&L output.");
  }

  const all_lines_total = pnl.pnl_lines.reduce((sum, l) => sum + to_number(l?.amount), 0);
  const section_total =
    to_number(pnl.total_trading_income) +
    to_number(pnl.total_cost_of_sales) +
    to_number(pnl.total_other_income) +
    to_number(pnl.total_operating_expenses);

  const offenders = pnl.pnl_lines
    .filter((l) => !RECOGNISED_SECTIONS.includes(l?.section) && to_number(l?.amount) !== 0)
    .map((l) => summarise_line(l, "Section is not one of the four recognised sections"));

  return compare_pair(
    "lines_vs_sections", label,
    "sum_of_all_lines", all_lines_total,
    "sum_of_four_sections", section_total,
    { offenders },
  );
}

export function calculateCrossImportAlignment({
  pnl_output_contract = {},
  pnl_state = {},
  revenue_cogs_output_contract = null,
  balance_sheet_state = null,
  options = {},
} = {}) {
  const results = [
    check_revenue(pnl_output_contract),
    check_cost_of_sales(pnl_output_contract),
    check_revenue_cogs_passthrough(pnl_output_contract, revenue_cogs_output_contract),
    check_period(pnl_state, balance_sheet_state, options),
    check_operating_expenses_vs_business_costs(pnl_output_contract),
    check_lines_vs_sections(pnl_output_contract),
  ];

  const fail_count = results.filter((r) => r.status === "fail").length;
  const cannot_compare_count = results.filter((r) => r.status === "cannot_compare").length;

  return {
    overall_status: fail_count > 0 ? "fail" : cannot_compare_count > 0 ? "incomplete" : "pass",
    fail_count,
    cannot_compare_count,
    results,
  };
}