"use client";

function get_section_lines(pnl_lines = [], section) {
  return (pnl_lines ?? []).filter((line) => line.section === section);
}

function is_review_line(line) {
  const category = line.category || "unassigned";

  if (category === "review_required") return true;
  if (category === "unassigned") return true;

  if (
    line.section === "cost_of_sales" &&
    category === "cogs" &&
    !line.direct_cost_category_id
  ) {
    return true;
  }

  return false;
}

function get_section_status(pnl_lines = [], section) {
  const lines = get_section_lines(pnl_lines, section);
  const review_count = lines.filter(is_review_line).length;
  const ready_count = Math.max(lines.length - review_count, 0);

  if (lines.length === 0) {
    return {
      ready_count: 0,
      review_count: 0,
      total_count: 0,
      label: "No lines",
      status: "Not started",
      tone: "muted",
    };
  }

  if (review_count > 0) {
    return {
      ready_count,
      review_count,
      total_count: lines.length,
      label: `${ready_count} of ${lines.length} classified`,
      status: "Needs review",
      tone: "warn",
    };
  }

  return {
    ready_count,
    review_count,
    total_count: lines.length,
    label: `${lines.length} of ${lines.length} classified`,
    status: "Ready",
    tone: "ready",
  };
}

function ProgressRow({ label, progress }) {
  return (
    <div className="labour-summary-table-row">
      <div className="labour-summary-table-label">
        <div>{label}</div>
        <div className="ui-help">{progress.label}</div>
      </div>

      <div className="labour-summary-table-value">
        <span className={`pnl-status-pill pnl-status-pill--${progress.tone}`}>
          {progress.status}
        </span>
      </div>
    </div>
  );
}

export default function ProfitAndLossProgressPanel({
  state,
  summary,
  warnings = [],
}) {
  const pnl_lines = state?.pnl_lines ?? [];

  const trading_income_progress = get_section_status(
    pnl_lines,
    "trading_income",
  );
  const cost_of_sales_progress = get_section_status(
    pnl_lines,
    "cost_of_sales",
  );
  const other_income_progress = get_section_status(pnl_lines, "other_income");
  const operating_expenses_progress = get_section_status(
    pnl_lines,
    "operating_expenses",
  );

  const review_count =
    trading_income_progress.review_count +
    cost_of_sales_progress.review_count +
    other_income_progress.review_count +
    operating_expenses_progress.review_count;

  const pnl_ready = summary?.pnl_ready || "Not ready";
  const has_warnings = warnings.length > 0 || review_count > 0;

  return (
    <section className="ui-section">
      <div className="ui-panel ui-stack-sm pnl-guidance-panel">
        <div>
          <div className="ui-kicker">P&amp;L setup progress</div>
          <h2 className="ui-card-title-sm">Baseline readiness check</h2>
          <p className="ui-help">
            Use this checkpoint to see whether the P&amp;L baseline is ready to
            flow into the next Mirra setup pages.
          </p>
        </div>

        <div className="labour-summary-table">
          <ProgressRow
            label="Trading Income"
            progress={trading_income_progress}
          />
          <ProgressRow
            label="Cost of Sales"
            progress={cost_of_sales_progress}
          />
          <ProgressRow label="Other Income" progress={other_income_progress} />
          <ProgressRow
            label="Operating Expenses"
            progress={operating_expenses_progress}
          />

          <div className="labour-summary-table-spacer" />

          <div className="labour-summary-table-row total">
            <div className="labour-summary-table-label">Review required</div>
            <div className="labour-summary-table-value">
              {review_count} {review_count === 1 ? "line" : "lines"}
            </div>
          </div>

          <div className="labour-summary-table-row total">
            <div className="labour-summary-table-label">P&amp;L ready</div>
            <div className="labour-summary-table-value">{pnl_ready}</div>
          </div>
        </div>

        {has_warnings ? (
          <p className="ui-help">
            Resolve review items and warnings before relying on this P&amp;L as
            the source baseline for recovery and outcome modelling.
          </p>
        ) : (
          <p className="ui-help">
            This P&amp;L baseline is ready for the downstream Mirra setup pages.
          </p>
        )}
      </div>
    </section>
  );
}