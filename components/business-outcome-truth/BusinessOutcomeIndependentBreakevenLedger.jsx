"use client";

import {
  calculateIndependentMaterialsBreakeven,
  calculateIndependentGroupBreakeven,
} from "@/lib/calculations/businessModellingIndependentCalculations";

function format_currency(value) {
  const n = Number(value) || 0;
  return n.toLocaleString("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  });
}

function format_percent(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";
  return `${n.toFixed(1)}%`;
}

function VerdictTag({ is_at_or_above_breakeven, available }) {
  if (!available) {
    return <span className="business-outcome-ledger-status-tag neutral">n/a</span>;
  }
  return (
    <span
      className={
        "business-outcome-ledger-status-tag " +
        (is_at_or_above_breakeven ? "good" : "bad")
      }
    >
      {is_at_or_above_breakeven ? "covering its cost" : "below breakeven"}
    </span>
  );
}

/**
 * BusinessOutcomeIndependentBreakevenLedger
 *
 * Two separate things, deliberately not mixed together:
 *
 * 1. GROUPS (Foreman, 2inc Line, Site Crew, PC55, PC15) - genuinely
 *    independent, standalone breakeven positions. These do not change
 *    when View A/View B is toggled elsewhere on the page.
 *
 * 2. MATERIALS / COGS - NOT independent. There is no honest standalone
 *    revenue figure for materials on its own; it only exists as "whatever
 *    is left over once labour and assets claim their real, full cost
 *    first" (the same test View A runs). So instead of presenting a fake
 *    "independent" materials number, this shows that claim test directly:
 *    total revenue, minus labour's claim, minus assets' claim, equals
 *    what's left for materials, compared against materials' true cost.
 *    A markup below 0% here means labour and assets are currently
 *    claiming more of total revenue than the business can support -
 *    not that materials itself is mispriced.
 *
 * IMPORTANT: the `materials` prop passed in here MUST be
 * per_source.real_capacity.materials (which uses field name modelled_revenue),
 * NOT per_source.materials (which uses field name .revenue instead). See
 * hooks/useBusinessOutcomePerSourceRevenue.js line ~872 for where
 * real_capacity.materials is built. total_revenue_reference,
 * labour_modelled_revenue_total and asset_modelled_revenue_total come
 * from the top level of per_source (not nested under real_capacity).
 *
 * Does not calculate anything itself - calculateIndependentMaterialsBreakeven
 * and calculateIndependentGroupBreakeven remain the single owning source of
 * the groups/markup maths (lib/calculations/businessModellingIndependentCalculations.js).
 * The revenue claim walkthrough below is display-only arithmetic on values
 * already calculated upstream in the hook.
 */
export default function BusinessOutcomeIndependentBreakevenLedger({
  materials,
  group_real_capacity,
  total_revenue_reference,
  labour_modelled_revenue_total,
  asset_modelled_revenue_total,
}) {
  const materials_result = calculateIndependentMaterialsBreakeven({
    materials: materials || {},
  });

  const group_rows = (group_real_capacity || []).map((g) => ({
    group_id: g.group_id,
    group_name: g.group_name,
    modelled_revenue: g.modelled_revenue,
    true_cost: g.true_cost,
    result: calculateIndependentGroupBreakeven({ group: g }),
  }));

  const total_revenue = Number(total_revenue_reference) || 0;
  const labour_claim = Number(labour_modelled_revenue_total) || 0;
  const asset_claim = Number(asset_modelled_revenue_total) || 0;
  const left_for_materials = total_revenue - labour_claim - asset_claim;

  let claim_test_callout = null;
  if (materials_result.available) {
    const markup = materials_result.current_markup_percent;
    if (markup < 0) {
      claim_test_callout =
        "Materials/COGS markup is below 0%, which means labour and assets are currently claiming more of total revenue than the business can support - most likely because charge-out rates, utilisation, or both are too low. Materials' own margin is what's absorbing the difference.";
    } else if (markup === 0) {
      claim_test_callout =
        "Materials/COGS is sitting right at 0% under this test - it's covering its own true cost, but not adding any margin on top.";
    } else {
      claim_test_callout =
        "Materials/COGS is sitting above breakeven under this test, with margin left over even after labour and assets take their real, full claim first.";
    }
  }

  return (
    <div className="business-outcome-ledger">
      <div className="business-outcome-ledger-section-title">
        Independent Breakeven - Groups
      </div>
      <div className="ui-help">
        Each group&apos;s own, standalone breakeven position - what it genuinely
        earns and costs on its own terms, unaffected by which view (A or B) is
        selected elsewhere on this page. Materials/COGS is not shown here -
        see the revenue claim test below for why.
      </div>

      <div className="business-outcome-ledger-table">
        <div className="business-outcome-ledger-row business-outcome-ledger-header">
          <span>Source</span>
          <span>Modelled revenue</span>
          <span>True cost</span>
          <span>Status</span>
        </div>

        {group_rows.map(({ group_id, group_name, modelled_revenue, true_cost, result }) => (
          <div className="business-outcome-ledger-row" key={group_id || group_name}>
            <span>{group_name}</span>
            <span>{format_currency(modelled_revenue)}</span>
            <span>{format_currency(true_cost)}</span>
            <span>
              <VerdictTag
                is_at_or_above_breakeven={result.is_at_or_above_breakeven}
                available={result.available}
              />
            </span>
          </div>
        ))}
      </div>

      <div className="business-outcome-ledger-section-title">
        Revenue Claim Test - Materials / COGS
      </div>
      <div className="ui-help">
        This tests what would be left for Materials/COGS if Labour and Assets
        are paid their full, real cost first - the same test View A uses,
        made visible here so the numbers behind &quot;Your business, right
        now&quot; can be checked directly.
      </div>
      <div className="business-outcome-ledger-metrics">
        <div className="business-outcome-ledger-metric">
          <span className="business-outcome-ledger-metric-label">Total business revenue</span>
          <span className="business-outcome-ledger-metric-value">{format_currency(total_revenue)}</span>
        </div>
        <div className="business-outcome-ledger-metric">
          <span className="business-outcome-ledger-metric-label">Less: Labour&apos;s real claim</span>
          <span className="business-outcome-ledger-metric-value">- {format_currency(labour_claim)}</span>
        </div>
        <div className="business-outcome-ledger-metric">
          <span className="business-outcome-ledger-metric-label">Less: Assets&apos; real claim</span>
          <span className="business-outcome-ledger-metric-value">- {format_currency(asset_claim)}</span>
        </div>
        <div className="business-outcome-ledger-metric">
          <span className="business-outcome-ledger-metric-label">Left over for Materials/COGS</span>
          <span className="business-outcome-ledger-metric-value">{format_currency(left_for_materials)}</span>
        </div>
        <div className="business-outcome-ledger-metric">
          <span className="business-outcome-ledger-metric-label">Materials/COGS true cost</span>
          <span className="business-outcome-ledger-metric-value">{format_currency(materials_result.true_cost)}</span>
        </div>
        <div className="business-outcome-ledger-metric">
          <span className="business-outcome-ledger-metric-label">Resulting markup (breakeven = 0%)</span>
          <span className="business-outcome-ledger-metric-value">
            {materials_result.available ? format_percent(materials_result.current_markup_percent) : "n/a"}
          </span>
        </div>
      </div>
      {claim_test_callout && <div className="ui-help">{claim_test_callout}</div>}

      <div className="business-outcome-ledger-section-title">Materials / COGS markup detail</div>
      {materials_result.available ? (
        <div className="business-outcome-ledger-metrics">
          <div className="business-outcome-ledger-metric">
            <span className="business-outcome-ledger-metric-label">Current markup</span>
            <span className="business-outcome-ledger-metric-value">
              {format_percent(materials_result.current_markup_percent)}
            </span>
          </div>
          <div className="business-outcome-ledger-metric">
            <span className="business-outcome-ledger-metric-label">Breakeven markup</span>
            <span className="business-outcome-ledger-metric-value">
              {format_percent(materials_result.breakeven_markup_percent)}
            </span>
          </div>
          <div className="business-outcome-ledger-metric">
            <span className="business-outcome-ledger-metric-label">Gap to breakeven</span>
            <span className="business-outcome-ledger-metric-value">
              {format_percent(materials_result.required_markup_delta_percent)}
            </span>
          </div>
        </div>
      ) : (
        <div className="ui-help">
          {materials_result.reason || "Not enough data yet to calculate this independently."}
        </div>
      )}

      <div className="business-outcome-ledger-section-title">Groups detail</div>
      {group_rows.map(({ group_id, group_name, result }) => (
        <div className="business-outcome-ledger-metrics" key={(group_id || group_name) + "-detail"}>
          <div className="business-outcome-ledger-metric">
            <span className="business-outcome-ledger-metric-label">{group_name}</span>
            <span className="business-outcome-ledger-metric-value">
              {result.available
                ? `${format_currency(result.current_rate_per_hour)}/hr vs ${format_currency(
                    result.breakeven_rate_per_hour
                  )}/hr breakeven`
                : result.reason || "not enough data"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}