"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateLabourOutputs } from "@/lib/calculations/labourCalculations";
import {
  getDefaultLabourState,
  buildLabourState,
} from "@/lib/storage/labourStorage";
import {
  getStoredLabourProfiles,
  setStoredLabourProfiles,
  createLabourProfileRecord,
  updateLabourProfileRecord,
  deleteLabourProfileRecord,
  findLabourProfileById,
  getStoredStaffTypes,
  setStoredStaffTypes,
  addStaffType,
} from "@/lib/storage/labourProfileStorage";
import {
  buildLabourStatus,
  buildLabourSummary,
  buildLabourDrivers,
  buildLabourProfileRows,
  buildLabourOutputContract,
} from "@/lib/selectors/labourSelectors";

export function useLabour() {
  const [state, setState] = useState(getDefaultLabourState);
  const [profiles, setProfiles] = useState([]);
  const [staff_types, setStaffTypes] = useState([]);
  const [active_profile_id, setActiveProfileId] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored_profiles = getStoredLabourProfiles();
    const stored_types = getStoredStaffTypes();
    setProfiles(stored_profiles);
    setStaffTypes(stored_types);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    setStoredLabourProfiles(profiles);
  }, [profiles, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    setStoredStaffTypes(staff_types);
  }, [staff_types, hydrated]);

  const outputs = useMemo(() => {
    return calculateLabourOutputs(state);
  }, [state]);

  const has_profile = Boolean(state.staff_id);
  const inputs_enabled = has_profile;

  const active_staff = useMemo(() => {
    return profiles
      .filter((profile) => profile?.is_active !== false)
      .map((profile) => {
        const data = buildLabourState(profile?.data ?? {});
        const calculated = calculateLabourOutputs(data);

        return {
          profile_id: profile?.profile_id ?? data.staff_id ?? "",
          staff_id: data.staff_id ?? "",
          staff_name: data.staff_name ?? "",
          staff_role: data.staff_role ?? "",
          staff_type_id: data.staff_type_id ?? "",
          staff_type_name: data.staff_type_name ?? "",
          staff_type: data.staff_type ?? "",
          labour_class: data.labour_class ?? "",
          contributes_to_recovery_hours:
            data.contributes_to_recovery_hours !== false,
          is_productive:
            data.is_productive === true || data.labour_class === "productive",
          is_active: true,
          annual_labour_cost: calculated.total_labour_cost_annual,
          productive_hours_annual: calculated.recovery_hours,
          total_hours_annual: calculated.paid_hours_per_year,
          non_productive_hours_annual:
            calculated.paid_hours_per_year - calculated.recovery_hours,
          ...calculated,
        };
      });
  }, [profiles]);

  function update_field(field, value) {
    setState((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function create_profile() {
    const staff_name = String(state.staff_name || "").trim();
    const staff_type_id = String(state.staff_type_id || "").trim();
    const labour_class = String(state.labour_class || "").trim();

    if (!staff_name || !staff_type_id || !labour_class) {
      return false;
    }

    const selected_type = staff_types.find(
      (t) => t.staff_type_id === staff_type_id
    );
    const staff_type_name = selected_type?.staff_type_name || "";

    const profile_record = createLabourProfileRecord({
      ...state,
      staff_name,
      staff_type_id,
      staff_type_name,
      staff_role: staff_type_name,
      labour_class,
    });

    setState(buildLabourState(profile_record.data));
    setProfiles((previous) => [profile_record, ...previous]);
    setActiveProfileId(profile_record.profile_id);

    return true;
  }

  function create_staff_type(staff_type_name) {
    const new_type = addStaffType(staff_type_name);
    if (!new_type) {
      return null;
    }

    setStaffTypes((previous) => [...previous, new_type]);
    return new_type;
  }

  function save_profile() {
    if (!state.staff_id || !active_profile_id) return false;

    setProfiles((previous) =>
      previous.map((profile) =>
        profile.profile_id === active_profile_id
          ? updateLabourProfileRecord(profile, state)
          : profile
      )
    );

    return true;
  }

  function load_profile(profile_id) {
    const profile = findLabourProfileById(profiles, profile_id);
    if (!profile) return false;

    setState(buildLabourState(profile.data));
    setActiveProfileId(profile.profile_id);

    return true;
  }

  function start_new_profile() {
    setState(getDefaultLabourState());
    setActiveProfileId("");
  }

  function delete_profile(profile_id) {
    const profile = findLabourProfileById(profiles, profile_id);
    if (!profile) return false;

    setProfiles((previous) => deleteLabourProfileRecord(previous, profile_id));

    if (active_profile_id === profile_id) {
      setState(getDefaultLabourState());
      setActiveProfileId("");
    }

    return true;
  }

  const profile_rows = useMemo(() => {
    return buildLabourProfileRows({
      profiles,
      active_profile_id,
    });
  }, [profiles, active_profile_id]);

  const status = useMemo(() => {
    return buildLabourStatus({
      state,
      outputs,
      profiles,
      active_profile_id,
      inputs_enabled,
      pnl_benchmark_total: 0,
    });
  }, [state, outputs, profiles, active_profile_id, inputs_enabled]);

  const summary = useMemo(() => {
    return buildLabourSummary({
      state,
      outputs,
    });
  }, [state, outputs]);

  const drivers = useMemo(() => {
    return buildLabourDrivers({
      state,
      outputs,
      has_profile,
    });
  }, [state, outputs, has_profile]);

  const output_contract = useMemo(() => {
    return buildLabourOutputContract({
      active_staff,
      outputs,
      state,
    });
  }, [active_staff, outputs, state]);

  return {
    state,
    profiles,
    staff_types,
    active_profile_id,
    outputs,
    active_staff,
    has_profile,
    inputs_enabled,

    update_field,
    create_profile,
    create_staff_type,
    save_profile,
    load_profile,
    start_new_profile,
    delete_profile,

    status,
    summary,
    drivers,
    profile_rows,
    output_contract,
  };
}

export default useLabour;
