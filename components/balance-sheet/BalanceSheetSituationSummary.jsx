"use client";

function format_currency(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "N/A";
  const sign = Number(value) < 0 ? "-" : "";
  const abs = Math.abs(Number(value));
  return `${sign}${new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(abs)}`;
}

/**
 * BalanceSheetSituationSummary
 *
 * Live narrative summary reacting to the real computed ratios - matches
 * the "Your business, right now" blurb pattern from
 * BusinessOutcomeTruthSituationSummary.jsx (build_situation_summary +
 * exported wrapper, paragraph array of coloured segments). Built
 * 2026-09-12 alongside BalanceSheetHelpPanel after the user asked for
 * both the static explainer AND a results narrative like Business
 * Outcome has, reacting to whatever scenario this page's real data
 * produces (not a fixed template - the actual thresholds below decide
 * which sentences appear).
 */
function build_situation_summary({ ratios, as_at_date }) {
  const paragraphs = [];

  if (!ratios || !ratios.available) return paragraphs;

  const { working_capital, current_ratio, quick_ratio, debt_to_equity } = ratios;

  // === Working capital + current ratio ===
  if (working_capital !== null && current_ratio !== null) {
    if (working_capital >= 0 && current_ratio >= 1) {
      paragraphs.push([
        { type: "text", text: "As at " },
        { type: "text", text: as_at_date || "the imported date" },
        { type: "text", text: ", the business has " },
        { type: "text", text: `${format_currency(working_capital)} more`, class: "value-good" },
        { type: "text", text: " in current assets than current liabilities - a " },
        { type: "text", text: `${current_ratio.toFixed(2)} current ratio`, class: "value-good" },
        { type: "text", text: ", meaning short-term assets comfortably cover short-term obligations." },
      ]);
    } else {
      paragraphs.push([
        { type: "text", text: "As at " },
        { type: "text", text: as_at_date || "the imported date" },
        { type: "text", text: ", current liabilities exceed current assets by " },
        { type: "text", text: format_currency(Math.abs(working_capital)), class: "value-bad" },
        { type: "text", text: " - a current ratio of " },
        { type: "text", text: current_ratio.toFixed(2), class: "value-bad" },
        { type: "text", text: ". If every short-term obligation came due at once, short-term assets alone wouldn't cover it - worth understanding what's backing this gap (an overdraft or credit facility, for example) before treating it as a crisis." },
      ]);
    }
  }

  // === Quick ratio, only flagged separately if meaningfully different from current ratio ===
  if (quick_ratio !== null && current_ratio !== null) {
    const gap = current_ratio - quick_ratio;
    if (gap > 0.05) {
      paragraphs.push([
        { type: "text", text: "Excluding prepayments (money already spent, not recoverable as cash), the quick ratio is a tighter " },
        { type: "text", text: quick_ratio.toFixed(2), class: quick_ratio < 1 ? "value-bad" : "value-neutral" },
        { type: "text", text: " - worth knowing the current ratio above is somewhat flattered by prepaid amounts." },
      ]);
    }
  }

  // === Debt to equity ===
  if (debt_to_equity !== null) {
    if (debt_to_equity > 2) {
      paragraphs.push([
        { type: "text", text: "The business is carrying " },
        { type: "text", text: `${debt_to_equity.toFixed(2)}x`, class: "value-bad" },
        { type: "text", text: " as much debt as owner equity - a debt-to-equity ratio above 2 generally signals the business leans heavily on debt financing rather than owner capital. Some industries (asset-heavy ones like construction) typically run higher than others, so this is worth benchmarking against similar businesses rather than a fixed rule." },
      ]);
    } else if (debt_to_equity >= 0) {
      paragraphs.push([
        { type: "text", text: "Debt to equity sits at " },
        { type: "text", text: `${debt_to_equity.toFixed(2)}x`, class: "value-neutral" },
        { type: "text", text: " - within a commonly-cited comfortable range, though this varies by industry." },
      ]);
    }
  }

  // === Closing ===
  if (paragraphs.length > 0) {
    paragraphs.push(
      "These figures describe what's in the Balance Sheet, not what to do about it - worth discussing with whoever manages the books or your accountant before drawing conclusions."
    );
  }

  return paragraphs;
}

export function BalanceSheetSituationBlurb({ ratios, as_at_date }) {
  const summary_paragraphs = build_situation_summary({ ratios, as_at_date });

  if (summary_paragraphs.length === 0) return null;

  return (
    <div className="ui-card theme-card-muted business-outcome-help-panel">
      <h2>Your Balance Sheet, right now</h2>
      {summary_paragraphs.map((paragraph, index) => (
        <p key={index}>
          {Array.isArray(paragraph)
            ? paragraph.map((segment, seg_index) => (
                <span key={seg_index} className={segment.class || undefined}>
                  {segment.text}
                </span>
              ))
            : paragraph}
        </p>
      ))}
    </div>
  );
}