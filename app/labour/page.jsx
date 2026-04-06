"use client";

import { useLabour } from "@/hooks/useLabour";

import LabourProfileCard from "@/components/labour/LabourProfileCard";
import SavedProfilesCard from "@/components/labour/SavedProfilesCard";
import ProfileLockNotice from "@/components/labour/ProfileLockNotice";
import WorkingPatternCard from "@/components/labour/WorkingPatternCard";
import PayCard from "@/components/labour/PayCard";
import CommercialCard from "@/components/labour/CommercialCard";
import EntitlementsCard from "@/components/labour/EntitlementsCard";
import EmployerContributionsCard from "@/components/labour/EmployerContributionsCard";

import LabourSummaryCard from "@/components/labour/LabourSummaryCard";
import LabourFlowCard from "@/components/labour/LabourFlowCard";
import ScenarioModelCard from "@/components/labour/ScenarioModelCard";
import LabourStatusStrip from "@/components/labour/LabourStatusStrip";
import LabourHelpPanel from "@/components/labour/LabourHelpPanel";
import TopDriverCard from "@/components/labour/TopDriverCard";

import CollapsibleSection from "@/components/common/CollapsibleSection";

export default function LabourPage() {
  const labour = useLabour();

  return (
    <main className="ui-page">
      <div className="ui-page-stack">
        <header className="ui-section">
          <div className="ui-stack">
            <h1 className="text-2xl font-semibold">
              Labour Charge-Out Builder
            </h1>

            <p className="ui-help">
              Enter your actual business numbers here to build your real labour charge-out rate.
            </p>

            <div className="ui-panel">
              These are your core labour inputs. Use the Scenario Modeller separately to test changes without altering your live business inputs.
            </div>
          </div>
        </header>

        <section className="labour-layout">
          <div className="labour-layout__left">
            <div className="labour-layout__left-stack">
              <LabourProfileCard
                state={labour.state}
                has_profile={labour.has_profile}
                update_field={labour.update_field}
                create_profile={labour.create_profile}
              />

              <SavedProfilesCard
                profiles={labour.profiles}
                active_profile_id={labour.active_profile_id}
                load_profile={labour.load_profile}
                save_profile={labour.save_profile}
                start_new_profile={labour.start_new_profile}
                delete_profile={labour.delete_profile}
                has_profile={labour.has_profile}
              />

              <ProfileLockNotice has_profile={labour.has_profile} />

              <WorkingPatternCard
                state={labour.state}
                outputs={labour.outputs}
                has_profile={labour.has_profile}
                update_field={labour.update_field}
              />

              <PayCard
                state={labour.state}
                has_profile={labour.has_profile}
                update_field={labour.update_field}
              />

              <CommercialCard
                state={labour.state}
                has_profile={labour.has_profile}
                update_field={labour.update_field}
              />

              <CollapsibleSection
                title="Entitlements"
                summary="Leave, holidays, sick leave, bereavement"
                defaultOpen={true}
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
                defaultOpen={true}
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
              <LabourStatusStrip
                has_profile={labour.has_profile}
                inputs_enabled={labour.inputs_enabled}
                missing_fields={labour.missing_fields}
                margin_health={labour.margin_health}
                staff_name={labour.state.staff_name}
              />

              <LabourSummaryCard
                state={labour.state}
                outputs={labour.outputs}
                has_profile={labour.has_profile}
              />

              <TopDriverCard
                outputs={labour.outputs}
                state={labour.state}
                has_profile={labour.has_profile}
              />

              <LabourFlowCard
                outputs={labour.outputs}
                state={labour.state}
                has_profile={labour.has_profile}
              />
            </div>
          </aside>

          <div className="labour-layout__bottom">
            <div className="labour-layout__bottom-stack">
              <CollapsibleSection
                title="Scenario Modeller"
                summary="What-if pricing and productivity testing"
                defaultOpen={false}
              >
                <ScenarioModelCard
                  labourState={labour.state}
                  outputs={labour.outputs}
                  has_profile={labour.has_profile}
                />
              </CollapsibleSection>

              <LabourHelpPanel />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}