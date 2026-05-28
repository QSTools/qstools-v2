"use client";

import useLabour from "@/hooks/useLabour";

import LabourProfileCard from "@/components/labour/LabourProfileCard";
import SavedProfilesCard from "@/components/labour/SavedProfilesCard";
import PayCard from "@/components/labour/PayCard";
import CommercialCard from "@/components/labour/CommercialCard";
import EntitlementsCard from "@/components/labour/EntitlementsCard";
import EmployerContributionsCard from "@/components/labour/EmployerContributionsCard";

import LabourStatusStrip from "@/components/labour/LabourStatusStrip";
import LabourSummaryCard from "@/components/labour/LabourSummaryCard";
import ProductiveStaffTypeRatesPanel from "@/components/labour/ProductiveStaffTypeRatesPanel";
import TopDriverCard from "@/components/labour/TopDriverCard";
import LabourFlowCard from "@/components/labour/LabourFlowCard";
import ScenarioModelCard from "@/components/labour/ScenarioModelCard";
import LabourHelpPanel from "@/components/labour/LabourHelpPanel";

import CollapsibleSection from "@/components/common/CollapsibleSection";

export default function LabourPage() {
  const labour = useLabour();

  return (
    <main className="ui-page">
      <div className="ui-page-stack">
        <header className="ui-section">
          <div className="ui-panel">
            <div className="ui-stack-sm">
              <div className="ui-kicker">Labour</div>
              <h1 className="ui-display">Labour charge-out builder</h1>
              <p className="ui-lead">
                Build your live labour cost position from working hours, wages,
                entitlements, employer contributions, and commercial settings.
              </p>
              <p className="ui-help">
                Use the Scenario Modeller separately to test changes without
                altering your live Labour inputs.
              </p>
            </div>
          </div>
        </header>

        <section className="labour-layout">
          <div className="labour-layout__left">
            <div className="labour-layout__left-stack">
              <CollapsibleSection
                title="Labour Profile"
                summary="Create and manage staff identity"
                defaultOpen={false}
              >
                <LabourProfileCard
                  state={labour.state}
                  staff_types={labour.staff_types}
                  has_profile={labour.has_profile}
                  update_field={labour.update_field}
                  create_profile={labour.create_profile}
                  create_staff_type={labour.create_staff_type}
                />
              </CollapsibleSection>

              <CollapsibleSection
                title="Pay"
                summary="Hours, wage and charge-out"
                defaultOpen={false}
              >
                <PayCard
                  state={labour.state}
                  outputs={labour.outputs}
                  has_profile={labour.has_profile}
                  update_field={labour.update_field}
                />
              </CollapsibleSection>

              <CollapsibleSection
                title="Commercial"
                summary="Productivity and margin settings"
                defaultOpen={false}
              >
                <CommercialCard
                  state={labour.state}
                  outputs={labour.outputs}
                  has_profile={labour.has_profile}
                  update_field={labour.update_field}
                />
              </CollapsibleSection>

              <CollapsibleSection
                title="Entitlements"
                summary="Leave, holidays, sick leave, bereavement"
                defaultOpen={false}
              >
                <EntitlementsCard
                  state={labour.state}
                  outputs={labour.outputs}
                  has_profile={labour.has_profile}
                  update_field={labour.update_field}
                />
              </CollapsibleSection>

              <CollapsibleSection
                title="Employer Contributions"
                summary="KiwiSaver and ESCT"
                defaultOpen={false}
              >
                <EmployerContributionsCard
                  state={labour.state}
                  outputs={labour.outputs}
                  has_profile={labour.has_profile}
                  update_field={labour.update_field}
                />
              </CollapsibleSection>
            </div>
          </div>

          <aside className="labour-layout__right">
            <div className="labour-layout__right-stack">
              <CollapsibleSection
                title="Charge-Out Build"
                summary="Cost to charge-out flow"
                defaultOpen={true}
              >
                <LabourFlowCard
                  outputs={labour.outputs}
                  state={labour.state}
                  has_profile={labour.has_profile}
                />
              </CollapsibleSection>
            </div>
          </aside>

          <div className="labour-layout__bottom">
            <div className="labour-layout__bottom-stack">
              <CollapsibleSection
                title="Labour Summary"
                summary="Current labour position"
                defaultOpen={true}
              >
                <LabourSummaryCard
                  {...labour.summary}
                  has_profile={labour.has_profile}
                  save_profile={labour.save_profile}
                  start_new_profile={labour.start_new_profile}
                />
              </CollapsibleSection>

              <CollapsibleSection
                title="Productive Staff Type Rates"
                summary="Weighted productive rates by staff type"
                defaultOpen={false}
              >
                <ProductiveStaffTypeRatesPanel
                  productive_staff_type_rates={
                    labour.output_contract.productive_staff_type_rates
                  }
                  weighted_all_productive_labour_rate={
                    labour.output_contract.weighted_all_productive_labour_rate
                  }
                  productive_staff_type_rate_warnings={
                    labour.output_contract.productive_staff_type_rate_warnings
                  }
                />
              </CollapsibleSection>

              <CollapsibleSection
                title="Top Driver"
                summary="Main live labour pressure"
                defaultOpen={false}
              >
                <TopDriverCard {...labour.drivers} />
              </CollapsibleSection>

              <CollapsibleSection
                title="Saved Profiles"
                summary="Load, save, delete"
                defaultOpen={false}
              >
                <SavedProfilesCard
                  profile_rows={labour.profile_rows}
                  active_profile_id={labour.active_profile_id}
                  load_profile={labour.load_profile}
                  save_profile={labour.save_profile}
                  start_new_profile={labour.start_new_profile}
                  delete_profile={labour.delete_profile}
                  has_profile={labour.has_profile}
                />
              </CollapsibleSection>

              <CollapsibleSection
                title="Labour Status"
                summary="Readiness, reconciliation, warnings"
                defaultOpen={false}
              >
                <LabourStatusStrip {...labour.status} />
              </CollapsibleSection>

              <CollapsibleSection
                title="Scenario Modeller"
                summary="What-if pricing and productivity testing"
                defaultOpen={false}
              >
                <ScenarioModelCard
                  labourState={labour.state}
                  has_profile={labour.has_profile}
                />
              </CollapsibleSection>

              <CollapsibleSection
                title="Help"
                summary="How Labour works"
                defaultOpen={false}
              >
                <LabourHelpPanel />
              </CollapsibleSection>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
