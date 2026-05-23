"use client";

import { useMemo, useRef, useState } from "react";
import CollapsibleSection from "@/components/common/CollapsibleSection";

const IMPORTED_REVIEW_REQUIRED_CATEGORY_ID = "imported_review_required";

const DEFAULT_DIRECT_COST_CATEGORIES = [
  {
    category_id: "materials",
    category_name: "Materials",
    is_default: true,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    category_id: "subcontract_labour",
    category_name: "Subcontract labour",
    is_default: true,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    category_id: "hired_equipment_plant",
    category_name: "Hired equipment / plant",
    is_default: true,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    category_id: "freight_cartage",
    category_name: "Freight / cartage",
    is_default: true,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    category_id: "waste_tipping",
    category_name: "Waste / tipping",
    is_default: true,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    category_id: "direct_consumables",
    category_name: "Direct consumables",
    is_default: true,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    category_id: "other_direct_costs",
    category_name: "Other direct costs",
    is_default: true,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    category_id: "review_required",
    category_name: "Review required",
    is_default: true,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    category_id: IMPORTED_REVIEW_REQUIRED_CATEGORY_ID,
    category_name: "Imported / Review required",
    is_default: false,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
];

function make_pnl_line_id() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `pnl_import_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function clean_amount(value) {
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

function infer_line_mapping(line_name) {
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

  if (["cartage", "freight", "delivery"].some((word) => name.includes(word))) {
    return {
      section: "cost_of_sales",
      category: "cogs",
      direct_cost_category_id: "freight_cartage",
      review_subcategory: "",
    };
  }

  if (
    [
      "material",
      "materials",
      "concrete purchase",
      "purchase - fill",
      "purchases - fill",
      "purchase - steel",
      "purchases - steel",
    ].some((word) => name.includes(word))
  ) {
    return {
      section: "cost_of_sales",
      category: "cogs",
      direct_cost_category_id: "materials",
      review_subcategory: "",
    };
  }

  if (
    ["subcontract", "subcontractor", "subcontracting"].some((word) =>
      name.includes(word),
    )
  ) {
    return {
      section: "cost_of_sales",
      category: "cogs",
      direct_cost_category_id: "subcontract_labour",
      review_subcategory: "",
    };
  }

  if (
    ["equipment hire", "plant hire", "hire"].some((word) =>
      name.includes(word),
    )
  ) {
    return {
      section: "cost_of_sales",
      category: "cogs",
      direct_cost_category_id: "hired_equipment_plant",
      review_subcategory: "",
    };
  }

  if (["waste", "tipping", "dump"].some((word) => name.includes(word))) {
    return {
      section: "cost_of_sales",
      category: "cogs",
      direct_cost_category_id: "waste_tipping",
      review_subcategory: "",
    };
  }

  if (["consumable", "consumables"].some((word) => name.includes(word))) {
    return {
      section: "cost_of_sales",
      category: "cogs",
      direct_cost_category_id: "direct_consumables",
      review_subcategory: "",
    };
  }

  if (
    [
      "testing",
      "site works",
      "traffic",
      "temporary",
      "direct cost",
      "job cost",
      "contract cost",
      "project cost",
      "site cost",
      "concrete laying",
      "concrete pumping",
      "opening work in progress",
      "wip",
      "purchases - other",
    ].some((word) => name.includes(word))
  ) {
    return {
      section: "cost_of_sales",
      category: "cogs",
      direct_cost_category_id: IMPORTED_REVIEW_REQUIRED_CATEGORY_ID,
      review_subcategory: "review_required",
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

  if (
    [
      "vehicle",
      "fuel",
      "registration",
      "licence",
      "license",
      "repairs",
      "maintenance",
      "interest",
      "finance",
      "plant",
      "machinery",
    ].some((word) => name.includes(word))
  ) {
    return {
      section: "operating_expenses",
      category: "assets",
      direct_cost_category_id: "",
      review_subcategory: "",
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

function normalise_direct_cost_categories(categories = []) {
  const seen = new Set();
  const combined = [...DEFAULT_DIRECT_COST_CATEGORIES, ...(categories ?? [])];

  return combined.filter((category) => {
    const category_id = category?.category_id || "";
    if (!category_id || seen.has(category_id) || category?.is_active === false) {
      return false;
    }

    seen.add(category_id);
    return true;
  });
}

function normalise_import_line(item = {}) {
  const line_name = item.line_name || item.name || item.description || "";
  const inferred = infer_line_mapping(line_name);

  let section = item.section || inferred.section;
  let category = item.category || inferred.category;
  let direct_cost_category_id =
    item.direct_cost_category_id || inferred.direct_cost_category_id || "";
  let review_subcategory =
    item.review_subcategory || inferred.review_subcategory || "";

  if (section === "cost_of_sales") {
    category = "cogs";

    if (!direct_cost_category_id) {
      direct_cost_category_id = IMPORTED_REVIEW_REQUIRED_CATEGORY_ID;
      review_subcategory = "review_required";
    }
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

  return {
    pnl_line_id: item.pnl_line_id || make_pnl_line_id(),
    line_name,
    amount: clean_amount(item.amount ?? item.value ?? 0),
    section,
    category,
    interest_treatment: item.interest_treatment || "not_reviewed",
    review_subcategory,
    direct_cost_category_id,
  };
}

function build_draft_import(payload = {}) {
  const raw_lines = payload.line_items || payload.pnl_lines || [];

  if (!Array.isArray(raw_lines)) {
    throw new Error("Import must contain line_items[] or pnl_lines[].");
  }

  return {
    source_type: payload.source_type || "",
    source_file: payload.source_file || "",
    financial_year: payload.financial_year || "",
    period_month: payload.period_month || "",
    pnl_lines: raw_lines.map(normalise_import_line),
    direct_cost_categories: normalise_direct_cost_categories(
      payload.direct_cost_categories,
    ),
    unmatched_lines: payload.unmatched_lines || [],
  };
}

function parse_json_import(raw_text) {
  return build_draft_import(JSON.parse(raw_text));
}

function count_by_section(lines = []) {
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

export default function ProfitAndLossQuickImportPanel({ state, actions }) {
  const file_input_ref = useRef(null);
  const [raw_text, set_raw_text] = useState("");
  const [selected_file, set_selected_file] = useState(null);
  const [draft_import, set_draft_import] = useState(null);
  const [error_message, set_error_message] = useState("");
  const [import_message, set_import_message] = useState("");
  const [is_extracting, set_is_extracting] = useState(false);

  const section_counts = useMemo(() => {
    return count_by_section(draft_import?.pnl_lines ?? []);
  }, [draft_import]);

  function handle_parse() {
    set_error_message("");
    set_import_message("");

    try {
      const parsed = parse_json_import(raw_text);

      if (parsed.pnl_lines.length === 0) {
        set_draft_import(null);
        set_error_message("No P&L lines were found in the pasted JSON.");
        return;
      }

      set_draft_import(parsed);
      set_import_message(`${parsed.pnl_lines.length} lines ready to import.`);
    } catch (error) {
      set_draft_import(null);
      set_error_message(error?.message || "Could not parse import JSON.");
    }
  }

  async function handle_extract_pdf() {
    set_error_message("");
    set_import_message("");

    const file = selected_file || file_input_ref.current?.files?.[0] || null;

    if (!file) {
      set_error_message(
        "Choose a P&L PDF first. If the file name is visible, reselect it and click Extract PDF again.",
      );
      return;
    }

    set_is_extracting(true);

    try {
      const form_data = new FormData();
      form_data.append("file", file);

      const response = await fetch("/api/pnl-import", {
        method: "POST",
        body: form_data,
      });

      const response_text = await response.text();

      let payload = null;

      try {
        payload = JSON.parse(response_text);
      } catch {
        throw new Error(
          response_text?.slice(0, 300) ||
            "PDF import failed. The server did not return JSON.",
        );
      }

      if (!response.ok || !payload.ok) {
        throw new Error(payload?.error || "PDF import failed.");
      }

      const parsed = build_draft_import(payload);

      if (parsed.pnl_lines.length === 0) {
        set_draft_import(null);
        set_error_message("No P&L lines were extracted from the PDF.");
        return;
      }

      set_draft_import(parsed);
      set_selected_file(file);
      set_import_message(
        `${parsed.pnl_lines.length} lines extracted from PDF and ready to import.`,
      );
    } catch (error) {
      set_draft_import(null);
      set_error_message(error?.message || "Could not extract the P&L PDF.");
    } finally {
      set_is_extracting(false);
    }
  }

  function handle_confirm_import() {
    if (!draft_import) return;

    const next_financial_year =
      draft_import.financial_year || state?.financial_year || "";

    const next_period_month =
      draft_import.period_month ?? state?.period_month ?? "";

    const next_pnl_lines = draft_import.pnl_lines;

    const next_direct_cost_categories = normalise_direct_cost_categories([
      ...(state?.direct_cost_categories ?? []),
      ...(draft_import.direct_cost_categories ?? []),
    ]);

    if (typeof actions.set_profit_and_loss_state === "function") {
      actions.set_profit_and_loss_state({
        ...state,
        financial_year: next_financial_year,
        period_month: next_period_month,
        pnl_lines: next_pnl_lines,
        direct_cost_categories: next_direct_cost_categories,
      });
    } else {
      actions.update_profit_and_loss_field(
        "financial_year",
        next_financial_year,
      );
      actions.update_profit_and_loss_field("period_month", next_period_month);
      actions.update_profit_and_loss_field("pnl_lines", next_pnl_lines);
      actions.update_profit_and_loss_field(
        "direct_cost_categories",
        next_direct_cost_categories,
      );
    }

    set_import_message(
      `Imported ${draft_import.pnl_lines.length} P&L lines into the page.`,
    );
  }

  function handle_clear() {
    set_raw_text("");
    set_selected_file(null);
    set_draft_import(null);
    set_error_message("");
    set_import_message("");

    if (file_input_ref.current) {
      file_input_ref.current.value = "";
    }
  }

  return (
    <CollapsibleSection
      title="P&L Quick Import"
      summary="Upload a P&L PDF or paste extracted JSON"
      defaultOpen={false}
    >
      <div className="ui-panel ui-stack">
        <div>
          <div className="ui-kicker">Import helper</div>
          <h2 className="ui-card-title-sm">Load P&amp;L lines</h2>
          <p className="ui-help">
            Upload a text-based P&amp;L PDF or paste extracted P&amp;L JSON.
            The import only updates this P&amp;L page after you confirm it.
          </p>
        </div>

        <div className="ui-panel ui-stack-sm">
          <div className="ui-label">Upload P&amp;L PDF</div>

          <input
            ref={file_input_ref}
            type="file"
            accept="application/pdf,.pdf"
            className="ui-input"
            onChange={(event) => {
              const file = event.target.files?.[0] || null;
              set_selected_file(file);
              set_error_message("");
              set_import_message(file ? `Selected PDF: ${file.name}` : "");
            }}
          />

          <div className="ui-actions">
            <button
              type="button"
              className="ui-button-secondary"
              onClick={handle_extract_pdf}
              disabled={is_extracting}
            >
              {is_extracting ? "Extracting..." : "Extract PDF"}
            </button>
          </div>

          <p className="ui-help">
            This currently supports text-based PDFs. Scanned/image PDFs will
            need OCR fallback later.
          </p>
        </div>

        <div className="ui-panel ui-stack-sm">
          <div className="ui-label">Optional: paste extracted P&amp;L JSON</div>
          <textarea
            className="ui-input"
            rows={8}
            value={raw_text}
            onChange={(event) => set_raw_text(event.target.value)}
            placeholder={`{
  "financial_year": 2026,
  "period_month": "",
  "line_items": [
    { "line_name": "Sales", "amount": 1250000 },
    { "line_name": "Concrete Testing", "amount": 8500, "section": "cost_of_sales" }
  ]
}`}
          />

          <div className="ui-actions">
            <button
              type="button"
              className="ui-button-secondary"
              onClick={handle_parse}
            >
              Parse JSON
            </button>

            <button
              type="button"
              className="ui-button-secondary"
              onClick={handle_clear}
            >
              Clear
            </button>
          </div>

          {error_message ? (
            <p className="ui-help theme-danger">{error_message}</p>
          ) : null}

          {import_message ? (
            <p className="ui-help">
              <strong>{import_message}</strong>
            </p>
          ) : null}
        </div>

        {draft_import ? (
          <div className="ui-panel ui-stack-sm">
            <div className="ui-kicker">Import preview</div>

            {draft_import.source_file ? (
              <p className="ui-help">
                Source: <strong>{draft_import.source_file}</strong>
              </p>
            ) : null}

            <div className="labour-summary-table">
              <div className="labour-summary-table-row">
                <div className="labour-summary-table-label">Trading income</div>
                <div className="labour-summary-table-value">
                  {section_counts.trading_income}
                </div>
              </div>

              <div className="labour-summary-table-row">
                <div className="labour-summary-table-label">Cost of sales</div>
                <div className="labour-summary-table-value">
                  {section_counts.cost_of_sales}
                </div>
              </div>

              <div className="labour-summary-table-row">
                <div className="labour-summary-table-label">Other income</div>
                <div className="labour-summary-table-value">
                  {section_counts.other_income}
                </div>
              </div>

              <div className="labour-summary-table-row">
                <div className="labour-summary-table-label">
                  Operating expenses
                </div>
                <div className="labour-summary-table-value">
                  {section_counts.operating_expenses}
                </div>
              </div>
            </div>

            <div className="ui-stack-sm">
              {draft_import.pnl_lines.slice(0, 12).map((line) => (
                <div key={line.pnl_line_id} className="ui-panel ui-stack-sm">
                  <div className="ui-label">{line.line_name}</div>
                  <div className="ui-help">
                    {line.section} · {line.category}
                    {line.direct_cost_category_id
                      ? ` · ${line.direct_cost_category_id}`
                      : ""}
                  </div>
                  <div className="ui-help">Amount: {line.amount}</div>
                </div>
              ))}
            </div>

            {draft_import.pnl_lines.length > 12 ? (
              <p className="ui-help">
                Showing first 12 of {draft_import.pnl_lines.length} imported
                lines.
              </p>
            ) : null}

            {draft_import.unmatched_lines?.length > 0 ? (
              <div className="ui-panel ui-stack-sm theme-warn-soft">
                <div className="ui-kicker theme-warn">Unmatched PDF lines</div>
                {draft_import.unmatched_lines.slice(0, 8).map((line, index) => (
                  <div key={`${line}_${index}`} className="ui-help">
                    {line}
                  </div>
                ))}
              </div>
            ) : null}

            <div className="ui-actions">
              <button
                type="button"
                className="ui-button-primary"
                onClick={handle_confirm_import}
              >
                Confirm Import
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </CollapsibleSection>
  );
}