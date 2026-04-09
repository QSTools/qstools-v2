"use client";

import useAssets from "@/hooks/useAssets";
import AssetMainCard from "@/components/assets/AssetMainCard";
import AssetHelpPanel from "@/components/assets/AssetHelpPanel";

export default function AssetsPage() {
  const { card } = useAssets();

  return (
    <main className="ui-page">
      <div className="ui-page-stack">
        <AssetMainCard {...card} />
        <AssetHelpPanel />
      </div>
    </main>
  );
}