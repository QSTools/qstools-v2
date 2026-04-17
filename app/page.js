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
    body: "Model annual recovery from m2-based pricing.",
  },
  {
    href: "/rates/volume",
    title: "Volume Rate",
    body: "Model annual recovery from tonne-, m3-, or load-based pricing.",
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

const whatThisToolDoes = [
  {
    title: "Understand your real cost base",
    body: "Build your business using your actual numbers so you can see what it truly costs to operate.",
  },
  {
    title: "See how your business recovers those costs",
    body: "Understand how your business turns work into revenue and how each part contributes to your overall performance.",
  },
  {
    title: "Check your work against your own model",
    body: "Compare real jobs or quotes against your business baseline to see whether they are working.",
  },
];

const howItWorks = [
  "Enter your business costs and structure",
  "We mirror your business back to you so you can see how it is performing",
  "Define how your business needs to earn and operate",
  "Use that model to check your real work and decisions",
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

function InfoCard({ title, body }) {
  return (
    <div className="ui-panel rounded-2xl">
      <div className="ui-stack-sm">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          {title}
        </h3>
        <p className="ui-help">{body}</p>
      </div>
    </div>
  );
}

function StepCard({ index, body }) {
  return (
    <div className="ui-panel rounded-2xl">
      <div className="ui-stack-sm">
        <div className="ui-kicker">Step {index}</div>
        <p className="text-base font-medium text-[var(--text-primary)]">
          {body}
        </p>
      </div>
    </div>
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
        <section className="ui-section">
          <div className="ui-stack">
            <div className="ui-stack-sm">
              <div className="ui-kicker">QS Tools</div>
              <h1 className="text-3xl font-semibold text-[var(--text-primary)]">
                Understand if your business is actually working.
              </h1>
              <p className="ui-lead">
                QS Tools helps you see how your business really operates by
                connecting your costs, your output, and the way you price your
                work.
              </p>
            </div>

            <div className="ui-panel rounded-2xl">
              <div className="ui-stack-sm">
                <p className="text-base text-[var(--text-primary)]">
                  Every business runs differently.
                </p>
                <p className="ui-help">
                  What matters is whether your current structure is actually
                  recovering what it costs to operate — and whether your pricing
                  reflects that reality.
                </p>
                <p className="text-base font-medium text-[var(--text-primary)]">
                  We mirror your business back to you so you can clearly see
                  what’s happening underneath your numbers.
                </p>
              </div>
            </div>

            <div className="ui-panel rounded-2xl">
              <strong className="text-base text-[var(--text-primary)]">
                Build your model. See your reality. Then decide how you move
                forward.
              </strong>
            </div>
          </div>
        </section>

        <section className="ui-section">
          <div className="ui-stack">
            <div>
              <div className="ui-kicker">What QS Tools does</div>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
                A clear view of how your business performs
              </h2>
              <p className="ui-help">
                This is not just a pricing tool. It is a system that connects
                your costs, your structure, and your output so you can see
                whether your business is actually working.
              </p>
            </div>

            <div className="ui-stack">
              {whatThisToolDoes.map((item) => (
                <InfoCard
                  key={item.title}
                  title={item.title}
                  body={item.body}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="ui-section">
          <div className="ui-stack">
            <div>
              <div className="ui-kicker">How it works</div>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
                Build your business model, then use it
              </h2>
            </div>

            <div className="ui-stack">
              {howItWorks.map((step, index) => (
                <StepCard key={step} index={index + 1} body={step} />
              ))}
            </div>
          </div>
        </section>

        <section className="ui-section">
          <div className="ui-panel rounded-2xl">
            <div className="ui-stack">
              <div>
                <div className="ui-kicker">Get started</div>
                <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
                  Start simple, then build deeper when you are ready
                </h2>
                <p className="ui-help">
                  You can begin with a quick check, or go straight into building
                  your full business model.
                </p>
              </div>

              <div className="ui-actions">
                <Link href="/quick-start" className="ui-button-primary">
                  Open Quick Start
                </Link>
                <Link href="/p-and-l" className="ui-button-secondary">
                  Model Your Business
                </Link>
              </div>
            </div>
          </div>
        </section>

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