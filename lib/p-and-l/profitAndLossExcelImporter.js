// lib/p-and-l/profitAndLossExcelImporter.js

import * as XLSX from "xlsx";

/**
 * MIRRA / QS Tools P&L Excel Importer
 *
 * Purpose:
 * - Import Excel / CSV P&L exports
 * - Preserve actual accounting line names
 * - Detect only broad P&L accounting sections
 * - Do NOT classify operating expenses commercially
 * - Do NOT disturb existing PDF / JSON import logic
 *
 * P&L page = accounting source truth
 * Revenue / COGS page = commercial interpretation
 */

function make_import_id() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `pnl_excel_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function clean_text(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function normalise_text(value) {
  return clean_text(value).toLowerCase();
}

function clean_amount(value) {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  let text = String(value).trim();
  if (!text) return null;

  let is_negative = false;

  if (text.startsWith("(") && text.endsWith(")")) {
    is_negative = true;
    text = text.slice(1, -1);
  }

  text = text
    .replace(/\$/g, "")
    .replace(/,/g, "")
    .replace(/\s/g, "")
    .replace(/−/g, "-")
    .replace(/[^\d.-]/g, "");

  if (!text || text === "-" || text === "." || text === "-.") return null;

  const parsed = Number(text);

  if (!Number.isFinite(parsed)) return null;

  return is_negative ? -Math.abs(parsed) : parsed;
}

function make_category_id_from_line_name(line_name) {
  const clean_name = String(line_name || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return clean_name ? `imported_cogs_${clean_name}` : "imported_cogs_review_required";
}

function make_direct_cost_category_from_line_name(line_name) {
  return {
    category_id: make_category_id_from_line_name(line_name),
    category_name: String(line_name || "").trim() || "Imported cost of sales",
    is_default: false,
    is_active: true,
    created_at: "",
    updated_at: "",
  };
}

function get_first_text_cell(row = []) {
  for (const cell of row) {
    const amount = clean_amount(cell);

    if (
      cell !== null &&
      cell !== undefined &&
      String(cell).trim() !== "" &&
      amount === null
    ) {
      return clean_text(cell);
    }
  }

  return "";
}

function get_last_amount_cell(row = []) {
  for (let index = row.length - 1; index >= 0; index -= 1) {
    const amount = clean_amount(row[index]);

    if (amount !== null) {
      return amount;
    }
  }

  return null;
}

function detect_section(label) {
  const text = normalise_text(label);

  if (!text) return "";

  // IMPORTANT:
  // Cost of Sales must be checked BEFORE "sales" / "income",
  // otherwise "Cost of Sales" incorrectly matches the word "sales".
  if (
    [
      "cost of sales",
      "costs of sales",
      "cost of goods sold",
      "costs of goods sold",
      "direct costs",
      "direct cost",
      "cogs",
    ].some((word) => text === word || text.includes(word))
  ) {
    return "cost_of_sales";
  }

  if (
    ["other income", "non operating income", "non-operating income"].some(
      (word) => text === word || text.includes(word),
    )
  ) {
    return "other_income";
  }

  if (
    [
      "operating expenses",
      "operating expense",
      "expenses",
      "overheads",
      "administration expenses",
      "admin expenses",
    ].some((word) => text === word || text.includes(word))
  ) {
    return "operating_expenses";
  }

  if (
    [
      "trading income",
      "revenue",
      "income",
      "sales",
      "turnover",
      "operating income",
    ].some((word) => text === word || text.includes(word))
  ) {
    return "trading_income";
  }

  return "";
}

function is_known_section_heading(label) {
  const text = normalise_text(label);

  return [
    "trading income",
    "operating income",
    "cost of sales",
    "costs of sales",
    "cost of goods sold",
    "costs of goods sold",
    "direct costs",
    "direct cost",
    "cogs",
    "other income",
    "non operating income",
    "non-operating income",
    "operating expenses",
    "operating expense",
    "expenses",
    "overheads",
    "administration expenses",
    "admin expenses",
  ].some((heading) => text === heading);
}

function is_total_or_noise_line(label) {
  const text = normalise_text(label);

  if (!text) return true;

  if (
    [
      "profit and loss",
      "profit & loss",
      "p&l",
      "statement of profit or loss",
      "statement of financial performance",
      "account",
      "accounts",
      "amount",
      "balance",
      "debit",
      "credit",
    ].includes(text)
  ) {
    return true;
  }

  return (
    text.startsWith("total ") ||
    text.includes("gross profit") ||
    text.includes("gross margin") ||
    text.includes("net profit") ||
    text.includes("net income") ||
    text.includes("profit before tax") ||
    text.includes("profit after tax")
  );
}

function is_excel_or_csv_file(file) {
  const file_name = String(file?.name || "").toLowerCase();

  return (
    file_name.endsWith(".xlsx") ||
    file_name.endsWith(".xls") ||
    file_name.endsWith(".csv")
  );
}

export async function parse_profit_and_loss_excel_file(file) {
  if (!file) {
    throw new Error("No file selected.");
  }

  if (!is_excel_or_csv_file(file)) {
    throw new Error("Unsupported file type. Upload .xlsx, .xls, or .csv.");
  }

  const array_buffer = await file.arrayBuffer();

  const workbook = XLSX.read(array_buffer, {
    type: "array",
    cellDates: true,
    raw: false,
  });

  const sheet_name = workbook.SheetNames?.[0];

  if (!sheet_name) {
    throw new Error("No worksheet found in Excel P&L file.");
  }

  const sheet = workbook.Sheets[sheet_name];

  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    blankrows: false,
  });

  let current_section = "";
  const line_items = [];
  const direct_cost_categories = [];
  const category_ids = new Set();
  const unmatched_lines = [];

  rows.forEach((row, row_index) => {
    const row_number = row_index + 1;
    const label = get_first_text_cell(row);
    const amount = get_last_amount_cell(row);

    if (!label && amount === null) return;

    const detected_section = detect_section(label);

    if (detected_section) {
      current_section = detected_section;

      if (is_known_section_heading(label)) {
        return;
      }
    }

    if (is_total_or_noise_line(label)) return;

    if (!label || amount === null) return;

    if (!current_section) {
      unmatched_lines.push(`Row ${row_number}: ${label}`);
      return;
    }

    const line = {
      pnl_line_id: make_import_id(),
      line_name: label,
      amount,
      section: current_section,
      source_type: "excel",
      import_source: "excel",
    };

    if (current_section === "cost_of_sales") {
      const direct_cost_category_id = make_category_id_from_line_name(label);

      line.category = "cogs";
      line.direct_cost_category_id = direct_cost_category_id;
      line.review_subcategory = "";

      if (!category_ids.has(direct_cost_category_id)) {
        category_ids.add(direct_cost_category_id);
        direct_cost_categories.push(
          make_direct_cost_category_from_line_name(label),
        );
      }
    }

    line_items.push(line);
  });

  return {
    source_type: "excel",
    source_file: file.name,
    source_sheet_name: sheet_name,
    financial_year: "",
    period_month: "",
    line_items,
    direct_cost_categories,
    unmatched_lines,
  };
}

export default parse_profit_and_loss_excel_file;