import GeneralOverheadProfilesCard from "@/components/general-overheads/GeneralOverheadProfilesCard";
import GeneralOverheadForm from "@/components/general-overheads/GeneralOverheadForm";
import GeneralOverheadSummaryCard from "@/components/general-overheads/GeneralOverheadSummaryCard";

export default function GeneralOverheadMainCard({
  profile,
  profiles,
  form,
  summary,
}) {
  return (
    <section className="ui-section">
      <div className="ui-page-stack">
        <GeneralOverheadProfilesCard {...profile} {...profiles} />
        <GeneralOverheadForm {...form} />
        <GeneralOverheadSummaryCard {...summary} />
      </div>
    </section>
  );
}