"use client";

import { useEffect, useMemo, useState } from "react";

import {
  buildBusinessSetupState,
  clearBusinessSetupState,
  getDefaultBusinessSetupState,
  loadBusinessSetupState,
  saveBusinessSetupState,
} from "@/lib/storage/businessSetupStorage";
import {
  buildBusinessSetupCard,
  buildBusinessSetupStatus,
} from "@/lib/selectors/businessSetupSelectors";

export default function useBusinessSetup() {
  const [business_setup_state, setBusinessSetupState] = useState(() =>
    getDefaultBusinessSetupState()
  );

  useEffect(() => {
    const stored_state = loadBusinessSetupState();
    setBusinessSetupState(stored_state);
  }, []);

  useEffect(() => {
    saveBusinessSetupState(business_setup_state);
  }, [business_setup_state]);

  const status = useMemo(() => {
    return buildBusinessSetupStatus(business_setup_state);
  }, [business_setup_state]);

  const card = useMemo(() => {
    return buildBusinessSetupCard(business_setup_state);
  }, [business_setup_state]);

  function updateBusinessSetupField(field, value) {
    setBusinessSetupState((previous) =>
      buildBusinessSetupState({
        ...previous,
        [field]: value,
        updated_at: new Date().toISOString(),
      })
    );
  }

  function saveBusinessSetup() {
  const setup_completed =
    Boolean(business_setup_state.business_name?.trim()) &&
    Boolean(business_setup_state.business_type);

  const next_state = buildBusinessSetupState({
    ...business_setup_state,
    setup_completed,
    updated_at: new Date().toISOString(),
  });

  setBusinessSetupState(next_state);
  saveBusinessSetupState(next_state);

  return setup_completed;
}

  function resetBusinessSetup() {
    clearBusinessSetupState();
    setBusinessSetupState(getDefaultBusinessSetupState());
  }

  return {
    business_name: business_setup_state.business_name,
    business_type: business_setup_state.business_type,
    is_labour_based: business_setup_state.business_type === "labour_based",
    is_product_based: business_setup_state.business_type === "product_based",
    setup_completed: business_setup_state.setup_completed,
    created_at: business_setup_state.created_at,
    updated_at: business_setup_state.updated_at,

    status,
    card,
    output_contract: {
      business_name: business_setup_state.business_name,
      business_type: business_setup_state.business_type,
      is_labour_based: business_setup_state.business_type === "labour_based",
      is_product_based: business_setup_state.business_type === "product_based",
      setup_completed: business_setup_state.setup_completed,
    },

    updateBusinessSetupField,
    saveBusinessSetup,
    resetBusinessSetup,
  };
}