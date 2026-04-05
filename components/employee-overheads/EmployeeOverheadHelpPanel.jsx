"use client";

import { useState } from "react";

export default function EmployeeOverheadHelpPanel() {
  const [is_open, setIsOpen] = useState(false);

  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Help</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Module scope and boundary definitions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
        >
          {is_open ? "Collapse" : "Expand"}
        </button>
      </div>

      {is_open && (
        <div className="mt-4 space-y-3 text-sm text-neutral-300">
          <p>
            Employee Overheads captures annual non-wage staff burden linked to
            Labour staff identities by staff_id.
          </p>
          <p>
            It includes items like training, PPE, transport allowance, phone
            allowance, and selected company custom overhead items.
          </p>
          <p>
            It excludes wages, KiwiSaver, ESCT, business-owned vehicles, asset
            cost, general overheads, recovery logic, and scenario logic.
          </p>
          <p>
            Cost Summary consumes only the output contract:
            staff_id, employee_overheads_total_annual, and
            total_employee_overheads_annual.
          </p>
        </div>
      )}
    </section>
  );
}