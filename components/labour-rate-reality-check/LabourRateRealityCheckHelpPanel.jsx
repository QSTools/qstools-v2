"use client";

import { useState } from "react";

export default function LabourRateRealityCheckHelpPanel() {
  const [is_open, set_is_open] = useState(false);

  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div className="ui-split">
            <div>
              <div className="ui-kicker">Help</div>
              <h2 className="ui-section-title">How this works</h2>
            </div>

            <button
              type="button"
              className="ui-button-secondary"
              onClick={() => set_is_open((current) => !current)}
            >
              {is_open ? "Hide" : "Show"}
            </button>
          </div>

          {is_open ? (
            <div className="ui-stack">
              <p>
                This quick check compares the rate you think you are earning
                against a simplified employee-equivalent rate.
              </p>
              <p>
                It uses standard NZ paid time assumptions for annual leave,
                public holidays, sick leave, and bereavement leave.
              </p>
              <p>
                It does not include ACC, vehicle costs, tools, insurance,
                business overheads, or gaps between jobs.
              </p>
              <p>
                Use the Labour module for the full charge-out and business cost view.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}