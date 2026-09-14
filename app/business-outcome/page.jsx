"use client";
import { useState } from "react";

import useBusinessOutcomeTruth from "@/hooks/useBusinessOutcomeTruth";
import useBusinessOutcomeLabourRecovery from "@/hooks/useBusinessOutcomeLabourRecovery";
import NextStepFooter from "@/components/navigation/NextStepFooter";
import BusinessOutcomeViewSwitcher from "@/components/navigation/BusinessOutcomeViewSwitcher";
import BusinessOutcomeTruthStatusStrip from "@/components/business-outcome-truth/BusinessOutcomeTruthStatusStrip";

import BusinessOutcomeTruthLabourRecoveryCard from "@/components/business-outcome-truth/BusinessOutcomeTruthLabourRecoveryCard";
import useBusinessOutcomeRevenueSplit from "@/hooks/useBusinessOutcomeRevenueSplit";
import BusinessOutcomeTruthRevenueSplitCard from "@/components/business-outcome-truth/BusinessOutcomeTruthRevenueSplitCard";
import useBusinessOutcomeWaterfall from "@/hooks/useBusinessOutcomeWaterfall";
import useBusinessOutcomePerSourceRevenue from "@/hooks/useBusinessOutcomePerSourceRevenue";
import { selectBusinessOutcomePerSourceRevenue } from "@/lib/selectors/business-outcome/businessOutcomePerSourceRevenueSelectors";
import BusinessOutcomePerSourceRevenueCard from "@/components/business-outcome-truth/BusinessOutcomePerSourceRevenueCard";
import { selectBusinessOutcomeWaterfall } from "@/lib/selectors/business-outcome/businessOutcomeWaterfallSelectors";

import BusinessOutcomeTruthWarningsPanel from "@/components/business-outcome-truth/BusinessOutcomeTruthWarningsPanel";
import BusinessOutcomeTruthHelpPanel from "@/components/business-outcome-truth/BusinessOutcomeTruthHelpPanel";
import BusinessOutcomeNetProfitBuildUp from "@/components/business-outcome-truth/BusinessOutcomeNetProfitBuildUp";
import CollapsibleSection from "@/components/common/CollapsibleSection";
import useBalanceSheet from "@/hooks/useBalanceSheet";
import BalanceSheetRatiosCard from "@/components/balance-sheet/BalanceSheetRatiosCard";
import Link from "next/link";
import useAssets from "@/hooks/useAssets";
import { calculateFixedAssetsReconciliation } from "@/lib/calculations/balanceSheetCalculations";
import BusinessOutcomeEbitSummaryCard from "@/components/business-outcome-truth/BusinessOutcomeEbitSummaryCard";

