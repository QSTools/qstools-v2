import ExcelJS from "exceljs";

const REVIEW_CATEGORY_IDS = new Set([
  "",
  "review_required",
  "imported_review_required",
  "__review_required",
  "unassigned",
  "__unassigned",
]);

function normalise_text(value) {
  return String(value ?? "").trim().toLowerCase();
}

function clean_text(value) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (value && typeof value === "object") {
    if (value.text) return String(value.text).trim();
    if (value.result !== undefined) return String(value.result ?? "").trim();

    if (value.richText) {
      return value.richText.map((part) => part.text || "").join("").trim();
    }

    if (value.formula && value.result !== undefined) {
      return String(value.result ?? "").trim();
    }
  }

  return String(value ?? "").trim();
}

function parse_money(value) {
  if (value === null || value === undefined || value === "") return 0;

  if (typeof value === "number") return value;

  let text = clean_text(value);

  if (!text || text === "-") return 0;

  let is_negative = false;

  if (text.startsWith("(") && text.endsWith(")")) {
    is_negative = true;
    text = text.slice(1, -1);
  }

  text = text.replace(/,/g, "").replace(/\$/g, "").trim();

  const parsed = Number(text);

  if (!Number.isFinite(parsed)) return 0;

  return is_negative ? -parsed : parsed;
}

function build_pnl_direct_cost_account_map(pnl_direct_cost_account_lines = []) {
  const map = new Map();

  for (const line of Array.isArray(pnl_direct_cost_account_lines)
    ? pnl_direct_cost_account_lines
    : []) {
    const account_key = normalise_text(line.label);

    if (!account_key) continue;

    map.set(account_key, {
      account_name: line.label,
      amount: Number(line.amount || 0),
      direct_cost_category_id:
        line.direct_cost_category_id || "review_required",
      direct_cost_category_name:
        line.direct_cost_category_name || "Review required",
    });
  }

  return map;
}

function is_review_category(category_id = "") {
  return REVIEW_CATEGORY_IDS.has(String(category_id || "").trim());
}

function is_report_title_row(row) {
  const joined = row.map(normalise_text).join(" ");

  return (
    joined.includes("account transactions") ||
    joined.includes("for the period") ||
    joined.includes("profit and loss") ||
    joined.includes("tsc construction")
  );
}

function is_header_row(row) {
  const cells = row.map(normalise_text);

  return (
    cells.includes("date") &&
    cells.includes("source") &&
    cells.includes("description") &&
    cells.includes("debit") &&
    cells.includes("credit")
  );
}

function find_header_indexes(row) {
  const cells = row.map(normalise_text);

  return {
    date_index: cells.findIndex((value) => value === "date"),
    source_index: cells.findIndex((value) => value === "source"),
    description_index: cells.findIndex((value) => value === "description"),
    reference_index: cells.findIndex((value) => value === "reference"),
    debit_index: cells.findIndex((value) => value === "debit"),
    credit_index: cells.findIndex((value) => value === "credit"),
    running_balance_index: cells.findIndex(
      (value) => value === "running balance"
    ),
    gross_index: cells.findIndex((value) => value === "gross"),
    gst_index: cells.findIndex((value) => value === "gst"),
  };
}

function is_total_row(row) {
  return normalise_text(row[0]).startsWith("total ");
}

function extract_account_from_total_row(row) {
  const value = clean_text(row[0]);

  if (!value.toLowerCase().startsWith("total ")) return "";

  return value.replace(/^total\s+/i, "").trim();
}

function is_account_heading_row(row) {
  const non_empty_cells = row.map(clean_text).filter((value) => value !== "");

  if (non_empty_cells.length !== 1) return false;

  const value = non_empty_cells[0];
  const lower = value.toLowerCase();

  if (!value) return false;
  if (lower.startsWith("total ")) return false;
  if (lower.includes("date")) return false;
  if (lower.includes("source")) return false;
  if (lower.includes("description")) return false;
  if (lower.includes("debit")) return false;
  if (lower.includes("credit")) return false;
  if (lower.includes("gross")) return false;
  if (lower.includes("gst")) return false;
  if (lower.includes("account transactions")) return false;
  if (lower.includes("for the period")) return false;

  return true;
}

function should_parse_transaction_row(row, indexes) {
  const date = clean_text(row[indexes.date_index]);
  const source = clean_text(row[indexes.source_index]);
  const description = clean_text(row[indexes.description_index]);
  const debit = clean_text(row[indexes.debit_index]);
  const credit = clean_text(row[indexes.credit_index]);

  if (!date && !source && !description && !debit && !credit) return false;
  if (!source && !description) return false;

  return true;
}

