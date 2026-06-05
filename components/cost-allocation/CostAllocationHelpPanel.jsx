"use client";

function GuidanceStep({ number, title, text }) {
  return (
    <div className="cost-allocation-guidance-step">
      <div className="cost-allocation-guidance-step-number">{number}</div>

      <div>
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {title}
        </p>
        <p className="ui-help">{text}</p>
      </div>
    </div>
  );
}

export default function CostAllocationHelpPanel() {
  return (
    <section className="ui-panel cost-allocation-guidance-panel">
      <div className="ui-stack">
        <div>
          <p className="ui-kicker">Cost allocation guidance</p>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Build working units before pricing
          </h3>
          <p className="ui-help">
            Cost Allocation is an input page. It assigns labour and asset pools
            into divisions and operating groups. It does not set prices.
          </p>
        </div>

        <div className="cost-allocation-guidance-flow">
          <GuidanceStep
            number="1"
            title="Create division"
            text="Create the major operating area first."
          />

          <GuidanceStep
            number="2"
            title="Create operating group"
            text="Create the crew, team, or working unit inside the division."
          />

          <GuidanceStep
            number="3"
            title="Assign labour"
            text="Assign the staff or labour group used by that working unit."
          />

          <GuidanceStep
            number="4"
            title="Assign assets"
            text="Assign the productive assets used by that working unit."
          />

          <GuidanceStep
            number="5"
            title="Review pool position"
            text="Check what is assigned and what is still left to assign."
          />
        </div>

        <div className="ui-readonly cost-allocation-guidance-next">
          <span className="ui-label">Next step</span>
          <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
            Use Recovery Summary and Rate Builder after the operating structure
            is built.
          </p>
          <p className="mt-1 ui-help">
            Recovery testing, rate building, pricing, and business outcome
            decisions happen downstream.
          </p>
        </div>
      </div>
    </section>
  );
}