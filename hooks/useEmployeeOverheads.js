"use client";

import { useEffect, useMemo, useState } from "react";
import { useLabour } from "@/hooks/useLabour";
import {
  calculateEmployeeOverheadProfile,
} from "@/lib/calculations/employeeOverheadCalculations";
import {
  buildEmployeeOverheadCard,
  buildEmployeeOverheadOutputContract,
  buildEmployeeOverheadStatus,
} from "@/lib/selectors/employeeOverheadSelectors";
import {
  createBlankEmployeeOverheadProfile,
  createEmployeeOverheadTemplate,
  createStaffCustomAssignmentRow,
  getActiveEmployeeOverheadProfileByStaffId,
  loadEmployeeOverheadLibrary,
  loadEmployeeOverheadProfiles,
  upsertActiveEmployeeOverheadProfile,
  upsertEmployeeOverheadTemplate,
  deactivateEmployeeOverheadTemplate,
} from "@/lib/storage/employeeOverheadStorage";

function get_next_profile_version(existing_profile) {
  if (!existing_profile) return 1;
  return Number(existing_profile.profile_version || 1) + 1;
}

function get_active_labour_profiles(labour) {
  if (!labour) return [];

  if (Array.isArray(labour.active_staff) && labour.active_staff.length > 0) {
    return labour.active_staff;
  }

  if (Array.isArray(labour.active_profiles) && labour.active_profiles.length > 0) {
    return labour.active_profiles.filter((profile) => profile && profile.is_active);
  }

  if (Array.isArray(labour.profiles) && labour.profiles.length > 0) {
    const explicitly_active = labour.profiles.filter(
      (profile) => profile && profile.is_active
    );

    if (explicitly_active.length > 0) {
      return explicitly_active;
    }

    return labour.profiles;
  }

  if (Array.isArray(labour.saved_profiles) && labour.saved_profiles.length > 0) {
    const explicitly_active = labour.saved_profiles.filter(
      (profile) => profile && profile.is_active
    );

    if (explicitly_active.length > 0) {
      return explicitly_active;
    }

    return labour.saved_profiles;
  }

  if (Array.isArray(labour.profile_list) && labour.profile_list.length > 0) {
    const explicitly_active = labour.profile_list.filter(
      (profile) => profile && profile.is_active
    );

    if (explicitly_active.length > 0) {
      return explicitly_active;
    }

    return labour.profile_list;
  }

  if (labour.active_profile && labour.active_profile.staff_id) {
    return [labour.active_profile];
  }

  return [];
}

export default function useEmployeeOverheads() {
  const labour = useLabour();

  const labour_profiles = useMemo(() => {
    return get_active_labour_profiles(labour);
  }, [labour]);

  const [selected_staff_id, setSelectedStaffId] = useState("");
  const [stored_profiles, setStoredProfiles] = useState([]);
  const [library_items, setLibraryItems] = useState([]);
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    setStoredProfiles(loadEmployeeOverheadProfiles());
    setLibraryItems(loadEmployeeOverheadLibrary());
  }, []);

  const staff_options = useMemo(() => {
    return labour_profiles.map((profile) => ({
      staff_id: profile.staff_id,
      staff_name: profile.staff_name || "Unnamed Staff",
      staff_role: profile.staff_role || "",
      is_active: Boolean(profile.is_active ?? true),
    }));
  }, [labour_profiles]);

  useEffect(() => {
    if (!selected_staff_id && staff_options.length > 0) {
      setSelectedStaffId(staff_options[0].staff_id);
      return;
    }

    const selected_still_exists = staff_options.some(
      (staff) => staff.staff_id === selected_staff_id
    );

    if (!selected_still_exists && staff_options.length > 0) {
      setSelectedStaffId(staff_options[0].staff_id);
    }
  }, [selected_staff_id, staff_options]);

  useEffect(() => {
    if (!selected_staff_id) {
      setDraft(null);
      return;
    }

    setDraft((current) => {
      if (current && current.staff_id === selected_staff_id) {
        return current;
      }

      const active_profile = getActiveEmployeeOverheadProfileByStaffId(
        selected_staff_id
      );

      if (active_profile) {
        return active_profile;
      }

      return createBlankEmployeeOverheadProfile({
        staff_id: selected_staff_id,
        profile_version: 1,
      });
    });
  }, [selected_staff_id, stored_profiles]);

  function updateDraftField(field, value) {
    setDraft((current) => {
      if (!current) return current;

      return {
        ...current,
        [field]: value,
      };
    });
  }

  function addLibraryTemplate({ custom_overhead_name, default_amount_annual }) {
    const template = createEmployeeOverheadTemplate({
      custom_overhead_name,
      default_amount_annual,
    });

    const next = upsertEmployeeOverheadTemplate(template);
    setLibraryItems(next);
  }

  function updateLibraryTemplate(template) {
    const next = upsertEmployeeOverheadTemplate(template);
    setLibraryItems(next);
  }

  function deactivateLibraryTemplateById(template_id) {
    const next = deactivateEmployeeOverheadTemplate(template_id);
    setLibraryItems(next);
  }

  function addCustomAssignmentFromTemplate(template_id) {
    const template =
      library_items.find(
        (item) =>
          item.custom_overhead_template_id === template_id && item.is_active
      ) || null;

    if (!template || !draft?.staff_id) return;

    const row = createStaffCustomAssignmentRow({
      staff_id: draft.staff_id,
      template,
    });

    setDraft((current) => {
      if (!current) return current;

      return {
        ...current,
        custom_assignment_rows: [...(current.custom_assignment_rows || []), row],
      };
    });
  }

  function updateCustomAssignmentRow(staff_overhead_item_id, patch) {
    setDraft((current) => {
      if (!current) return current;

      return {
        ...current,
        custom_assignment_rows: (current.custom_assignment_rows || []).map(
          (row) => {
            if (row.staff_overhead_item_id !== staff_overhead_item_id) {
              return row;
            }

            return {
              ...row,
              ...patch,
              updated_at: new Date().toISOString(),
            };
          }
        ),
      };
    });
  }

  function deactivateCustomAssignmentRow(staff_overhead_item_id) {
    updateCustomAssignmentRow(staff_overhead_item_id, { is_active: false });
  }

  function saveDraftProfile() {
    if (!draft || !draft.staff_id) return;

    const existing_active = getActiveEmployeeOverheadProfileByStaffId(
      draft.staff_id
    );

    const calculated = calculateEmployeeOverheadProfile(draft);

    const next_profile = {
      ...draft,
      ...calculated,
      profile_version: get_next_profile_version(existing_active),
      effective_from: new Date().toISOString(),
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    const next_profiles = upsertActiveEmployeeOverheadProfile(next_profile);
    setStoredProfiles(next_profiles);

    setDraft(next_profile);
  }

  const card = useMemo(() => {
    return buildEmployeeOverheadCard({
      labour_profiles,
      employee_overhead_profiles: stored_profiles,
      selected_staff_id,
    });
  }, [labour_profiles, stored_profiles, selected_staff_id]);

  const status = useMemo(() => {
    return buildEmployeeOverheadStatus({
      labour_profiles,
      selected_staff_id,
      active_profile: card.active_profile,
    });
  }, [labour_profiles, selected_staff_id, card.active_profile]);

  const output_contract = useMemo(() => {
    return buildEmployeeOverheadOutputContract(stored_profiles, labour_profiles);
  }, [stored_profiles, labour_profiles]);

  return {
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
    output_contract,
    stored_profiles,
  };
}