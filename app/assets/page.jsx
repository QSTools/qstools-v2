"use client";

import useAssets from "@/hooks/useAssets";
import AssetStatusStrip from "@/components/assets/AssetStatusStrip";
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
              Break your asset cost out of your P&amp;L and make it real.
            </p>
          </div>
        </section>

        <AssetStatusStrip {...status} />
        <AssetMainCard {...card} />
        <AssetHelpPanel />
      </div>
    </main>
  );
}