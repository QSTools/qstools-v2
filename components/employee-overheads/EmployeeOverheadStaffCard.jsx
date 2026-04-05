"use client";

export default function EmployeeOverheadStaffCard({
  staff_options = [],
  selected_staff_id = "",
  setSelectedStaffId,
  selected_staff = null,
}) {
  return (
    <section className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5">
      <h2 className="text-lg font-semibold">Staff Selection</h2>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        Select an active Labour staff member. Employee Overheads does not create
        staff identities.
      </p>

      <div className="mt-4">
        <label className="mb-2 block text-sm text-[var(--text-secondary)]">Staff Member</label>
        <select
          value={selected_staff_id}
          onChange={(e) => setSelectedStaffId(e.target.value)}
          className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-input)] px-3 py-2 text-sm"
        >
          <option value="">Select staff</option>
          {staff_options.map((staff) => (
            <option key={staff.staff_id} value={staff.staff_id}>
              {staff.staff_name}
              {staff.staff_role ? ` — ${staff.staff_role}` : ""}
            </option>
          ))}
        </select>
      </div>

      {selected_staff && (
        <div className="mt-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-input)] p-4">
          <div className="text-sm text-[var(--text-muted)]">Selected Staff</div>
          <div className="mt-1 text-base font-semibold">
            {selected_staff.staff_name}
          </div>
          <div className="text-sm text-[var(--text-muted)]">
            {selected_staff.staff_role || "No role set"}
          </div>
        </div>
      )}
    </section>
  );
}