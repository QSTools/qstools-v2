"use client";

import useLabour from "@/hooks/useLabour";

import NextStepFooter from "@/components/navigation/NextStepFooter";
import LabourCompactWorkspaceCard from "@/components/labour/LabourCompactWorkspaceCard";
import ScenarioRemovalPanel from "@/components/scenarios/ScenarioRemovalPanel";

export default function LabourPage() {
  const labour = useLabour();

  return (
    <main className="ui-page">
      <div className="ui-page-stack">
        <header className="ui-section">
          <div className="ui-panel">
            <div className="ui-stack-sm">
              <div className="ui-kicker">Labour</div>
              <h1 className="ui-display">Labour cost builder</h1>
              <p className="ui-lead">
                Build your live labour cost position from working hours, wages,
                entitlements, employer contributions, and productivity.
              </p>
              <p className="ui-help">
                Labour owns cost truth. Rate Builder owns customer charge-out
                and margin testing.
              </p>
            </div>
          </div>
        </header>

        <LabourCompactWorkspaceCard labour={labour} />

        <ScenarioRemovalPanel scenario={labour.scenario} heading="Scenario: remove staff" />

        <NextStepFooter nextHref="/assets" nextLabel="Next: Assets" />
      </div>
    </main>
  );
}
