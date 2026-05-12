import AssetForm from "@/components/assets/AssetForm";
import AssetSummaryCard from "@/components/assets/AssetSummaryCard";
import AssetListCard from "@/components/assets/AssetListCard";

export default function AssetMainCard({ form, summary, list, status }) {
  return (
    <section className="ui-section">
      <div className="assets-layout">
        <div className="assets-layout__left">
          <div className="assets-layout__left-stack">
            <AssetForm {...form} />
            <AssetListCard {...list} />
          </div>
        </div>

        <div className="assets-layout__right">
          <div className="assets-layout__right-stack">
            <AssetSummaryCard
              {...summary}
              status={status}
              on_new_asset={form.on_new_asset}
              on_save_asset={form.on_save_asset}
            />
          </div>
        </div>
      </div>
    </section>
  );
}