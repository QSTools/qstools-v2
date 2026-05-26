import ExcelJS from "exceljs";

const CREDIT_NOTE_SOURCE = "payable credit note";

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
    return value.toISOString();
  }

  if (value && typeof value === "object") {
    if (value.text) return String(value.text).trim();
    if (value.result) return String(value.result).trim();

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
    joined.includes("payable invoice detail") ||
    joined.includes("for the period") ||
    joined.includes("profit and loss") ||
    joined.includes("tsc construction")
  );
}

function is_header_row(row) {
  const cells = row.map(normalise_text);

  return (
    cells.includes("source") &&
    cells.includes("invoice total") &&
    cells.includes("account")
  );
}

function find_header_indexes(row) {
  const cells = row.map(normalise_text);

  return {
    source_index: cells.findIndex((value) => value === "source"),
    invoice_total_index: cells.findIndex((value) => value === "invoice total"),
    account_index: cells.findIndex((value) => value === "account"),
  };
}

function is_total_row(row) {
  return normalise_text(row[0]).startsWith("total ");
}

function extract_supplier_from_total_row(row) {
  const value = clean_text(row[0]);

  if (!value.toLowerCase().startsWith("total ")) return "";

  return value.replace(/^total\s+/i, "").trim();
}

function is_supplier_heading_row(row) {
  const non_empty_cells = row.map(clean_text).filter((value) => value !== "");

  if (non_empty_cells.length !== 1) return false;

  const value = non_empty_cells[0];
  const lower = value.toLowerCase();

  if (!value) return false;
  if (lower.startsWith("total ")) return false;
  if (lower.includes("source")) return false;
  if (lower.includes("invoice total")) return false;
  if (lower.includes("account")) return false;
  if (lower.includes("payable invoice detail")) return false;
  if (lower.includes("for the period")) return false;

  return true;
}

function should_parse_transaction_row(row, indexes) {
  const source = clean_text(row[indexes.source_index]);
  const invoice_total = clean_text(row[indexes.invoice_total_index]);
  const account = clean_text(row[indexes.account_index]);

  if (!source && !invoice_total && !account) return false;
  if (!source || !account) return false;

  return true;
}

function get_signed_invoice_total(source, invoice_total) {
  const parsed = parse_money(invoice_total);
  const source_key = normalise_text(source);

  if (source_key === CREDIT_NOTE_SOURCE && parsed > 0) {
    return parsed * -1;
  }

  return parsed;
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
  };
}

function add_to_summary(summary_map, row, pnl_direct_cost_account_map) {
  const key = `${row.supplier_name}||${row.account_name}`;

  if (!summary_map.has(key)) {
    const account_match = get_account_match(
      row.account_name,
      pnl_direct_cost_account_map
    );

    summary_map.set(key, {
      supplier_name: row.supplier_name,
      account_name: row.account_name,
      annual_total_gross: 0,
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
    });
  }

  const item = summary_map.get(key);

  item.annual_total_gross += row.invoice_total;
  item.transaction_count += 1;
}

function build_category_summary(supplier_account_summary) {
  const category_map = new Map();

  for (const row of supplier_account_summary) {
    const key = row.cog_import_treatment;

    if (!category_map.has(key)) {
      category_map.set(key, {
        cog_import_treatment: key,
        annual_total_gross: 0,
        supplier_count: 0,
        account_count: 0,
        include_in_cog: false,
        review_required: false,
      });
    }

    const item = category_map.get(key);

    item.annual_total_gross += row.annual_total_gross;
    item.account_count += 1;

    if (row.review_required) {
      item.review_required = true;
    }

    if (row.include_in_cog) {
      item.include_in_cog = true;
    }
  }

  for (const item of category_map.values()) {
    const suppliers = new Set(
      supplier_account_summary
        .filter((row) => row.cog_import_treatment === item.cog_import_treatment)
        .map((row) => row.supplier_name)
    );

    item.supplier_count = suppliers.size;
  }

  return Array.from(category_map.values()).sort(
    (a, b) => Math.abs(b.annual_total_gross) - Math.abs(a.annual_total_gross)
  );
}

export function parse_xero_cog_rows(
  sheet_rows,
  { pnl_direct_cost_account_lines = [] } = {}
) {
  let current_supplier = "";
  let indexes = null;

  const transaction_rows = [];
  const summary_map = new Map();
  const supplier_total_checks = [];

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

    if (is_supplier_heading_row(row)) {
      current_supplier = clean_text(row.find((cell) => clean_text(cell)));
      continue;
    }

    if (is_total_row(row)) {
      supplier_total_checks.push({
        supplier_name: extract_supplier_from_total_row(row),
      });
      continue;
    }

    if (!current_supplier) continue;
    if (!should_parse_transaction_row(row, indexes)) continue;

    const source = clean_text(row[indexes.source_index]);
    const account_name = clean_text(row[indexes.account_index]);
    const invoice_total_raw = row[indexes.invoice_total_index];

    const invoice_total = get_signed_invoice_total(source, invoice_total_raw);

    if (invoice_total === 0) continue;

    const transaction_row = {
      supplier_name: current_supplier,
      source,
      account_name,
      invoice_total,
    };

    transaction_rows.push(transaction_row);
    add_to_summary(summary_map, transaction_row, pnl_direct_cost_account_map);
  }

  const supplier_account_summary = Array.from(summary_map.values())
  .map((row) => ({
    ...row,
    annual_total_gross: Number(row.annual_total_gross.toFixed(2)),
  }))
  .sort((a, b) => {
    const supplier_compare = String(a.supplier_name || "").localeCompare(
      String(b.supplier_name || ""),
      "en-NZ",
      { sensitivity: "base" }
    );

    if (supplier_compare !== 0) return supplier_compare;

    return String(a.account_name || "").localeCompare(
      String(b.account_name || ""),
      "en-NZ",
      { sensitivity: "base" }
    );
  });

  const review_rows = supplier_account_summary.filter(
    (row) => row.review_required
  );

  const cog_rows = supplier_account_summary.filter((row) => row.include_in_cog);

  const visible_default_rows = supplier_account_summary.filter(
    (row) => row.visible_by_default
  );

  const excluded_rows = supplier_account_summary.filter(
    (row) => !row.visible_by_default
  );

  const category_summary = build_category_summary(supplier_account_summary).map(
    (row) => ({
      ...row,
      annual_total_gross: Number(row.annual_total_gross.toFixed(2)),
    })
  );

  const cog_total_gross = cog_rows.reduce(
    (total, row) => total + row.annual_total_gross,
    0
  );

  return {
    supplier_account_summary,
    visible_default_rows,
    excluded_rows,
    category_summary,
    review_rows,
    transaction_rows,
    supplier_total_checks,
    import_meta: {
      importer_name: "Xero COG Importer",
      source_report: "Xero Payable Invoice Detail",
      required_columns: ["Source", "Invoice Total", "Account"],
      supplier_source: "Grouped supplier heading rows",
      modelling_amount: "annual_total_gross",
      pnl_direct_cost_account_line_count: pnl_direct_cost_account_map.size,
      cog_total_gross: Number(cog_total_gross.toFixed(2)),
      transaction_row_count: transaction_rows.length,
      supplier_account_row_count: supplier_account_summary.length,
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