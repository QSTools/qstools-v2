"use client";

import Link from "next/link";

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

function BenefitCard({ title, body }) {
  return (
    <div className="ui-panel">
      <div className="ui-stack-sm">
        <h3 className="text-xl font-semibold text-[var(--text-primary)]">
          {title}
        </h3>
        <p className="ui-help">{body}</p>
      </div>
    </div>
  );
}

function StepCard({ index, body }) {
  return (
    <div className="ui-panel">
      <div className="ui-stack-sm">
        <div className="ui-kicker">Step {index}</div>
        <p className="text-base font-medium text-[var(--text-primary)]">
          {body}
        </p>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="ui-page">
      <div className="ui-page-stack">
        <section className="ui-section demo-hero">
          <div className="ui-stack">
            <div className="ui-kicker">QS Tools</div>

            <div className="ui-stack-sm">
              <h1 className="ui-display text-[var(--text-primary)]">
                Do your assumptions about how your business runs match reality?
                Simple in hindsight Invisible before hand
                We mirror your businness back to you 
                Understand if your business is actually working.
              </h1>

              <p className="ui-lead">
                QS Tools helps you see how your business really operates by
                connecting your costs, your output, and the way you price your
                work.
                QS Tools strips your business back to first principles,
                then compares your quotes, costs, and monthly reality against the model you thought you were running.
                Think of it as a leak detection system
                A digital CFO
                
              </p>
            </div>

            <div className="ui-panel hero-panel">
              <div className="ui-stack-sm">
                <p>
                  Every business runs differently.
                </p>

                <p className="ui-help">
                  What matters is whether your current structure is actually
                  recovering what it costs to operate — and whether your pricing
                  reflects that reality. We do this by using your existing historical Pnl to 
                  to build a model of how your business is actually running, 
                  then comparing that model to your real work and decision. 
                  You can then enter your quotes and check them against your model. After a while
                  QS Tools will build a picture of your quoting behaviour and track where improvements and 
                  adjustments can be made
                </p>

                <p>
                  <strong>
                    We mirror your business back to you so you can clearly see
                    what’s happening underneath your numbers.
                  </strong>
                </p>
              </div>
            </div>

            <div className="ui-panel hero-callout">
              <strong>
                Build your model. See your reality. Then decide how you move
                forward.
              </strong>
            </div>
          </div>
        </section>

        <section className="ui-section">
          <div className="ui-stack">
            <div className="ui-stack-sm">
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

            <div className="demo-benefits-grid">
              {whatThisToolDoes.map((item) => (
                <BenefitCard
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
            <div className="ui-stack-sm">
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
          <div className="ui-stack">
            <div className="ui-stack-sm">
              <div className="ui-kicker">Get started</div>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
                Start simple, then build deeper when you are ready
              </h2>
              <p className="ui-help">
                You can begin with a quick check, or go straight into building
                your full business model.
              </p>
            </div>

            <div className="ui-panel">
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
      </div>
    </main>
  );
}