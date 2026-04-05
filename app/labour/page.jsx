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
import LabourFlowCard from "@/components/labour/LabourFlowCard";
import ScenarioModelCard from "@/components/labour/ScenarioModelCard";
import LabourStatusStrip from "@/components/labour/LabourStatusStrip";
import LabourHelpPanel from "@/components/labour/LabourHelpPanel";
import TopDriverCard from "@/components/labour/TopDriverCard";
import CollapsibleSection from "@/components/common/CollapsibleSection";

export default function LabourPage() {
  const labour = useLabour();

  return (
    <main className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] px-4 py-6 md:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Labour Charge-Out Builder
          </h1>

          <p className="text-sm text-[var(--text-muted)]">
            Enter your actual business numbers here to build your real labour
            charge-out rate.
          </p>

          <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-secondary)]">
            These are your core labour inputs. Use the Scenario Modeller
            separately to test changes without altering your live business
            inputs.
          </div>
        </header>

        <div className="space-y-4">
          <LabourStatusStrip
            has_profile={labour.has_profile}
            inputs_enabled={labour.inputs_enabled}
            missing_fields={labour.missing_fields}
            margin_health={labour.margin_health}
            staff_name={labour.state.staff_name}
          />

          <TopDriverCard
            state={labour.state}
            outputs={labour.outputs}
            has_profile={labour.has_profile}
          />
        </div>

        <div className="border-t border-[var(--border-primary)]" />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
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

          <div className="space-y-6">
            <LabourFlowCard
              outputs={labour.outputs}
              state={labour.state}
              has_profile={labour.has_profile}
            />

            <LabourHelpPanel />
          </div>
        </div>

        <div className="border-t border-[var(--border-primary)] pt-6">
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
        </div>
      </div>
    </main>
  );
}