import AssetForm from "@/components/assets/AssetForm";
import AssetSummaryCard from "@/components/assets/AssetSummaryCard";
import AssetListCard from "@/components/assets/AssetListCard";

export default function AssetMainCard({ form, summary, list }) {
  return (
    <section className="ui-section">
      <div className="ui-stack">
        <AssetForm {...form} />
        <AssetSummaryCard {...summary} />
        <AssetListCard {...list} />
      </div>
    </section>
  );
}