"use client";

import Link from "next/link";

const coreInputs = [
  {
    href: "/labour",
    title: "Labour",
    body: "Build live labour cost, productive hours, and minimum charge-out rate.",
  },
  {
    href: "/employee-overheads",
    title: "Employee Overheads",
    body: "Capture annual staff-linked non-wage overheads and link them to active staff.",
  },
  {
    href: "/assets",
    title: "Assets",
    body: "Manage business-owned asset cost burden for recovery modelling.",
  },
  {
    href: "/general-overheads",
    title: "General Overheads",
    body: "Track broader business cost burden outside direct staff and assets.",
  },
  {
    href: "/cost-allocation",
    title: "Cost Allocation",
    body: "Control recovery structure and determine how upstream cost is allocated.",
  },
];

const commercialEngine = [
  {
    href: "/cost-summary",
    title: "Cost Summary",
    body: "View the combined recovery baseline across labour, staff overheads, assets, and business overheads.",
  },
  {
    href: "/budget",
    title: "Budget",
    body: "Review planned commercial outputs and downstream business targets.",
  },
];

const systemPages = [
  {
    href: "/settings",
    title: "Settings",
    body: "Manage UI theme and system preferences.",
  },
];

function NavCard({ href, title, body }) {
  return (
    <Link
      href={href}
      className="ui-panel block rounded-2xl no-underline transition-colors hover:bg-[var(--bg-card-muted)]"
    >
      <div className="ui-stack">
        <div>
          <div className="text-lg font-semibold text-[var(--text-primary)]">
            {title}
          </div>
          <p className="ui-help mt-2">{body}</p>
        </div>

        <div className="ui-kicker">Open module</div>
      </div>
    </Link>
  );
}

function SectionBlock({ title, body, items }) {
  return (
    <section className="ui-section">
      <div className="ui-stack">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            {title}
          </h2>
          <p className="ui-help">{body}</p>
        </div>

        <div className="ui-stack">
          {items.map((item) => (
            <NavCard
              key={item.href}
              href={item.href}
              title={item.title}
              body={item.body}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <main className="ui-page">
      <div className="ui-page-stack">
        <header className="ui-section">
          <div className="ui-stack">
            <div>
              <div className="ui-kicker">QS Tools</div>
              <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
                Business Recovery Model
              </h1>
            </div>

            <p className="ui-help">
              Use the modules below to build upstream cost inputs, define recovery
              structure, and review the combined commercial baseline.
            </p>

            <div className="ui-panel">
              Start with the core input modules, then move into Cost Allocation and
              Cost Summary once the upstream layers are populated.
            </div>
          </div>
        </header>

        <SectionBlock
          title="Core Inputs"
          body="These modules create the upstream cost base used by the commercial engine."
          items={coreInputs}
        />

        <SectionBlock
          title="Commercial Engine"
          body="These modules turn upstream cost into a recovery and decision view."
          items={commercialEngine}
        />

        <SectionBlock
          title="System"
          body="Supporting configuration and platform controls."
          items={systemPages}
        />
      </div>
    </main>
  );
}