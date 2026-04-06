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
        <AssetStatusStrip {...status} />
        <AssetMainCard {...card} />
        <AssetHelpPanel />
      </div>
    </main>
  );
}