"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateLabourOutputs } from "@/lib/calculations/labourCalculations";

const STORAGE_KEY = "qs_tools_labour_profiles_v1";

function generate_staff_id() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `staff_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function get_default_state() {
  return {
    staff_id: "",
    staff_name: "",
    staff_role: "",
    labour_class: "",

    hours_per_week: 40,

    labour_rate: 0,
    charge_out_rate: 0,

    productivity_percent: 85,
    margin_target_percent: 20,

    annual_leave_weeks: 4,
    public_holiday_days: 12,
    sick_days: 10,
    bereavement_days: 1,
    family_violence_days: 0,

    employee_kiwisaver_enabled: true,
  };
}

function get_storage_profiles() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function set_storage_profiles(profiles) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

export function useLabour() {
  const [state, setState] = useState(get_default_state);
  const [profiles, setProfiles] = useState([]);
  const [active_profile_id, setActiveProfileId] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = get_storage_profiles();
    setProfiles(stored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    set_storage_profiles(profiles);
  }, [profiles, hydrated]);

  const outputs = useMemo(() => {
    return calculateLabourOutputs(state);
  }, [state]);

  const active_staff = useMemo(() => {
    return profiles.map((profile) => {
      const data = {
        ...get_default_state(),
        ...(profile?.data ?? {}),
      };

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

  const has_profile = Boolean(state.staff_id);
  const inputs_enabled = has_profile;

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

    const staff_id = generate_staff_id();

    const next_state = {
      ...state,
      staff_id,
      staff_name,
      staff_role,
      labour_class,
    };

    const now = new Date().toISOString();

    const new_profile = {
      profile_id: staff_id,
      staff_id,
      created_at: now,
      updated_at: now,
      data: next_state,
    };

    setState(next_state);
    setProfiles((previous) => [new_profile, ...previous]);
    setActiveProfileId(new_profile.profile_id);

    return true;
  }

  function save_profile() {
    if (!state.staff_id || !active_profile_id) return false;

    const now = new Date().toISOString();

    setProfiles((previous) =>
      previous.map((profile) =>
        profile.profile_id === active_profile_id
          ? {
              ...profile,
              updated_at: now,
              data: {
                ...state,
              },
            }
          : profile
      )
    );

    return true;
  }

  function load_profile(profile_id) {
    const profile = profiles.find((item) => item.profile_id === profile_id);
    if (!profile) return false;

    setState({
      ...get_default_state(),
      ...profile.data,
    });

    setActiveProfileId(profile.profile_id);
    return true;
  }

  function start_new_profile() {
    setState(get_default_state());
    setActiveProfileId("");
  }

  function delete_profile(profile_id) {
    const profile = profiles.find((item) => item.profile_id === profile_id);
    if (!profile) return false;

    setProfiles((previous) =>
      previous.filter((item) => item.profile_id !== profile_id)
    );

    if (active_profile_id === profile_id) {
      setState(get_default_state());
      setActiveProfileId("");
    }

    return true;
  }

  const missing_fields = [];
  if (!state.staff_name) missing_fields.push("staff_name");
  if (!state.staff_role) missing_fields.push("staff_role");
  if (!state.labour_class) missing_fields.push("labour_class");

  let margin_health = "under";
  if (outputs.margin_gap > 0) margin_health = "healthy";
  if (outputs.margin_gap === 0) margin_health = "at-risk";

  return {
    state,
    profiles,
    active_profile_id,
    outputs,
    active_staff,
    has_profile,
    inputs_enabled,
    missing_fields,
    margin_health,
    update_field,
    create_profile,
    save_profile,
    load_profile,
    start_new_profile,
    delete_profile,
  };
}

export default useLabour;