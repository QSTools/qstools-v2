// Composes the v5.0/v5.1 Business Outcome output_contract for downstream
// consumers, by combining the Stage 2 truth-chain contract
// (useBusinessOutcomeTruth) with the labour recovery block
// (useBusinessOutcomeLabourRecovery).
//
// This is additive/read-only: it does not recalculate anything from either
// source hook, it only composes their existing outputs into one shape.

export function compose_business_outcome_output_contract(
  truth_output_contract = {},
  labour_recovery = {}
) {
  const {
    strongest_contribution_area: labour_strongest,
    weakest_contribution_area: labour_weakest,
    labour_recovery_rows = [],
    weighted_summary = {},
    data_status: labour_data_status,
  } = labour_recovery;

  return {
    ...truth_output_contract,

    // Labour recovery is currently the only real source for these two
    // fields - the truth-chain hook explicitly defers them (S16 section 7/8).
    strongest_contribution_area:
      labour_strongest ?? truth_output_contract.strongest_contribution_area,
    weakest_contribution_area:
      labour_weakest ?? truth_output_contract.weakest_contribution_area,

    labour_recovery: {
      status: labour_data_status ?? "no_labour_sources",
      rows: labour_recovery_rows,
      weighted_summary,
    },
  };
}
