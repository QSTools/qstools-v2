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
import LabourInsightsRow from "@/components/labour/LabourInsightsRow";

export default function LabourPage() {
  const labour = useLabour();

  return (
    <main className="min-h-screen bg-neutral-950 text-white px-4 py-6 md:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Labour Charge-Out Builder
          </h1>

          <p className="text-sm text-neutral-400">
            Enter your actual business numbers here to build your real labour
            charge-out rate.
          </p>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-neutral-300">
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

          <LabourInsightsRow
            state={labour.state}
            outputs={labour.outputs}
            has_profile={labour.has_profile}
          />
        </div>

        <div className="border-t border-neutral-800" />

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

            <EntitlementsCard
              state={labour.state}
              outputs={labour.outputs}
              has_profile={labour.has_profile}
              update_field={labour.update_field}
            />

            <EmployerContributionsCard
              state={labour.state}
              outputs={labour.outputs}
              has_profile={labour.has_profile}
              update_field={labour.update_field}
            />
          </div>

          <div className="space-y-6">
            <LabourFlowCard
              outputs={labour.outputs}
              state={labour.state}
              has_profile={labour.has_profile}
            />

            <ScenarioModelCard
              state={labour.state}
              has_profile={labour.has_profile}
            />

            <LabourHelpPanel />
          </div>
        </div>
      </div>
    </main>
  );
}