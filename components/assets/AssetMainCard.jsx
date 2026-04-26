import AssetForm from "@/components/assets/AssetForm";
import AssetSummaryCard from "@/components/assets/AssetSummaryCard";
import AssetListCard from "@/components/assets/AssetListCard";

export default function AssetMainCard({ form, summary, list, status }) {
  return (
    <section className="ui-section">
      <div className="ui-stack">
        <AssetForm {...form} />

        <AssetSummaryCard
          {...summary}
          status={status}
          on_new_asset={form.on_new_asset}
          on_save_asset={form.on_save_asset}
        />

        <AssetListCard {...list} />
      </div>
    </section>
  );
}