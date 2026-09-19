"use client";

// DEV-ONLY read-only page (v6.0 Phase 1): runs the cross-import alignment
// check against the live loaded P&L, Revenue/COGS and Balance Sheet.
// The year-end month is a TEMPORARY on-page input until the tool has a
// real financial year-end setting. Blank = "cannot compare", never a guess.

import { useEffect, useMemo, useState } from "react";

import useProfitAndLoss from "@/hooks/useProfitAndLoss";
import useRevenueCogs from "@/hooks/useRevenueCogs";
import useBalanceSheet from "@/hooks/useBalanceSheet";
import { calculateCrossImportAlignment } from "@/lib/calculations/crossImportAlignmentCheck";

const PNL_STORAGE_KEY = "qs_tools_profit_and_loss_state";

const MONTH_OPTIONS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function read_pnl_period() {
  try {
    const raw = window.localStorage.getItem(PNL_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return {
      financial_year: parsed?.financial_year ?? "",
      period_month: parsed?.period_month ?? "",
    };
  } catch {
    return {};
  }
}

function format_amount(value) {
  const number = Number(value);
  return Number.isFinite(number)
    ? number.toLocaleString("en-NZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : String(value);
}

function CheckResult({ check }) {
  const offenders = Array.isArray(check.offenders) ? check.offenders : [];

  return (
    <div className="ui-panel ui-stack-sm">
      <div className="ui-kicker">{check.status.toUpperCase().replace("_", " ")}</div>
      <div className="ui-card-title-sm">{check.label}</div>
      <p className="ui-help">{check.detail}</p>

      {check.values ? (
        <pre className="ui-help">{JSON.stringify(check.values, null, 2)}</pre>
      ) : null}

      {offenders.length > 0 ? (
        <div className="ui-stack-sm">
          <div className="ui-kicker">Lines explaining the difference</div>
          {offenders.map((line, index) => (
            <p className="ui-help" key={`${line.pnl_line_id}-${index}`}>
              {line.line_name || "(unnamed)"} - {format_amount(line.amount)} -{" "}
              {line.reason} [section: {line.section || "none"}, category:{" "}
              {line.category || "none"}, direct cost category:{" "}
              {line.direct_cost_category_id || "none"}]
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function CrossImportCheckPage() {
  const pnl = useProfitAndLoss();
  const revenue_cogs = useRevenueCogs();
  const balance_sheet = useBalanceSheet();

  const [pnl_period, set_pnl_period] = useState({});
  const [year_end_month, set_year_end_month] = useState("");

  useEffect(() => {
    set_pnl_period(read_pnl_period());
  }, []);

  const result = useMemo(() => {
    return calculateCrossImportAlignment({
      pnl_output_contract: pnl.output_contract,
      pnl_state: pnl_period,
      revenue_cogs_output_contract: revenue_cogs.output_contract,
      balance_sheet_state: { as_at_date: balance_sheet.as_at_date },
      options: {
        financial_year_end_month: year_end_month ? Number(year_end_month) : null,
      },
    });
  }, [
    pnl.output_contract,
    pnl_period,
    revenue_cogs.output_contract,
    balance_sheet.as_at_date,
    year_end_month,
  ]);

  return (
    <main className="ui-page">
      <div className="ui-page-stack">
        <section className="ui-card">
          <div className="ui-card-header">
            <div>
              <div className="ui-kicker">Dev - v6.0 Phase 1</div>
              <h1 className="ui-card-title">Cross-import alignment check</h1>
              <p className="ui-help">
                Read-only. Compares the loaded P&amp;L, Revenue/COGS and
                Balance Sheet. Overall: {result.overall_status.toUpperCase()}{" "}
                ({result.fail_count} failed, {result.cannot_compare_count}{" "}
                cannot compare).
              </p>
            </div>
          </div>

          <div className="ui-stack">
            <div className="ui-readonly">
              <div className="ui-kicker">Inputs as loaded</div>
              <p className="ui-help">
                P&amp;L financial year: {pnl_period.financial_year || "not set"}
                {" | "}period month: {pnl_period.period_month || "blank (annual)"}
                {" | "}Balance Sheet as at: {balance_sheet.as_at_date || "none loaded"}
              </p>
            </div>

            <label className="ui-stack-sm">
              <span className="ui-kicker">
                Financial year-end month (temporary test input)
              </span>
              <select
                value={year_end_month}
                onChange={(event) => set_year_end_month(event.target.value)}
              >
                <option value="">Not set</option>
                {MONTH_OPTIONS.map((name, index) => (
                  <option key={name} value={String(index + 1)}>
                    {name}
                  </option>
                ))}
              </select>
            </label>

            {result.results.map((check) => (
              <CheckResult key={check.id} check={check} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}