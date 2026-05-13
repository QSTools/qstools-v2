import AssetForm from "@/components/assets/AssetForm";
import AssetSummaryCard from "@/components/assets/AssetSummaryCard";
import AssetListCard from "@/components/assets/AssetListCard";
import CollapsibleSection from "@/components/common/CollapsibleSection";

export default function AssetMainCard({ form, summary, list, status }) {
  return (
    <section className="ui-section">
      <div className="assets-layout">
        <div className="assets-layout__left">
          <div className="assets-layout__left-stack">
            <AssetForm {...form} />
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

        <div className="assets-layout__bottom">
          <div className="assets-layout__bottom-stack">
            <AssetSummaryCard
              {...summary}
              status={status}
              on_new_asset={form.on_new_asset}
              on_save_asset={form.on_save_asset}
              view="detail"
            />

            <CollapsibleSection
              title="Asset register"
              summary="Saved assets and active asset records"
              defaultOpen={false}
            >
              <AssetListCard {...list} />
            </CollapsibleSection>
          </div>
        </div>
      </div>
    </section>
  );
}