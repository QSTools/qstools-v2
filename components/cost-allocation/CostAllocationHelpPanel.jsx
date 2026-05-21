"use client";

function HelpStep({ number, title, children }) {
  return (
    <div className="ui-readonly">
      <div className="ui-stack-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-xs font-semibold text-[var(--text-primary)]">
            {number}
          </div>

          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {title}
            </p>
            <p className="mt-1 ui-help">{children}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExampleBlock({ title, children }) {
  return (
    <div className="ui-readonly">
      <div className="ui-stack-sm">
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {title}
        </p>
        <p className="ui-help">{children}</p>
      </div>
    </div>
  );
}

export default function CostAllocationHelpPanel() {
  return (
    <section className="ui-panel">
      <div className="ui-stack">
        <div>
          <p className="ui-kicker">How Cost Allocation works</p>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Build working units, then review what each one must recover
          </h3>
          <p className="ui-help">
            Cost Allocation does not set prices. It shows the minimum recovery
            benchmark each working unit must achieve before pricing decisions are
            made.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <HelpStep number="1" title="Confirm the recovery plan">
            The recovery plan comes from Recovery Summary. You do not choose the
            strategy here. This page tests what the working units must carry.
          </HelpStep>

          <HelpStep number="2" title="Create a working unit">
            A working unit is a real crew, setup, or operating unit that
            produces revenue. Examples include a pump crew, gib fixing crew,
            coffee truck unit, retail floor setup, or production station.
          </HelpStep>

          <HelpStep number="3" title="Select productive labour and assets">
            Add only the labour and assets that actually do the productive work.
            Do not add owner, admin, office, or support costs unless they are
            directly doing the work.
          </HelpStep>

          <HelpStep number="4" title="Review running cost">
            Running cost is the direct cost to operate the working unit. It is
            made up of productive labour plus productive assets used by that
            unit.
          </HelpStep>

          <HelpStep number="5" title="Review overhead burden">
            Overhead burden is the cost outside the working unit that it still
            has to carry. This can include owner/admin, non-productive labour,
            support assets, general overheads, and remaining business cost.
          </HelpStep>

          <HelpStep number="6" title="Use the minimum recoverable rate">
            Running cost plus overhead burden gives the minimum recoverable
            rate. The next revenue/pricing layer compares this benchmark against
            charge-out rates, product margin, sales volume, or revenue units.
          </HelpStep>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <ExampleBlock title="Asset-driven service">
            Pump crew = operator + pump + ute if required. The unit shows what
            each hour of pumping must recover.
          </ExampleBlock>

          <ExampleBlock title="Labour-only trade">
            Gib fixing crew = productive staff. The unit shows what the crew
            must recover per hour before converting to m², lm, item, or job
            pricing later.
          </ExampleBlock>

          <ExampleBlock title="Product or retail business">
            Store or production unit = the staff/assets that enable sales. Cost
            Allocation shows cost per hour; the revenue layer converts that into
            required sales or product margin.
          </ExampleBlock>
        </div>

        <div className="ui-readonly">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Simple rule
          </p>
          <p className="mt-1 ui-help">
            The working unit is what does the work. The overhead burden is what
            the working unit has to carry. The minimum recoverable rate is the
            benchmark before pricing.
          </p>
        </div>

        <div className="ui-readonly">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Important guardrail
          </p>
          <p className="mt-1 ui-help">
            Cost Allocation does not rebuild Labour, Assets, General Overheads,
            Cost Summary, or Recovery Summary. It takes the cost truth already
            built upstream and shows what each working unit has to recover.
          </p>
        </div>
      </div>
    </section>
  );
}