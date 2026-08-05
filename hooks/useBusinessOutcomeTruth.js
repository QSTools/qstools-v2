"use client";

import { useMemo } from "react";

import useBusinessSummary from "@/hooks/useBusinessSummary";
import useRevenueCogs from "@/hooks/useRevenueCogs";
import useRevenueSummary from "@/hooks/useRevenueSummary";

// ---------------------------------------------------------------------------
// STAGE 2 - Business Outcome dual-view rebuild (2026-08-05)
//
// This hook builds the v5.0 truth-chain Business Outcome output_contract,
// per S16_BUSINESS_OUTCOME_BUILD_BRIEF_v5.0.txt section 6.
//
// It is DATA-LAYER ONLY. No UI is built on top of it in this stage.
//
// It consumes, read-only, the already-computed output_contracts of:
//   - Business Summary   (useBusinessSummary) - itself correctly wires
//     Cost Summary via Model Readiness, so we source cost-burden and
//     recovery figures through it rather than duplicating that wiring.
//   - Revenue / COG truth (useRevenueCogs)
//   - Revenue Summary     (useRevenueSummary)
//
// KNOWN UPSTREAM GAP (found during Stage 2 build, not fixed here):
// useRevenueSummary.js internally calls useCostSummary() with NO inputs,
// while useCostSummary requires { labour, assets, general_overheads,
// opening_hours, model_readiness } to produce real figures (see how
// useBusinessSummary wires it). This means any cost-summary-derived value
// *inside* Revenue Summary's own calculations may currently be computed
// against blank/zeroed cost data - confirmed by inspecting
// revenueSummaryCalculations.js: total_cost_burden flows straight into
// required_revenue, revenue_gap, profit_gap, actual_profit_model and
// labour_variance. This hook avoids relying on that path - all cost-burden
// and recovery figures below come from Business Summary's output_contract
// instead, which wires Cost Summary correctly. Revenue Summary's own
// directly-entered fields (sales_revenue, material/delivery/operating cost
// lines, target assumptions) are unaffected by this gap and are used as-is.
// This gap should be logged as a known issue for a future Revenue Summary
// fix - it is out of scope for this hook to correct. An automated check
// below surfaces it in data_quality_list if it's still present.
//
// Fields not currently calculable from any available source are returned
// as { value: null, status: "deferred", reason: "..." } rather than
// invented, per the S16 requirement.
// ---------------------------------------------------------------------------

export const BUSINESS_OUTCOME_OUTPUT_CONTRACT_FIELDS = [
  "output_contract_version",
  "source_period",
  "data_status",
  "reconciliation_status",
  "total_revenue",
  "total_COG",
  "gross_profit",
  "gross_margin_percent",
  "total_cost_burden",
  "required_revenue",
  "revenue_surplus_or_gap",
  "required_recovery",
  "achieved_recovery",
  "recovery_surplus_or_gap",
  "operating_profit_before_tax",
  "net_operating_margin",
  "productive_output",
  "cost_absorption_status",
  "primary_driver_key",
  "primary_driver_title",
  "primary_driver_evidence",
  "strongest_contribution_area",
  "weakest_contribution_area",
  "warning_list",
  "data_quality_list",
  "downstream_ready",
];

function deferred(reason) {
  return { value: null, status: "deferred", reason };
}

function available(value) {
  return { value, status: "available" };
}

