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
import { get_mode } from "@/lib/storage/modelStorage";
import {
  get_scenario_removals,
  set_scenario_removal,
  subscribe_to_scenarios,
} from "@/lib/storage/modelScenarios";
import { apply_staff_removals } from "@/lib/calculations/scenarioRemovals";

// R3 slice 4 batch B: constants so the first render (server and client) is identical and baseline mode allocates nothing new.
const NO_SCENARIO_REMOVALS = Object.freeze({
  staff_ids: Object.freeze([]),
  asset_ids: Object.freeze([]),
  flags: Object.freeze({}),
  has_scenario: false,
  removal_count: 0,
});
const NO_SCENARIO_ROWS = Object.freeze([]);

export function useLabour({ pnl_recovery_inputs = {} } = {}) {
  const [state, setState] = useState(getDefaultLabourState);
  const [profiles, setProfiles] = useState([]);
  const [staff_types, setStaffTypes] = useState([]);
  const [active_profile_id, setActiveProfileId] = useState("");
  const [hydrated, setHydrated] = useState(false);

  // R3 slice 4 batch B: scenario removals (staff markers in mirra_scenarios_v1). Empty, and no storage read, in baseline mode. Read after mount so the
  // first render matches the server. Every mounted copy of this hook listens, so none goes stale when a marker changes.
  const [scenario_removals, set_scenario_removals] = useState(NO_SCENARIO_REMOVALS);
  const [model_active, set_model_active] = useState(false);

  useEffect(() => {
    const stored_profiles = getStoredLabourProfiles();
    const stored_types = getStoredStaffTypes();
    setProfiles(stored_profiles);
    setStaffTypes(stored_types);
    setHydrated(true);
    const loaded_removals = get_scenario_removals();
    set_scenario_removals((current) =>
      loaded_removals.removal_count === 0 && current.removal_count === 0 ? current : loaded_removals
    );
    set_model_active(get_mode() === "model");
  }, []);

  useEffect(() => {
    return subscribe_to_scenarios(() => set_scenario_removals(get_scenario_removals()));
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

  const base_active_staff = useMemo(() => {
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

  // R3 slice 4 batch B: the scenario view of the staff list. With no staff marker this IS base_active_staff (same array, nothing extra calculated),
  // which is always the case in baseline mode. The saved profiles and the form are never changed.
  const active_staff = useMemo(
    () => apply_staff_removals(base_active_staff, scenario_removals.staff_ids),
    [base_active_staff, scenario_removals.staff_ids]
  );

  const resolved_pnl_recovery_inputs = useMemo(() => {
    return {
      revenue: pnl_recovery_inputs?.revenue ?? 0,
      cog: pnl_recovery_inputs?.cog ?? 0,
      net_profit: pnl_recovery_inputs?.net_profit ?? 0,
      non_labour_overheads: pnl_recovery_inputs?.non_labour_overheads ?? 0,
    };
  }, [
    pnl_recovery_inputs?.revenue,
    pnl_recovery_inputs?.cog,
    pnl_recovery_inputs?.net_profit,
    pnl_recovery_inputs?.non_labour_overheads,
  ]);

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

    // Same validation create_profile() already requires - prevents an
    // edit from silently overwriting a previously-valid profile with
    // a blank staff type, name, or labour class. Without this guard,
    // a profile edited while the staff type dropdown was empty would
    // permanently wipe out previously-correct data (this is what
    // happened to the "Paul" / Owner profile).
    const staff_name = String(state.staff_name || "").trim();
    const staff_type_id = String(state.staff_type_id || "").trim();
    const labour_class = String(state.labour_class || "").trim();

    if (!staff_name || !staff_type_id || !labour_class) {
      return false;
    }

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
      pnl_recovery_inputs: resolved_pnl_recovery_inputs,
    });
  }, [active_staff, outputs, state, resolved_pnl_recovery_inputs]);

  // R3 slice 4 batch B: the reconciliation trust gate judges REAL data, so it gets the contract built from ALL staff. Only built when a staff marker is
  // applied (Model mode); otherwise the very same object as output_contract comes back.
  const unmodelled_output_contract = useMemo(() => {
    if (active_staff === base_active_staff) return output_contract;
    return buildLabourOutputContract({
      active_staff: base_active_staff,
      outputs,
      state,
      pnl_recovery_inputs: resolved_pnl_recovery_inputs,
    });
  }, [active_staff, base_active_staff, output_contract, outputs, state, resolved_pnl_recovery_inputs]);

  function set_staff_removed(staff_id, removed) {
    const result = set_scenario_removal("staff", staff_id, removed);
    if (result.ok) set_scenario_removals(result.removals);
    return result;
  }

  const scenario = useMemo(() => {
    return {
      kind: "staff",
      active: model_active,
      rows: model_active
        ? base_active_staff.map((staff) => ({
            id: staff.staff_id,
            name: staff.staff_name,
            detail: [staff.staff_type_name || staff.staff_role, staff.labour_class].filter(Boolean).join(" - "),
          }))
        : NO_SCENARIO_ROWS,
      removed_ids: scenario_removals.staff_ids,
      flags: scenario_removals.flags,
      set_removed: set_staff_removed,
    };
  }, [model_active, base_active_staff, scenario_removals]);

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
    unmodelled_output_contract,
    scenario,
  };
}

export default useLabour;

