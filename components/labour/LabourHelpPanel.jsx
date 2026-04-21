"use client";

import { useState } from "react";

export default function LabourHelpPanel() {
  const [is_open, setIsOpen] = useState(false);

  function toggle_panel() {
    setIsOpen((previous) => !previous);
  }

  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div className="ui-split">
            <div className="ui-stack-sm">
              <div className="ui-kicker">Help</div>
              <h2 className="ui-card-title">How Labour works</h2>
              <p className="ui-help">
                Labour is the staff cost engine of QS Tools. It calculates the
                real cost of employing staff and the minimum charge-out pressure
                created by that labour position.
              </p>
            </div>

            <div className="ui-actions">
              <button
                type="button"
                className="ui-button-secondary"
                onClick={toggle_panel}
              >
                {is_open ? "Hide help" : "Show help"}
              </button>
            </div>
          </div>

          {is_open ? (
            <div className="ui-stack">
              <div className="ui-panel">
                <div className="ui-stack-sm">
                  <div className="ui-kicker">What this module includes</div>
                  <div className="ui-stack-sm">
                    <div>• Staff identity and profile setup</div>
                    <div>• Working pattern and paid hours</div>
                    <div>• Wage cost and productive-hour logic</div>
                    <div>• NZ-style entitlement assumptions</div>
                    <div>• Employer KiwiSaver and ESCT</div>
                    <div>• Labour-only charge-out and margin pressure</div>
                  </div>
                </div>
              </div>

              <div className="ui-panel">
                <div className="ui-stack-sm">
                  <div className="ui-kicker">What this module does not include</div>
                  <div className="ui-stack-sm">
                    <div>• Employee overheads</div>
                    <div>• Assets or plant cost</div>
                    <div>• General business overheads</div>
                    <div>• Recovery strategy</div>
                    <div>• Cost allocation or structure validation</div>
                  </div>
                </div>
              </div>

              <div className="ui-panel">
                <div className="ui-stack-sm">
                  <div className="ui-kicker">Productive hours</div>
                  <p className="ui-help">
                    Paid hours are not the same as productive hours. Leave,
                    holidays, sick days, and other non-productive paid time
                    reduce the hours available for real recovery. Productivity
                    then reduces those remaining hours again to reflect real
                    delivery time.
                  </p>
                </div>
              </div>

              <div className="ui-panel">
                <div className="ui-stack-sm">
                  <div className="ui-kicker">Employer contributions</div>
                  <p className="ui-help">
                    Employer KiwiSaver and ESCT are shown separately because
                    they are real employer-funded labour costs. They should stay
                    visible and must not be silently absorbed or merged away.
                  </p>
                </div>
              </div>

              <div className="ui-panel">
                <div className="ui-stack-sm">
                  <div className="ui-kicker">Reconciliation strip</div>
                  <p className="ui-help">
                    The reconciliation strip is diagnostic only. It compares the
                    Labour module total to the P&amp;L labour benchmark so you
                    can judge readiness. It does not change Labour calculations
                    and it does not flow variance downstream.
                  </p>
                </div>
              </div>

              <div className="ui-panel">
                <div className="ui-stack-sm">
                  <div className="ui-kicker">Scenario layer</div>
                  <p className="ui-help">
                    Scenario is separate from live Labour. It is a temporary
                    testing layer for commercial comparison only. It must not
                    overwrite Labour state and it must not feed Cost Summary or
                    later modules in this version.
                  </p>
                </div>
              </div>

              <div className="ui-panel">
                <div className="ui-stack-sm">
                  <div className="ui-kicker">Plain-English meaning</div>
                  <p className="ui-help">
                    This page helps you understand what one staff position
                    actually costs, how many productive hours are really
                    available, and what charge-out pressure that creates before
                    wider business overhead is introduced later in the system.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}