"use client";

import { useState } from "react";

function HelpSection({ title, children }) {
  return (
    <div className="ui-help-section">
      <h3 className="ui-help-section-title">{title}</h3>
      <div className="ui-help-section-body">{children}</div>
    </div>
  );
}

export default function RevenueCogsHelpPanel() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div className="ui-split">
            <div className="ui-stack-sm">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                ▾ Revenue / COGS help
              </h2>
              <p className="ui-help">
                This page explains how revenue turns into trading margin before
                the model tests whether that margin can recover the business
                cost burden.
              </p>
            </div>

            <div className="ui-actions">
              <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="ui-button-secondary"
              >
                {isOpen ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {isOpen ? (
            <div className="ui-stack">
              <HelpSection title="What this page does">
                <p>
                  Revenue / COGS is the commercial selling layer. It takes
                  Revenue and Direct Costs from the P&amp;L page and calculates
                  the margin pool available before operating costs are tested.
                </p>
                <p>
                  If the business is unit-based, this page also defines the
                  main commercial unit or units the business sells, such as
                  each, m², m³, lineal metres, tonnes, hours, or a custom unit.
                </p>
              </HelpSection>

              <HelpSection title="What this page uses">
                <p>
                  This page uses Revenue and Direct Costs / COGS from the
                  P&amp;L classification page. Revenue less Direct Costs becomes
                  the margin pool.
                </p>
                <p>
                  For unit-based businesses, the page also uses a simple unit
                  driver setup so Recovery Summary can test margin per unit
                  against the business cost burden.
                </p>
              </HelpSection>

              <HelpSection title="How to use it">
                <p>
                  If the business is hours-based, review the Revenue, Direct
                  Costs, and Margin Pool only. Materials and direct costs remain
                  a margin layer; they do not reduce the hourly recovery
                  requirement.
                </p>
                <p>
                  If the business is unit-based, choose single unit or mixed
                  unit mode. Use single unit mode when one commercial unit
                  explains the business. Use mixed unit mode when revenue is
                  split across a small number of major output types.
                </p>
              </HelpSection>

              <HelpSection title="Single unit mode">
                <p>
                  Use this when the business has one main commercial driver.
                  Examples include concrete pumping by m³, slab work by m², or
                  a retail business using each.
                </p>
                <p>
                  In single unit mode, the revenue split is fixed at 100%.
                  Enter the unit label, choose the unit type, and then enter
                  either estimated annual units or an average sale rate,
                  depending on the unit type.
                </p>
              </HelpSection>

              <HelpSection title="Mixed unit mode">
                <p>
                  Use this when revenue is split across more than one major
                  commercial unit. For example, 80% concrete pumping by m³ and
                  20% concrete laying by m².
                </p>
                <p>
                  Add one unit driver for each major revenue stream. Keep this
                  broad. Do not create a line for every product, task, job item,
                  or quote line.
                </p>
              </HelpSection>

              <HelpSection title="Each versus measurable units">
                <p>
                  The Each unit type is treated as a product basket. Use it for
                  businesses such as cafés, retail, or product sales where many
                  small items are sold. Enter estimated annual units sold,
                  normally from POS or sales data.
                </p>
                <p>
                  Measurable units such as m², m³, lineal metres, tonnes,
                  hours, or custom units use an average sale rate. The system
                  uses Revenue divided by average sale rate to estimate annual
                  unit volume.
                </p>
              </HelpSection>

              <HelpSection title="Margin per unit">
                <p>
                  Margin per unit is calculated from the P&amp;L margin pool.
                  It is not based on a user-entered direct cost per unit.
                </p>
                <p>
                  This protects the model from having two competing cost
                  sources. True direct cost per unit should come later from Cost
                  Allocation, Business Outcome, or live job data.
                </p>
              </HelpSection>

              <HelpSection title="What this page does not do">
                <p>
                  This page does not build quotes, pricing tables, task
                  breakdowns, product catalogues, or detailed cost allocation.
                  That detail belongs in later modules.
                </p>
                <p>
                  This page does not change Cost Summary or Business Summary
                  cost calculations. It only defines the commercial recovery
                  driver that downstream pages can use.
                </p>
              </HelpSection>

              <HelpSection title="What happens next">
                <p>
                  Recovery Summary uses the selected commercial driver to test
                  whether the margin pool, margin per unit, or unit volume can
                  support the business cost burden.
                </p>
                <p>
                  Cost Allocation later tests whether the working units,
                  labour, assets, and live job structure can actually support
                  the selected model.
                </p>
              </HelpSection>

              <div className="ui-help-guardrail">
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  Guardrail: Revenue / COGS defines how the business sells. It
                  must not rebuild Cost Summary, Cost Allocation, product line
                  pricing, or detailed job costing.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}