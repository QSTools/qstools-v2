import AssetForm from "@/components/assets/AssetForm";
import AssetSummaryCard, {
  AssetOverheadPoolAssignmentCard,
} from "@/components/assets/AssetSummaryCard";
import AssetListCard from "@/components/assets/AssetListCard";
import CollapsibleSection from "@/components/common/CollapsibleSection";
import AssetStatusStrip from "@/components/assets/AssetStatusStrip";
import AssetFinancePnlMatchCard from "@/components/assets/AssetFinancePnlMatchCard";
import AssetTotalPurchasePriceCard from "@/components/assets/AssetTotalPurchasePriceCard";

export default function AssetMainCard({
  form,
  summary,
  list,
  status,
  default_annual_weeks,
  asset_finance_pnl_match,
  active_assets,
}) {
  return (
    <section className="ui-section">
      <div className="assets-layout">
        <div className="assets-layout__left">
          <div className="assets-layout__left-stack">
            <AssetForm
              {...form}
              default_annual_weeks={default_annual_weeks}
              running_costs_slot={
                <AssetOverheadPoolAssignmentCard
                  pool_summary={summary.asset_overhead_pool_summary}
                  on_change_asset_overhead_pool_assignment={
                    summary.on_change_asset_overhead_pool_assignment
                  }
                />
              }
            />

            <AssetSummaryCard
              {...summary}
              status={status}
              on_new_asset={form.on_new_asset}
              on_save_asset={form.on_save_asset}
              view="detail"
            />

            <CollapsibleSection
              title="Summary"
              summary="Position, reconciliation and portfolio value"
              defaultOpen={false}
            >
              <div className="ui-stack-sm">
                <CollapsibleSection
                  title="Asset register"
                  summary="Saved and active asset records"
                  defaultOpen={false}
                >
                  <AssetListCard {...list} />
                </CollapsibleSection>

                <CollapsibleSection
                  title="Asset position"
                  summary="Module state and variance"
                  defaultOpen={false}
                >
                  <AssetStatusStrip {...status} />
                </CollapsibleSection>

                <CollapsibleSection
                  title="Asset finance / P&L reconciliation"
                  summary="Finance interest match"
                  defaultOpen={false}
                >
                  <AssetFinancePnlMatchCard asset_finance_pnl_match={asset_finance_pnl_match} />
                </CollapsibleSection>

                <CollapsibleSection
                  title="Total purchase price"
                  summary="Portfolio purchase value"
                  defaultOpen={false}
                >
                  <AssetTotalPurchasePriceCard active_assets={active_assets} />
                </CollapsibleSection>
              </div>
            </CollapsibleSection>
          </div>
        </div>

        <div className="assets-layout__right">
          <div className="assets-layout__right-stack">
            <AssetSummaryCard
              {...summary}
              status={status}
              on_new_asset={form.on_new_asset}
              on_save_asset={form.on_save_asset}
              view="portfolio"
            />
          </div>
        </div>

      </div>
    </section>
  );
}