"use client";

import useEmployeeOverheads from "@/hooks/useEmployeeOverheads";

import EmployeeOverheadStatusStrip from "@/components/employee-overheads/EmployeeOverheadStatusStrip";
import EmployeeOverheadStaffCard from "@/components/employee-overheads/EmployeeOverheadStaffCard";
import EmployeeOverheadForm from "@/components/employee-overheads/EmployeeOverheadForm";
import EmployeeOverheadCustomList from "@/components/employee-overheads/EmployeeOverheadCustomList";
import EmployeeOverheadLibraryCard from "@/components/employee-overheads/EmployeeOverheadLibraryCard";
import EmployeeOverheadSummaryCard from "@/components/employee-overheads/EmployeeOverheadSummaryCard";
import EmployeeOverheadHelpPanel from "@/components/employee-overheads/EmployeeOverheadHelpPanel";

export default function EmployeeOverheadsPage() {
  const {
    selected_staff_id,
    setSelectedStaffId,
    staff_options,
    draft,
    updateDraftField,
    library_items,
    addLibraryTemplate,
    updateLibraryTemplate,
    deactivateLibraryTemplateById,
    addCustomAssignmentFromTemplate,
    updateCustomAssignmentRow,
    deactivateCustomAssignmentRow,
    saveDraftProfile,
    status,
    card,
  } = useEmployeeOverheads();

  const has_selected_staff = Boolean(selected_staff_id);
  const custom_assignment_rows = draft?.custom_assignment_rows || [];

  return (
    <main className="space-y-6">
      <EmployeeOverheadStatusStrip
        active_staff_available={status.active_staff_available}
        selected_staff_found={status.selected_staff_found}
        has_linked_overhead_profile={status.has_linked_overhead_profile}
        warnings={status.warnings}
      />

      <EmployeeOverheadStaffCard
        staff_options={staff_options}
        selected_staff_id={selected_staff_id}
        setSelectedStaffId={setSelectedStaffId}
        selected_staff={card.selected_staff}
      />

      <EmployeeOverheadForm
        draft={draft}
        updateDraftField={updateDraftField}
        disabled={!has_selected_staff}
      />

      <EmployeeOverheadCustomList
        library_items={library_items}
        custom_assignment_rows={custom_assignment_rows}
        addCustomAssignmentFromTemplate={addCustomAssignmentFromTemplate}
        updateCustomAssignmentRow={updateCustomAssignmentRow}
        deactivateCustomAssignmentRow={deactivateCustomAssignmentRow}
        disabled={!has_selected_staff}
      />

      <EmployeeOverheadLibraryCard
        library_items={library_items}
        addLibraryTemplate={addLibraryTemplate}
        updateLibraryTemplate={updateLibraryTemplate}
        deactivateLibraryTemplateById={deactivateLibraryTemplateById}
      />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={saveDraftProfile}
          disabled={!has_selected_staff}
          className="rounded-2xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm min-h-[44px] font-medium"
        >
          Save Employee Overheads Profile
        </button>
      </div>

      <EmployeeOverheadSummaryCard
        selected_staff_total_annual={card.selected_staff_total_annual}
        total_employee_overheads_annual={card.total_employee_overheads_annual}
      />

      <EmployeeOverheadHelpPanel />
    </main>
  );
}