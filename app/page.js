"use client";

import Link from "next/link";

const coreInputs = [
  {
    href: "/p-and-l",
    title: "P&L",
    body: "Start with your annual business picture from the last financial year.",
  },
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
    body: "Manage business-owned asset cost burden and productive asset capacity.",
  },
  {
    href: "/general-overheads",
    title: "General Overheads",
    body: "Track broader business cost burden outside direct staff and assets.",
  },
  {
    href: "/materials",
    title: "Materials",
    body: "Capture annual material revenue, cost, and margin contribution.",
  },
];

const commercialEngine = [
  {
    href: "/cost-summary",
    title: "Cost Summary",
    body: "View the combined business cost baseline across labour, overheads, assets, and business costs.",
  },
  {
    href: "/recovery-summary",
    title: "Recovery Summary",
    body: "See how the business is intended to recover cost from its productive base.",
  },
  {
    href: "/rates/square-metre",
    title: "Square Metre Rate",
    body: "Model annual recovery from m²-based pricing.",
  },
  {
    href: "/rates/volume",
    title: "Volume Rate",
    body: "Model annual recovery from tonne-, m³-, or load-based pricing.",
  },
  {
    href: "/cost-allocation",
    title: "Cost Allocation",
    body: "Define recovery units and check whether the structure can deliver the model.",
  },
  {
    href: "/recovery-outcome",
    title: "Recovery Outcome",
    body: "Test whether the full business model works and why it may be failing.",
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
                QS Tools helps you analyse your business so you can set the
                right prices and build a profitable model.
              </h1>
            </div>

            <p className="ui-help">
              It’s a reality check — breaking down how your business actually
              makes money, showing you what’s working, what isn’t, and where
              your profit is really coming from. It then guides you on how and
              where to adjust so you can hit your targets consistently, not just
              when things are busy.
            </p>

            <div className="ui-panel">
              <div className="ui-stack-sm">
                <p>
                  With QS Tools, you’ll gain a clear understanding of exactly
                  where your business stands — what it costs, what it earns, and
                  what needs to shift. You’ll move from guessing to knowing
                  exactly what to charge to meet your profit goals.
                </p>

                <p>
                  Most businesses price their work based on labour and materials
                  alone, but that doesn’t show the full picture. QS Tools helps
                  you understand how your costs, labour, and material margins
                  all work together — so you can see whether your model truly
                  works over the year, not just on a good job.
                </p>

                <p>
                  All you need to do is bring in your key numbers — QS Tools
                  will break it down step by step, giving you a clear picture of
                  your business and what you need to charge to make it work.
                </p>

                <p>
                  To get started, you’ll just need your P&amp;L from the last
                  financial year — or your current labour rates if that’s where
                  you’re starting from.
                </p>
              </div>
            </div>

            <div className="ui-panel">
              <strong>
                Know where your profit actually comes from — and whether your
                business works when things slow down.
              </strong>
            </div>
          </div>
        </header>

        <SectionBlock
          title="Core Inputs"
          body="Start with the annual business picture, then build the upstream cost and margin layers."
          items={coreInputs}
        />

        <SectionBlock
          title="Commercial Engine"
          body="These modules turn cost, recovery, revenue streams, and structure into a business decision."
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