function get_account_match(account_name, pnl_direct_cost_account_map) {
  const account_key = normalise_text(account_name);
  const matched_line = pnl_direct_cost_account_map.get(account_key);

  if (!matched_line) {
    return {
      matched: false,
      pnl_default_group: "not_in_pnl_cogs",
      cog_import_treatment: "excluded_not_in_pnl_cogs",
      visible_by_default: false,
      suggested_qs_category: "excluded_not_in_pnl_cogs",
      direct_cost_category_id: "",
      direct_cost_category_name: "",
      include_in_cog: false,
      review_required: false,
      review_reason: "",
      pnl_amount: 0,
    };
  }

  const review_required = is_review_category(
    matched_line.direct_cost_category_id
  );

  return {
    matched: true,
    pnl_default_group: "direct_cost",
    cog_import_treatment: review_required ? "review_required" : "cog_included",
    visible_by_default: true,
    suggested_qs_category:
      matched_line.direct_cost_category_name || "Review required",
    direct_cost_category_id: matched_line.direct_cost_category_id,
    direct_cost_category_name: matched_line.direct_cost_category_name,
    include_in_cog: !review_required,
    review_required,
    review_reason: review_required
      ? "This Xero account matches a P&L Cost of Sales line that is assigned to Review required."
      : "",
    pnl_amount: Number(matched_line.amount || 0),
  };
}

function add_to_account_summary(summary_map, row, pnl_direct_cost_account_map) {
  const key = row.account_name;

  if (!summary_map.has(key)) {
    const account_match = get_account_match(
      row.account_name,
      pnl_direct_cost_account_map
    );

    summary_map.set(key, {
      account_name: row.account_name,

      annual_debit_total: 0,
      annual_credit_total: 0,
      annual_net_total: 0,
      annual_gross_total: 0,
      annual_gst_total: 0,
      transaction_count: 0,

      matched_pnl_cog_account: account_match.matched,
      pnl_default_group: account_match.pnl_default_group,
      cog_import_treatment: account_match.cog_import_treatment,
      visible_by_default: account_match.visible_by_default,

      direct_cost_category_id: account_match.direct_cost_category_id,
      direct_cost_category_name: account_match.direct_cost_category_name,
      suggested_qs_category: account_match.suggested_qs_category,

      include_in_cog: account_match.include_in_cog,
      review_required: account_match.review_required,
      review_reason: account_match.review_reason,
      pnl_amount: account_match.pnl_amount,
    });
  }

  const item = summary_map.get(key);

  item.annual_debit_total += row.debit_total;
  item.annual_credit_total += row.credit_total;
  item.annual_net_total += row.net_total;
  item.annual_gross_total += row.gross_total;
  item.annual_gst_total += row.gst_total;
  item.transaction_count += 1;
}

function build_category_summary(account_summary = []) {
  const category_map = new Map();

  for (const row of account_summary) {
    const key = row.cog_import_treatment;

    if (!category_map.has(key)) {
      category_map.set(key, {
        cog_import_treatment: key,
        annual_net_total: 0,
        annual_debit_total: 0,
        annual_credit_total: 0,
        annual_gross_total: 0,
        annual_gst_total: 0,
        account_count: 0,
        include_in_cog: false,
        review_required: false,
      });
    }

    const item = category_map.get(key);

    item.annual_net_total += row.annual_net_total;
    item.annual_debit_total += row.annual_debit_total;
    item.annual_credit_total += row.annual_credit_total;
    item.annual_gross_total += row.annual_gross_total;
    item.annual_gst_total += row.annual_gst_total;
    item.account_count += 1;

    if (row.review_required) item.review_required = true;
    if (row.include_in_cog) item.include_in_cog = true;
  }

  return Array.from(category_map.values()).sort(
    (a, b) => Math.abs(b.annual_net_total) - Math.abs(a.annual_net_total)
  );
}

