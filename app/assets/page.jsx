"use client";

import useAssets from "@/hooks/useAssets";
import AssetMainCard from "@/components/assets/AssetMainCard";
import AssetHelpPanel from "@/components/assets/AssetHelpPanel";

export default function AssetsPage() {
  const { status, card } = useAssets();

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

        <AssetMainCard {...card} status={status} />
        <AssetHelpPanel />
      </div>
    </main>
  );
}
