import { buildModuleReconciliationChecks } from "@/lib/reconciliation/reconciliationRules";

export function calculateModuleReconciliation({
  pnl = {},
  labour = {},
  assets = {},
  generalOverheads = {},
}) {
  const pnl_status = pnl.status ?? {};
  const pnl_output_contract = pnl.output_contract ?? {};
  const labour_status = labour.status ?? {};
  const labour_output_contract = labour.output_contract ?? {};
  const labour_outputs = labour.outputs ?? {};
  const asset_status = assets.status ?? {};
  const asset_output_contract = assets.output_contract ?? {};
  const general_overheads_status = generalOverheads.status ?? {};
  const general_overheads_output_contract = generalOverheads.output_contract ?? {};

  const reconciliation = buildModuleReconciliationChecks({
    pnl_status,
    pnl_output_contract,
    labour_status,
    labour_outputs,
    asset_status,
    asset_output_contract,
    general_overheads_status,
    general_overheads_output_contract,
  });

  return {
    ...reconciliation,
    module_total_business_costs: reconciliation.module_total_business_costs,
    pnl_business_cost_variance: reconciliation.pnl_business_cost_variance,
    pnl_business_cost_variance_percent:
      reconciliation.pnl_business_cost_variance_percent,
    total_acc_levy_annual: reconciliation.total_acc_levy_annual,
    acc_rate_percent: reconciliation.acc_rate_percent,
    general_overheads_ready: reconciliation.general_overheads_ready,
  };
}
