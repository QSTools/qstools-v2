"use client";

import useAssets from "@/hooks/useAssets";
import NextStepFooter from "@/components/navigation/NextStepFooter";
import AssetMainCard from "@/components/assets/AssetMainCard";
import AssetHelpPanel from "@/components/assets/AssetHelpPanel";
import AssetFinancePnlMatchCard from "@/components/assets/AssetFinancePnlMatchCard";
import AssetTotalPurchasePriceCard from "@/components/assets/AssetTotalPurchasePriceCard";

export default function AssetsPage() {
  const { status, card, business_default_annual_weeks, asset_finance_pnl_match, active_assets } = useAssets();

  return (
    <main className="ui-page">
      <div className="ui-page-stack">
        <section className="ui-section">
          <div className="ui-panel ui-stack-sm">
            <div className="ui-kicker">Assets</div>
            <div className="ui-display">Owned asset cost baseline</div>
            <p className="ui-lead">
              Break asset ownership costs out of the P&amp;L so finance interest
              and total annual operating asset cost are visible before moving on.
            </p>
          </div>
        </section>

        <AssetMainCard
          {...card}
          status={status}
          default_annual_weeks={business_default_annual_weeks}
        />
        <AssetFinancePnlMatchCard asset_finance_pnl_match={asset_finance_pnl_match} />
        <section className="ui-section">
          <div className="ui-panel">
            <AssetTotalPurchasePriceCard active_assets={active_assets} />
          </div>
        </section>
        <AssetHelpPanel />
        <NextStepFooter
          nextHref="/opening-hours"
          nextLabel="Next: Opening Hours"
        />
      </div>
    </main>
  );
}




