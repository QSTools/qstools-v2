"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateLabourOutputs } from "@/lib/calculations/labourCalculations";
import { deleteEmployeeOverheadProfilesByStaffId } from "@/lib/storage/employeeOverheadProfileStorage";
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
  const [active_profile_id, setActiveProfileId] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored_profiles = getStoredLabourProfiles();
    setProfiles(stored_profiles);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    setStoredLabourProfiles(profiles);
  }, [profiles, hydrated]);

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
          labour_class: data.labour_class ?? "",
          is_active: true,
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
    const staff_role = String(state.staff_role || "").trim();
    const labour_class = String(state.labour_class || "").trim();

    if (!staff_name || !staff_role || !labour_class) {
      return false;
    }

    const profile_record = createLabourProfileRecord({
      ...state,
      staff_name,
      staff_role,
      labour_class,
    });

    setState(buildLabourState(profile_record.data));
    setProfiles((previous) => [profile_record, ...previous]);
    setActiveProfileId(profile_record.profile_id);

    return true;
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

    const staff_id = profile.staff_id || profile?.data?.staff_id || "";

    setProfiles((previous) => deleteLabourProfileRecord(previous, profile_id));

    if (staff_id) {
      deleteEmployeeOverheadProfilesByStaffId(staff_id);
    }

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
    active_profile_id,
    outputs,
    active_staff,
    has_profile,
    inputs_enabled,

    update_field,
    create_profile,
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