// STAGE 3 NOTE (Business Outcome dual-view rebuild, 2026-08-05):
// This is the new v5.0 truth-chain Business Outcome page, built on top of
// the Stage 2 useBusinessOutcomeTruth hook. It answers "is this business
// commercially viable?" using real revenue/COG/cost-burden data. It is
// distinct from, and does not share state with, the preserved
// Recovery & Rate Justification page at /recovery-outcome.
//
// STAGE 4 ADDITION (2026-08-11): added the labour recovery breakdown, via
// the separate useBusinessOutcomeLabourRecovery hook. This is additive only
// - it does not modify useBusinessOutcomeTruth.js or its output_contract.
// It compares real cost per labour source (Cost Allocation) against the
// real saved charge-out rate for that source (Rate Builder).
export default function BusinessOutcomePage() {
  const [smoothing_mode, set_smoothing_mode] = useState("smoothed");
  const [view_mode_ab, set_view_mode_ab] = useState("a");
  const { output_contract } = useBusinessOutcomeTruth();
  const labour_recovery = useBusinessOutcomeLabourRecovery();
  const revenue_split = useBusinessOutcomeRevenueSplit();
  const waterfall_calculation = useBusinessOutcomeWaterfall();
  const waterfall = selectBusinessOutcomeWaterfall(waterfall_calculation);
  const per_source_calculation = useBusinessOutcomePerSourceRevenue();
  const per_source = selectBusinessOutcomePerSourceRevenue(per_source_calculation);
  const { ratios: balance_sheet_ratios, has_data: has_balance_sheet_data, as_at_date: balance_sheet_as_at_date, accounts: balance_sheet_accounts } = useBalanceSheet();
  const balance_sheet_current_year_earnings = has_balance_sheet_data
    ? balance_sheet_accounts.find(
        (a) => String(a.account_name || "").trim().toLowerCase() === "current year earnings"
      )?.amount ?? null
    : null;
  const { active_assets } = useAssets();
  const total_asset_purchase_price = (active_assets || []).reduce(
    (sum, asset) => sum + (Number(asset.purchase_price) || 0),
    0
  );
  const fixed_assets_reconciliation = has_balance_sheet_data
    ? calculateFixedAssetsReconciliation({
        accounts: balance_sheet_accounts,
        total_purchase_price: total_asset_purchase_price,
      })
    : null;

  return (
    <div className="space-y-6 p-6">
      <div className="ui-panel ui-stack-sm">
        <div className="ui-kicker">Business Outcome</div>
        <div className="ui-display">Is your business actually working?</div>
      </div>
      <BusinessOutcomeViewSwitcher />
      <BusinessOutcomeTruthStatusStrip output_contract={output_contract} />
      <BusinessOutcomeTruthRevenueSplitCard revenue_split={revenue_split} />

      <div className="ui-panel">
        {has_balance_sheet_data ? (
          <>
            <p className="ui-help" style={{ marginTop: 0 }}>
              From your imported Balance Sheet, as at {balance_sheet_as_at_date || "unknown date"}.
            </p>
            <BalanceSheetRatiosCard ratios={balance_sheet_ratios} />
          </>
        ) : (
          <p className="ui-help" style={{ marginTop: 0 }}>
            Import a <Link href="/balance-sheet" className="ui-inline-link">Balance Sheet</Link> to see working
            capital and liquidity ratios alongside your revenue and profit numbers here.
          </p>
        )}
      </div>

      <div className="ui-panel">
        <BusinessOutcomeEbitSummaryCard
          real_capacity={per_source.real_capacity}
          materials={per_source.materials}
          unassigned={per_source.unassigned}
        />
      </div>
      <div className="business-outcome-view-toggle" aria-label="Smoothing" style={{ marginBottom: "0.25rem" }}>
        <button
          type="button"
          className={`business-outcome-view-toggle-btn ${smoothing_mode === "smoothed" ? "active" : ""}`}
          onClick={() => set_smoothing_mode("smoothed")}
        >
          How the Business Runs
        </button>
        <button
          type="button"
          className={`business-outcome-view-toggle-btn ${smoothing_mode === "naive" ? "active" : ""}`}
          onClick={() => set_smoothing_mode("naive")}
          disabled={view_mode_ab === "b"}
          title={view_mode_ab === "b" ? "Not available for View B - Outcome only shows real, reconciled figures against actual revenue" : undefined}
          style={view_mode_ab === "b" ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
        >
          Each Part On Its Own
        </button>
      </div>
      <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", margin: "0 0 0.75rem", lineHeight: "1.5" }}>
        <strong style={{ color: "var(--text-primary)" }}>How the Business Runs</strong> answers: is the business
        making money overall, and who&apos;s carrying who? <strong style={{ color: "var(--text-primary)" }}>Each
        Part On Its Own</strong> answers: which parts are actually profitable on their own, with no help from
        anywhere else. Same total either way - this only changes which part gets the credit or the blame.
      </p>

      <BusinessOutcomePerSourceRevenueCard
        per_source={per_source}
        output_contract={output_contract}
        labour_recovery={labour_recovery}
        smoothing_mode={smoothing_mode}
        view_mode_ab={view_mode_ab}
        set_view_mode_ab={set_view_mode_ab}
        balance_sheet_current_year_earnings={balance_sheet_current_year_earnings}
        fixed_assets_reconciliation={fixed_assets_reconciliation}
      />
      <NextStepFooter nextHref="/quote-checker" nextLabel="Next: Quote Checker" />
    </div>
  );
}

