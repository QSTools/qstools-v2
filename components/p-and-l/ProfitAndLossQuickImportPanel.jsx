"use client";

import { useMemo, useRef, useState } from "react";
import CollapsibleSection from "@/components/common/CollapsibleSection";
import ProfitAndLossQuickImportFilePanel from "@/components/p-and-l/quick-import/ProfitAndLossQuickImportFilePanel";
import ProfitAndLossQuickImportJsonPanel from "@/components/p-and-l/quick-import/ProfitAndLossQuickImportJsonPanel";
import ProfitAndLossQuickImportPreview from "@/components/p-and-l/quick-import/ProfitAndLossQuickImportPreview";
import {
  build_direct_cost_categories_from_pnl_lines,
  build_draft_import,
  clean_amount,
  count_by_section,
  is_excel_or_csv_file,
  is_pdf_file,
  make_imported_cogs_category_id,
  normalise_direct_cost_categories,
  parse_json_import,
} from "@/components/p-and-l/quick-import/profitAndLossQuickImportHelpers";
import { parse_profit_and_loss_excel_file } from "@/lib/p-and-l/profitAndLossExcelImporter";

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

  async function handle_extract_file() {
    set_error_message("");
    set_import_message("");

    const file = selected_file || file_input_ref.current?.files?.[0] || null;

    if (!file) {
      set_error_message(
        "Choose a P&L Excel, CSV, or PDF file first. If the file name is visible, reselect it and click Extract again.",
      );
      return;
    }

    set_is_extracting(true);

    try {
      if (is_excel_or_csv_file(file)) {
        const payload = await parse_profit_and_loss_excel_file(file);
        const parsed = build_draft_import(payload);

        if (parsed.pnl_lines.length === 0) {
          set_draft_import(null);
          set_error_message("No P&L lines were extracted from the Excel file.");
          return;
        }

        set_draft_import(parsed);
        set_selected_file(file);
        set_import_message(
          `${parsed.pnl_lines.length} lines extracted from Excel and ready to import.`,
        );
        return;
      }

      if (!is_pdf_file(file)) {
        throw new Error("Unsupported file type. Upload .xlsx, .xls, .csv, or .pdf.");
      }

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
      set_error_message(error?.message || "Could not extract the P&L file.");
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

    const imported_pnl_lines = Array.isArray(draft_import.pnl_lines)
      ? draft_import.pnl_lines
      : [];

    const next_pnl_lines = imported_pnl_lines.map((line) => {
      if (line?.section !== "cost_of_sales") {
        return {
          ...line,
          amount: clean_amount(line.amount),
          source_type: line.source_type || draft_import.source_type || "",
          import_source: line.import_source || draft_import.source_type || "",
        };
      }

      return {
        ...line,
        section: "cost_of_sales",
        category: "cogs",
        amount: clean_amount(line.amount),
        direct_cost_category_id: make_imported_cogs_category_id(line.line_name),
        review_subcategory: "",
        source_type: line.source_type || draft_import.source_type || "",
        import_source: line.import_source || draft_import.source_type || "",
      };
    });

    const next_direct_cost_categories = normalise_direct_cost_categories(
      build_direct_cost_categories_from_pnl_lines(next_pnl_lines),
    );

    const next_state = {
      ...state,
      financial_year: next_financial_year,
      period_month: next_period_month,
      pnl_lines: next_pnl_lines,
      direct_cost_categories: next_direct_cost_categories,
    };

    if (typeof actions.set_profit_and_loss_state === "function") {
      actions.set_profit_and_loss_state(next_state);
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
      `Imported ${next_pnl_lines.length} P&L lines into the page.`,
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
      summary="Upload a P&L Excel, CSV, PDF, or paste extracted JSON"
      defaultOpen={false}
    >
      <div className="ui-panel ui-stack">
        <div>
          <div className="ui-kicker">Import helper</div>
          <h2 className="ui-card-title-sm">Load P&amp;L lines</h2>
          <p className="ui-help">
            Upload a P&amp;L Excel, CSV, or text-based PDF, or paste extracted
            P&amp;L JSON. Excel / CSV is preferred because it preserves
            structured accounting lines more safely.
          </p>
        </div>

        <ProfitAndLossQuickImportFilePanel
          file_input_ref={file_input_ref}
          handle_extract_file={handle_extract_file}
          is_extracting={is_extracting}
          set_error_message={set_error_message}
          set_import_message={set_import_message}
          set_selected_file={set_selected_file}
        />

        <ProfitAndLossQuickImportJsonPanel
          error_message={error_message}
          handle_clear={handle_clear}
          handle_parse={handle_parse}
          import_message={import_message}
          raw_text={raw_text}
          set_raw_text={set_raw_text}
        />

        <ProfitAndLossQuickImportPreview
          draft_import={draft_import}
          handle_confirm_import={handle_confirm_import}
          section_counts={section_counts}
        />
      </div>
    </CollapsibleSection>
  );
}