export default function useBusinessOutcomeTruth() {
  const business_summary = useBusinessSummary();
  const revenue_cogs = useRevenueCogs();
  const revenue_summary = useRevenueSummary();

  const bs = business_summary.output_contract ?? {};
  const rc = revenue_cogs.output_contract ?? {};
  const rs = revenue_summary.output_contract ?? {};

  return useMemo(() => {
    const revenue_cogs_ready = rc.revenue_cogs_ready === true;
    const cost_summary_ready = bs.cost_summary_ready === true;
    const business_summary_ready = bs.business_summary_ready === true;

    const all_sources_ready =
      revenue_cogs_ready && cost_summary_ready && business_summary_ready;

    const data_status = all_sources_ready
      ? "complete"
      : revenue_cogs_ready || cost_summary_ready || business_summary_ready
        ? "partial"
        : "blocked";

    const revenue_matches =
      Math.abs((bs.total_revenue ?? 0) - (rc.total_revenue ?? 0)) < 0.01;
    const direct_costs_match =
      Math.abs((bs.total_direct_costs ?? 0) - (rc.total_direct_costs ?? 0)) 
      0.01;
    const reconciliation_status =
      revenue_matches && direct_costs_match ? "reconciled" : "mismatch";

    const total_revenue = bs.total_revenue ?? 0;
    const total_COG = bs.total_direct_costs ?? 0;
    const gross_profit = bs.margin_pool ?? 0;
    const gross_margin_percent = bs.gross_margin_percent ?? 0;

    const total_cost_burden = bs.total_cost_burden ?? 0;
    const required_revenue = bs.total_cost_burden ?? 0;

    const revenue_surplus_or_gap = total_revenue - required_revenue;

    const required_recovery = total_cost_burden;
    const achieved_recovery = gross_profit;
    const recovery_surplus_or_gap = achieved_recovery - required_recovery;

    const operating_profit_before_tax = bs.net_position ?? recovery_surplus_or_gap;

    const net_operating_margin =
      total_revenue > 0
        ? (operating_profit_before_tax / total_revenue) * 100
        : 0;

    const productive_output = bs.total_productive_output ?? 0;

    const cost_absorption_status = !all_sources_ready
      ? "unavailable"
      : recovery_surplus_or_gap >= 0
        ? "absorbed"
        : "not_absorbed";

    const warning_list = [
      ...(Array.isArray(bs.business_summary_warnings)
        ? bs.business_summary_warnings
        : []),
      ...(Array.isArray(rc.revenue_cogs_warnings) ? rc.revenue_cogs_warnings : []),
    ];

    if (reconciliation_status === "mismatch") {
      warning_list.push(
        "Business Summary's revenue/direct-cost figures do not match Revenue/COG truth output - investigate wiring."
      );
    }

    const data_quality_list = [];
    if (!revenue_cogs_ready) {
      data_quality_list.push("Revenue/COG truth is not yet marked ready.");
    }
    if (!cost_summary_ready) {
      data_quality_list.push("Cost Summary is not yet marked ready.");
    }
    if (!business_summary_ready) {
      data_quality_list.push("Business Summary is not yet marked ready.");
    }
    if (bs.has_productive_asset_recovery_base === false) {
      data_quality_list.push(
        "No productive asset recovery base found - asset-side figures may be incomplete."
      );
    }

    const downstream_ready = all_sources_ready && warning_list.length === 0;

    const revenue_summary_sales_revenue = rs.sales_revenue ?? 0;
    const revenue_summary_material_cost_total = rs.material_cost_total ?? 0;
    const revenue_summary_operating_expenses_total =
      rs.operating_expenses_total ?? 0;
    const revenue_summary_total_delivery_cost = rs.total_delivery_cost ?? 0;

    const revenue_summary_cost_burden_looks_zeroed =
      total_cost_burden > 0 && (rs.total_cost_burden ?? 0) === 0;

    if (revenue_summary_cost_burden_looks_zeroed) {
      data_quality_list.push(
        "Revenue Summary's internal total_cost_burden is reading as 0 while Business Summary reports a real cost burden - confirms the known useRevenueSummary.js/useCostSummary wiring gap. Revenue Summary's own displayed required_revenue, revenue_gap, profit_gap and actual_profit_model figures are likely wrong until this is fixed."
      );
    }

    const source_period = deferred(
      "No period/date identity is currently exposed by any upstream module. Requires the Identity and Relationship Register work (S14 Workstream 4) before this can be populated."
    );

    const primary_driver = {
      key: deferred(
        "Driver records are explicitly out of scope for Stage 2 (S16 section 8, deferred unless trivial)."
      ),
      title: deferred(
        "Driver records are explicitly out of scope for Stage 2 (S16 section 8, deferred unless trivial)."
      ),
      evidence: deferred(
        "Driver records are explicitly out of scope for Stage 2 (S16 section 8, deferred unless trivial)."
      ),
    };

    const strongest_contribution_area = deferred(
      "Contribution analysis by revenue stream / operating group is explicitly out of scope for Stage 2 (S16 section 7, deferred unless trivial)."
    );
    const weakest_contribution_area = deferred(
      "Contribution analysis by revenue stream / operating group is explicitly out of scope for Stage 2 (S16 section 7, deferred unless trivial)."
    );

    const output_contract = {
      output_contract_version: "business_outcome_v5_s16_stage2",
      source_period,
      data_status,
      reconciliation_status,

      total_revenue: available(total_revenue),
      total_COG: available(total_COG),
      gross_profit: available(gross_profit),
      gross_margin_percent: available(gross_margin_percent),

      total_cost_burden: available(total_cost_burden),
      required_revenue: available(required_revenue),
      revenue_surplus_or_gap: available(revenue_surplus_or_gap),

      required_recovery: available(required_recovery),
      achieved_recovery: available(achieved_recovery),
      recovery_surplus_or_gap: available(recovery_surplus_or_gap),

      operating_profit_before_tax: available(operating_profit_before_tax),
      net_operating_margin: available(net_operating_margin),

      productive_output: available(productive_output),
      cost_absorption_status: available(cost_absorption_status),

      primary_driver_key: primary_driver.key,
      primary_driver_title: primary_driver.title,
      primary_driver_evidence: primary_driver.evidence,

      strongest_contribution_area,
      weakest_contribution_area,

      warning_list: available(warning_list),
      data_quality_list: available(data_quality_list),
      downstream_ready: available(downstream_ready),
    };

    if (process.env.NODE_ENV !== "production") {
      const missing_fields = BUSINESS_OUTCOME_OUTPUT_CONTRACT_FIELDS.filter(
        (field) => !(field in output_contract)
      );
      if (missing_fields.length > 0) {
        // eslint-disable-next-line no-console
        console.warn(
          "[useBusinessOutcomeTruth] Missing required S16 output_contract fields:",
          missing_fields
        );
      }
    }

    return {
      output_contract,
      _diagnostics: {
        revenue_summary_sales_revenue,
        revenue_summary_material_cost_total,
        revenue_summary_operating_expenses_total,
        revenue_summary_total_delivery_cost,
        revenue_summary_cost_burden_looks_zeroed,
      },
    };
  }, [bs, rc, rs]);
}