function build_account_reconciliation(
  pnl_direct_cost_account_lines = [],
  account_summary = []
) {
  const xero_total_by_account = new Map();

  for (const row of account_summary) {
    if (!row.matched_pnl_cog_account) continue;

    xero_total_by_account.set(
      normalise_text(row.account_name),
      Number(row.annual_net_total || 0)
    );
  }

  const reconciliation_rows = (Array.isArray(pnl_direct_cost_account_lines)
    ? pnl_direct_cost_account_lines
    : []
  )
    .map((line, index) => {
      const account_name = line.label || `P&L account ${index + 1}`;
      const account_key = normalise_text(account_name);
      const pnl_amount = Number(line.amount || 0);
      const xero_total_net = Number(xero_total_by_account.get(account_key) || 0);
      const difference = xero_total_net - pnl_amount;
      const absolute_difference = Math.abs(difference);

      return {
        account_name,
        direct_cost_category_id:
          line.direct_cost_category_id || "review_required",
        direct_cost_category_name:
          line.direct_cost_category_name || "Review required",
        pnl_amount: Number(pnl_amount.toFixed(2)),
        xero_total_net: Number(xero_total_net.toFixed(2)),
        difference: Number(difference.toFixed(2)),
        absolute_difference: Number(absolute_difference.toFixed(2)),
        status: absolute_difference <= 1 ? "balanced" : "difference",
      };
    })
    .sort((a, b) => b.absolute_difference - a.absolute_difference);

  const pnl_total = reconciliation_rows.reduce(
    (total, row) => total + row.pnl_amount,
    0
  );

  const xero_total_net = reconciliation_rows.reduce(
    (total, row) => total + row.xero_total_net,
    0
  );

  const difference = xero_total_net - pnl_total;

  return {
    rows: reconciliation_rows,
    summary: {
      pnl_total: Number(pnl_total.toFixed(2)),
      xero_total_net: Number(xero_total_net.toFixed(2)),
      difference: Number(difference.toFixed(2)),
      absolute_difference: Number(Math.abs(difference).toFixed(2)),
      status: Math.abs(difference) <= 1 ? "balanced" : "difference",
    },
  };
}

