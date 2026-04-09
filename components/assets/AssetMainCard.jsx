import AssetForm from "@/components/assets/AssetForm";
import AssetSummaryCard from "@/components/assets/AssetSummaryCard";
import AssetListCard from "@/components/assets/AssetListCard";

export default function AssetMainCard({ form, summary, list }) {
  return (
    <section className="ui-section">
      <div className="ui-page-stack">
        <AssetSummaryCard {...summary} />
        <AssetForm {...form} />
        <AssetListCard {...list} />
      </div>
    </section>
  );
}