export function parse_xero_cog_rows(
  sheet_rows,
  { pnl_direct_cost_account_lines = [] } = {}
) {
  let current_account = "";
  let indexes = null;

  const transaction_rows = [];
  const account_summary_map = new Map();
  const account_total_checks = [];

  const pnl_direct_cost_account_map = build_pnl_direct_cost_account_map(
    pnl_direct_cost_account_lines
  );

  for (const row of sheet_rows) {
    if (!row || row.length === 0) continue;
    if (is_report_title_row(row)) continue;

    if (is_header_row(row)) {
      indexes = find_header_indexes(row);
      continue;
    }

    if (!indexes) continue;

    if (is_account_heading_row(row)) {
      current_account = clean_text(row.find((cell) => clean_text(cell)));
      continue;
    }

    if (is_total_row(row)) {
      const total_account_name = extract_account_from_total_row(row);

      const total_debit =
        indexes.debit_index >= 0 ? parse_money(row[indexes.debit_index]) : 0;

      const total_credit =
        indexes.credit_index >= 0 ? parse_money(row[indexes.credit_index]) : 0;

      account_total_checks.push({
        account_name: total_account_name,
        total_debit: Number(total_debit.toFixed(2)),
        total_credit: Number(total_credit.toFixed(2)),
        total_net: Number((total_debit - total_credit).toFixed(2)),
      });

      continue;
    }

    if (!current_account) continue;
    if (!should_parse_transaction_row(row, indexes)) continue;

    const date = clean_text(row[indexes.date_index]);
    const source = clean_text(row[indexes.source_index]);
    const description = clean_text(row[indexes.description_index]);
    const reference =
      indexes.reference_index >= 0
        ? clean_text(row[indexes.reference_index])
        : "";

    const debit_total =
      indexes.debit_index >= 0 ? parse_money(row[indexes.debit_index]) : 0;

    const credit_total =
      indexes.credit_index >= 0 ? parse_money(row[indexes.credit_index]) : 0;

    const gross_total =
      indexes.gross_index >= 0 ? parse_money(row[indexes.gross_index]) : 0;

    const gst_total =
      indexes.gst_index >= 0 ? parse_money(row[indexes.gst_index]) : 0;

    const net_total = debit_total - credit_total;

    if (net_total === 0 && gross_total === 0 && gst_total === 0) {
      continue;
    }

    const transaction_row = {
      account_name: current_account,
      date,
      source,
      description,
      reference,

      // Debit/Credit are ex GST in Xero Account Transactions.
      debit_total,
      credit_total,
      net_total,

      // Stored for audit/future use only. Gross is GST-inclusive.
      gross_total,
      gst_total,
    };

    transaction_rows.push(transaction_row);
    add_to_account_summary(
      account_summary_map,
      transaction_row,
      pnl_direct_cost_account_map
    );
  }

  const account_summary = Array.from(account_summary_map.values())
    .map((row) => ({
      ...row,
      annual_debit_total: Number(row.annual_debit_total.toFixed(2)),
      annual_credit_total: Number(row.annual_credit_total.toFixed(2)),
      annual_net_total: Number(row.annual_net_total.toFixed(2)),
      annual_gross_total: Number(row.annual_gross_total.toFixed(2)),
      annual_gst_total: Number(row.annual_gst_total.toFixed(2)),
    }))
    .sort((a, b) =>
      String(a.account_name || "").localeCompare(
        String(b.account_name || ""),
        "en-NZ",
        { sensitivity: "base" }
      )
    );

  const review_rows = account_summary.filter((row) => row.review_required);
  const cog_rows = account_summary.filter((row) => row.include_in_cog);
  const visible_default_rows = account_summary.filter(
    (row) => row.visible_by_default
  );
  const excluded_rows = account_summary.filter((row) => !row.visible_by_default);

  const category_summary = build_category_summary(account_summary).map((row) => ({
    ...row,
    annual_debit_total: Number(row.annual_debit_total.toFixed(2)),
    annual_credit_total: Number(row.annual_credit_total.toFixed(2)),
    annual_net_total: Number(row.annual_net_total.toFixed(2)),
    annual_gross_total: Number(row.annual_gross_total.toFixed(2)),
    annual_gst_total: Number(row.annual_gst_total.toFixed(2)),
  }));

  const cog_total_net = cog_rows.reduce(
    (total, row) => total + row.annual_net_total,
    0
  );

  const cog_total_debit = cog_rows.reduce(
    (total, row) => total + row.annual_debit_total,
    0
  );

  const cog_total_credit = cog_rows.reduce(
    (total, row) => total + row.annual_credit_total,
    0
  );

  const cog_total_gross = cog_rows.reduce(
    (total, row) => total + row.annual_gross_total,
    0
  );

  const cog_gst_total = cog_rows.reduce(
    (total, row) => total + row.annual_gst_total,
    0
  );

  const account_reconciliation = build_account_reconciliation(
    pnl_direct_cost_account_lines,
    account_summary
  );

  return {
    account_summary,
    visible_default_rows,
    excluded_rows,
    category_summary,
    review_rows,
    transaction_rows,
    account_total_checks,
    account_reconciliation,

    // Backward-compatible aliases for current UI code.
    supplier_account_summary: account_summary.map((row) => ({
      ...row,
      supplier_name: row.account_name,
      account_name: row.account_name,
      annual_total_net: row.annual_net_total,
      annual_total_gross: row.annual_gross_total,
      annual_gst_total: row.annual_gst_total,
    })),

    import_meta: {
      importer_name: "Xero Account Transactions COG Importer",
      source_report: "Xero Account Transactions",
      required_columns: [
        "Date",
        "Source",
        "Description",
        "Debit",
        "Credit",
        "Gross",
        "GST",
      ],
      supplier_source: "Not supplier-based. Ledger account transaction report.",
      modelling_amount: "annual_net_total",
      pnl_direct_cost_account_line_count: pnl_direct_cost_account_map.size,

      cog_total_net: Number(cog_total_net.toFixed(2)),
      cog_total_debit: Number(cog_total_debit.toFixed(2)),
      cog_total_credit: Number(cog_total_credit.toFixed(2)),

      // Stored for audit/future use only. Gross is GST-inclusive.
      cog_total_gross: Number(cog_total_gross.toFixed(2)),
      cog_gst_total: Number(cog_gst_total.toFixed(2)),

      pnl_cogs_total: account_reconciliation.summary.pnl_total,
      xero_cogs_total_net: account_reconciliation.summary.xero_total_net,
      xero_pnl_difference: account_reconciliation.summary.difference,
      xero_pnl_reconciliation_status: account_reconciliation.summary.status,

      transaction_row_count: transaction_rows.length,
      account_row_count: account_summary.length,
      supplier_account_row_count: account_summary.length,
      visible_default_row_count: visible_default_rows.length,
      excluded_row_count: excluded_rows.length,
      review_row_count: review_rows.length,
    },
  };
}

export async function read_xero_cog_workbook(
  file,
  { pnl_direct_cost_account_lines = [] } = {}
) {
  const array_buffer = await file.arrayBuffer();

  const workbook = new ExcelJS.Workbook();

  await workbook.xlsx.load(array_buffer);

  const worksheet = workbook.worksheets[0];

  const sheet_rows = [];
  const column_count = worksheet.columnCount || 50;

  worksheet.eachRow({ includeEmpty: true }, (row) => {
    const values = [];

    for (let col_number = 1; col_number <= column_count; col_number += 1) {
      values[col_number - 1] = row.getCell(col_number).value ?? "";
    }

    sheet_rows.push(values);
  });

  return parse_xero_cog_rows(sheet_rows, {
    pnl_direct_cost_account_lines,
  });
}