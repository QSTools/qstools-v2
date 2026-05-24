"""
QS Tools — Variable Register
v1.1

Purpose:
Central register of important QS Tools variables used by the audit tools.

This register is used by:
- qs_variable_trace.py
- qs_calc_test_runner.py
- qs_reconciliation_audit.py

The register does not calculate business logic.
It only defines ownership, expected source files, downstream consumers,
and whether each variable requires testing or P&L reconciliation.

Current architecture rule:
- Labour cost comes from Labour module.
- Asset cost comes from Assets module.
- Employee overheads are now included through General Overheads.
- There is no standalone Employee Overheads input into Cost Summary.
- P&L is reconciliation source truth only, not a Cost Summary calculation input.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from pathlib import Path
import json


PROJECT_ROOT = Path(__file__).resolve().parents[2]
REPORTS_DIR = PROJECT_ROOT / "reports" / "audit"


@dataclass(frozen=True)
class VariableRecord:
    variable_name: str
    owning_module: str
    owning_file: str
    variable_type: str
    calculation_source: str
    downstream_consumers: list[str]
    must_balance_to_pnl: bool
    test_required: bool
    notes: str


VARIABLE_REGISTER: list[VariableRecord] = [
    # ============================================================
    # LABOUR — INPUTS / IDENTITY
    # ============================================================
    VariableRecord(
        "staff_id",
        "Labour",
        "lib/identity/staffIdentity.js",
        "identity",
        "System generated identity",
        ["General Overheads", "Cost Summary", "Cost Allocation"],
        False,
        True,
        "Labour owns staff_id. Display names must never be used as join keys.",
    ),
    VariableRecord(
        "staff_name",
        "Labour",
        "Labour storage / profile state",
        "display_input",
        "User entered display label",
        ["UI only"],
        False,
        False,
        "Display only. Must never be used as a join key.",
    ),
    VariableRecord(
        "staff_role",
        "Labour",
        "Labour storage / profile state",
        "display_input",
        "User entered display label",
        ["UI only"],
        False,
        False,
        "Display only.",
    ),
    VariableRecord(
        "labour_class",
        "Labour",
        "Labour storage / profile state",
        "display_input",
        "User entered classification",
        ["UI only", "Cost Allocation display"],
        False,
        False,
        "Display/category only unless later brief defines otherwise.",
    ),
    VariableRecord(
        "hours_per_week",
        "Labour",
        "Labour input state",
        "input",
        "User entered working pattern",
        ["Labour calculations"],
        False,
        True,
        "Used to calculate paid_hours_per_year and daily_hours.",
    ),
    VariableRecord(
        "days_per_week",
        "Labour",
        "Labour input state",
        "input",
        "User entered working pattern",
        ["Labour calculations"],
        False,
        True,
        "Used to calculate daily_hours.",
    ),
    VariableRecord(
        "labour_rate",
        "Labour",
        "Labour input state",
        "input",
        "User entered hourly wage/rate",
        ["Labour calculations"],
        False,
        True,
        "Cost Summary must not use this to rebuild Labour outputs.",
    ),
    VariableRecord(
        "charge_out_rate",
        "Labour",
        "Labour input state",
        "input",
        "User entered commercial charge-out rate",
        ["Labour calculations", "Labour Scenario"],
        False,
        True,
        "Used for margin/profit comparison only.",
    ),
    VariableRecord(
        "productivity_percent",
        "Labour",
        "Labour input state",
        "input",
        "User entered productivity assumption",
        ["Labour calculations", "Labour Scenario"],
        False,
        True,
        "Used to convert available hours to productive hours.",
    ),
    VariableRecord(
        "margin_target_percent",
        "Labour",
        "Labour input state",
        "input",
        "User entered margin target",
        ["Labour calculations", "Labour Scenario"],
        False,
        True,
        "Used to calculate minimum_charge_out_rate.",
    ),

    # ============================================================
    # LABOUR — CALCULATED OUTPUTS
    # ============================================================
    VariableRecord(
        "paid_hours_per_year",
        "Labour",
        "lib/calculations/labourCalculations.js",
        "calculated_output",
        "hours_per_week * 52",
        ["Labour UI", "Labour downstream outputs"],
        False,
        True,
        "Core Labour time output.",
    ),
    VariableRecord(
        "daily_hours",
        "Labour",
        "lib/calculations/labourCalculations.js",
        "calculated_output",
        "hours_per_week / days_per_week",
        ["Labour calculations"],
        False,
        True,
        "Used to convert entitlement days to hours.",
    ),
    VariableRecord(
        "non_productive_paid_hours",
        "Labour",
        "lib/calculations/labourCalculations.js",
        "calculated_output",
        "leave + public holidays + sick + bereavement + family violence leave",
        ["Labour UI", "Labour downstream outputs"],
        False,
        True,
        "Critical entitlement burden output.",
    ),
    VariableRecord(
        "productive_hours",
        "Labour",
        "lib/calculations/labourCalculations.js",
        "calculated_output",
        "(paid_hours_per_year - non_productive_paid_hours) * productivity_percent",
        ["Cost Summary", "Recovery Summary through Cost Summary"],
        False,
        True,
        "Cost Summary consumes this through Labour module output. Must not be rebuilt downstream.",
    ),
    VariableRecord(
        "base_labour_cost_annual",
        "Labour",
        "lib/calculations/labourCalculations.js",
        "calculated_output",
        "labour_rate * paid_hours_per_year",
        ["Labour UI"],
        False,
        True,
        "Annual gross wage base before employer contributions.",
    ),
    VariableRecord(
        "gross_wages_annual",
        "Labour",
        "lib/calculations/labourCalculations.js",
        "labour_detail_output",
        "base_labour_cost_annual",
        ["Labour UI", "Cost Summary detail display where available"],
        True,
        True,
        "Labour detail output. Cost Summary people cost is driven by total_labour_cost_annual, not by rebuilding this row-level value.",
    ),
    VariableRecord(
        "entitlements_annual",
        "Labour",
        "lib/calculations/labourCalculations.js",
        "labour_detail_output",
        "labour_rate * non_productive_paid_hours",
        ["Labour UI", "Cost Summary detail display where available"],
        True,
        True,
        "Labour detail output. Cost Summary must not rebuild Labour from entitlement parts.",
    ),
    VariableRecord(
        "employer_kiwisaver_gross",
        "Labour",
        "lib/calculations/labourCalculations.js",
        "labour_detail_output",
        "labour_rate * paid_hours_per_year * employer_kiwisaver_rate",
        ["Labour UI", "Cost Summary detail display where available"],
        True,
        True,
        "Labour detail output. Cost Summary must not rebuild Labour from KiwiSaver parts.",
    ),
    VariableRecord(
        "esct_rate",
        "Labour",
        "lib/calculations/labourCalculations.js",
        "calculated_output",
        "Derived ESCT band result",
        ["Labour UI"],
        False,
        True,
        "Must represent derived band result, not universal hardcoded assumption.",
    ),
    VariableRecord(
        "esct_amount",
        "Labour",
        "lib/calculations/labourCalculations.js",
        "labour_detail_output",
        "employer_kiwisaver_gross * derived esct_rate",
        ["Labour UI", "Cost Summary detail display where available"],
        True,
        True,
        "Labour detail output. Cost Summary must not rebuild Labour from ESCT parts.",
    ),
    VariableRecord(
        "total_employer_contribution_cost",
        "Labour",
        "lib/calculations/labourCalculations.js",
        "labour_detail_output",
        "employer_kiwisaver_gross + esct_amount",
        ["Labour UI", "Cost Summary detail display where available"],
        True,
        True,
        "Subtotal only. KiwiSaver and ESCT must remain separately visible in Labour detail.",
    ),
    VariableRecord(
        "total_labour_cost_annual",
        "Labour",
        "lib/calculations/labourCalculations.js",
        "downstream_contract_output",
        "Labour module total annual labour cost",
        ["Cost Summary"],
        True,
        True,
        "Primary Labour contract output consumed by Cost Summary as total_people_cost_annual.",
    ),
    VariableRecord(
        "loaded_labour_cost_rate",
        "Labour",
        "lib/calculations/labourCalculations.js",
        "calculated_output",
        "total_labour_cost_annual / paid_hours_per_year",
        ["Labour UI"],
        False,
        True,
        "Loaded rate over paid hours.",
    ),
    VariableRecord(
        "productive_labour_cost_rate",
        "Labour",
        "lib/calculations/labourCalculations.js",
        "calculated_output",
        "total_labour_cost_annual / productive_hours",
        ["Labour UI", "Labour Scenario"],
        False,
        True,
        "Critical commercial Labour output.",
    ),
    VariableRecord(
        "minimum_charge_out_rate",
        "Labour",
        "lib/calculations/labourCalculations.js",
        "calculated_output",
        "productive_labour_cost_rate / (1 - margin_target_percent)",
        ["Labour UI", "Labour Scenario"],
        False,
        True,
        "Critical Labour recovery threshold.",
    ),
    VariableRecord(
        "profit_per_hour",
        "Labour",
        "lib/calculations/labourCalculations.js",
        "calculated_output",
        "charge_out_rate - productive_labour_cost_rate",
        ["Labour UI", "Labour Scenario"],
        False,
        True,
        "Commercial Labour output.",
    ),
    VariableRecord(
        "above_recovery",
        "Labour",
        "lib/calculations/labourCalculations.js",
        "calculated_output",
        "charge_out_rate - minimum_charge_out_rate",
        ["Labour UI", "Labour Scenario"],
        False,
        True,
        "Commercial Labour recovery comparison.",
    ),

    # ============================================================
    # EMPLOYEE OVERHEADS — RETIRED STANDALONE MODULE
    # ============================================================
    VariableRecord(
        "employee_overheads_total_annual",
        "General Overheads",
        "lib/calculations/generalOverheadCalculations.js",
        "overhead_category",
        "Employee overheads are included inside General Overheads",
        ["Cost Summary through total_general_overheads"],
        True,
        True,
        "Retired as standalone Cost Summary input. Employee overheads now flow through General Overheads only.",
    ),
    VariableRecord(
        "total_employee_overheads_annual",
        "General Overheads",
        "lib/calculations/generalOverheadCalculations.js",
        "overhead_category_total",
        "Employee overhead category total inside General Overheads",
        ["Cost Summary through total_general_overheads"],
        True,
        True,
        "Retired as standalone Cost Summary input. Do not feed this separately into Cost Summary.",
    ),

    # ============================================================
    # ASSETS
    # ============================================================
    VariableRecord(
        "asset_id",
        "Assets",
        "Assets identity/storage",
        "identity",
        "System generated identity",
        ["Cost Allocation"],
        False,
        True,
        "Assets owns asset_id. Display names must never be used as keys.",
    ),
    VariableRecord(
        "finance_cost_annual",
        "Assets",
        "lib/calculations/assetCalculations.js",
        "calculated_output",
        "Annual finance cost calculation",
        ["Assets UI"],
        True,
        True,
        "May be part of explained variance against P&L due to finance/accounting treatment.",
    ),
    VariableRecord(
        "running_cost_annual",
        "Assets",
        "lib/calculations/assetCalculations.js",
        "calculated_output",
        "monthly running costs * 12",
        ["Assets UI"],
        True,
        True,
        "Annual cash running cost.",
    ),
    VariableRecord(
        "total_asset_cost_annual",
        "Assets",
        "lib/calculations/assetCalculations.js",
        "downstream_contract_output",
        "finance_cost_annual + running_cost_annual",
        ["Cost Summary"],
        True,
        True,
        "Cost Summary consumes this directly. Must not rebuild asset maths downstream.",
    ),

    # ============================================================
    # GENERAL OVERHEADS
    # ============================================================
    VariableRecord(
        "total_general_overheads",
        "General Overheads",
        "lib/calculations/generalOverheadCalculations.js",
        "downstream_contract_output",
        "sum(all fixed categories + custom overhead items + employee overhead categories)",
        ["Cost Summary"],
        True,
        True,
        "General Overheads output consumed by Cost Summary as total_business_overheads. Employee overheads are included in this pathway.",
    ),

    # ============================================================
    # P&L / REVENUE / COGS SOURCE TRUTH
    # ============================================================
    VariableRecord(
        "pnl_revenue",
        "P&L / Revenue / COGS",
        "P&L import / Revenue COGS state",
        "source_truth_input",
        "Entered/imported P&L revenue",
        ["Revenue Summary", "Business Summary", "Reconciliation Audit"],
        True,
        True,
        "P&L source truth. Not a Cost Summary calculation input.",
    ),
    VariableRecord(
        "pnl_cogs",
        "P&L / Revenue / COGS",
        "P&L import / Revenue COGS state",
        "source_truth_input",
        "Entered/imported P&L cost of goods sold",
        ["Revenue Summary", "Business Summary", "Reconciliation Audit"],
        True,
        True,
        "P&L source truth. Used for reconciliation and commercial reality checks, not Cost Summary input.",
    ),
    VariableRecord(
        "pnl_gross_profit",
        "P&L / Revenue / COGS",
        "P&L import / Revenue COGS state",
        "source_truth_input",
        "pnl_revenue - pnl_cogs",
        ["Revenue Summary", "Business Summary", "Reconciliation Audit"],
        True,
        True,
        "P&L source truth / derived accounting position.",
    ),
    VariableRecord(
        "pnl_operating_expenses",
        "P&L / Revenue / COGS",
        "P&L import / Revenue COGS state",
        "source_truth_input",
        "Entered/imported P&L operating expenses",
        ["Business Summary", "Reconciliation Audit"],
        True,
        True,
        "P&L operating baseline. Used for reconciliation only.",
    ),
    VariableRecord(
        "pnl_net_profit",
        "P&L / Revenue / COGS",
        "P&L import / Revenue COGS state",
        "source_truth_input",
        "Entered/imported or derived P&L net profit",
        ["Business Summary", "Reconciliation Audit"],
        True,
        True,
        "P&L source truth / derived accounting position.",
    ),
    VariableRecord(
        "pnl_labour_cost",
        "P&L / Revenue / COGS",
        "P&L import / mapping",
        "source_truth_mapping",
        "Mapped P&L labour cost",
        ["Reconciliation Audit"],
        True,
        True,
        "Used to explain variance between P&L labour and QS Tools Labour model. Not a Cost Summary input.",
    ),
    VariableRecord(
        "pnl_asset_cost",
        "P&L / Revenue / COGS",
        "P&L import / mapping",
        "source_truth_mapping",
        "Mapped P&L asset cost",
        ["Reconciliation Audit"],
        True,
        True,
        "Used to explain variance between P&L asset treatment and QS Tools Assets model. Not a Cost Summary input.",
    ),
    VariableRecord(
        "pnl_general_overheads",
        "P&L / Revenue / COGS",
        "P&L import / mapping",
        "source_truth_mapping",
        "Mapped P&L overhead cost",
        ["Reconciliation Audit"],
        True,
        True,
        "Used to reconcile General Overheads against accounting source truth.",
    ),
    VariableRecord(
        "pnl_depreciation",
        "P&L / Revenue / COGS",
        "P&L import / mapping",
        "source_truth_mapping",
        "Mapped P&L depreciation",
        ["Reconciliation Audit"],
        True,
        True,
        "Used as explained variance where QS Tools asset recovery excludes depreciation.",
    ),
    VariableRecord(
        "pnl_interest",
        "P&L / Revenue / COGS",
        "P&L import / mapping",
        "source_truth_mapping",
        "Mapped P&L interest / finance cost",
        ["Reconciliation Audit"],
        True,
        True,
        "Used as explained variance where asset finance treatment differs from P&L timing or year-end journals.",
    ),
    VariableRecord(
        "pnl_baseline_cost",
        "P&L / Revenue / COGS",
        "P&L import / reconciliation audit",
        "source_truth_input",
        "Entered/imported P&L baseline cost",
        ["Reconciliation Audit", "Business Outcome later"],
        True,
        True,
        "Source truth baseline from P&L/Xero. Reconciliation input only.",
    ),
    VariableRecord(
        "pnl_period_start",
        "P&L / Revenue / COGS",
        "P&L import / period state",
        "source_truth_input",
        "P&L reporting period start date",
        ["Reconciliation Audit"],
        True,
        True,
        "Used for timing and annualisation checks.",
    ),
    VariableRecord(
        "pnl_period_end",
        "P&L / Revenue / COGS",
        "P&L import / period state",
        "source_truth_input",
        "P&L reporting period end date",
        ["Reconciliation Audit"],
        True,
        True,
        "Used for timing and annualisation checks.",
    ),
    VariableRecord(
        "pnl_annualisation_factor",
        "P&L / Revenue / COGS",
        "P&L import / period state",
        "calculated_reconciliation_input",
        "12 months / P&L period months",
        ["Reconciliation Audit"],
        True,
        True,
        "Used where P&L period differs from annual QS Tools model.",
    ),

    # ============================================================
    # COST SUMMARY
    # ============================================================
    VariableRecord(
        "total_gross_wages_annual",
        "Cost Summary",
        "Cost Summary detail / selector where available",
        "display_detail",
        "Labour detail display only where exposed by Labour output",
        ["Cost Summary UI", "Reconciliation Audit"],
        True,
        False,
        "Detail value only. Cost Summary core calculation uses total_labour_cost_annual as total_people_cost_annual.",
    ),
    VariableRecord(
        "total_entitlements_annual",
        "Cost Summary",
        "Cost Summary detail / selector where available",
        "display_detail",
        "Labour entitlement detail display only where exposed by Labour output",
        ["Cost Summary UI", "Reconciliation Audit"],
        True,
        False,
        "Detail value only. Cost Summary must not rebuild Labour from entitlement parts.",
    ),
    VariableRecord(
        "total_employer_kiwisaver_annual",
        "Cost Summary",
        "Cost Summary detail / selector where available",
        "display_detail",
        "Labour KiwiSaver detail display only where exposed by Labour output",
        ["Cost Summary UI", "Reconciliation Audit"],
        True,
        False,
        "Detail value only. Cost Summary must not rebuild Labour from KiwiSaver parts.",
    ),
    VariableRecord(
        "total_esct_annual",
        "Cost Summary",
        "Cost Summary detail / selector where available",
        "display_detail",
        "Labour ESCT detail display only where exposed by Labour output",
        ["Cost Summary UI", "Reconciliation Audit"],
        True,
        False,
        "Detail value only. Cost Summary must not rebuild Labour from ESCT parts.",
    ),
    VariableRecord(
        "total_people_cost_annual",
        "Cost Summary",
        "lib/calculations/costSummaryCalculations.js",
        "calculated_aggregate",
        "Labour module total_labour_cost_annual only",
        ["Recovery Summary", "Reconciliation Audit"],
        True,
        True,
        "Critical Cost Summary People Cost output. Must come from Labour module only. Employee overheads are now included through General Overheads, not People Cost.",
    ),
    VariableRecord(
        "total_productive_output",
        "Cost Summary",
        "lib/calculations/costSummaryCalculations.js",
        "calculated_aggregate",
        "labour_data.total_productive_output",
        ["Recovery Summary"],
        False,
        True,
        "Used to calculate required_recovery_rate where recovery hours are not otherwise provided.",
    ),
    VariableRecord(
        "total_staff_recovery_hours",
        "Cost Summary",
        "lib/calculations/costSummaryCalculations.js",
        "calculated_aggregate",
        "labour_data.total_staff_recovery_hours or labour_data.total_productive_output",
        ["Cost Summary UI", "Recovery Summary"],
        False,
        True,
        "Staff recovery hours from Labour pathway.",
    ),
    VariableRecord(
        "business_recovery_hours",
        "Cost Summary",
        "lib/calculations/costSummaryCalculations.js",
        "calculated_aggregate",
        "labour_data.business_recovery_hours or operating_recovery_hours or total_recovery_hours",
        ["Cost Summary UI", "Recovery Summary"],
        False,
        True,
        "Business recovery hours from Labour pathway.",
    ),
    VariableRecord(
        "operating_recovery_hours",
        "Cost Summary",
        "lib/calculations/costSummaryCalculations.js",
        "calculated_aggregate",
        "same as resolved total_recovery_hours",
        ["Cost Summary UI", "Recovery Summary"],
        False,
        True,
        "Operating recovery hours from Labour pathway.",
    ),
    VariableRecord(
        "total_recovery_hours",
        "Cost Summary",
        "lib/calculations/costSummaryCalculations.js",
        "calculated_aggregate",
        "business recovery hours if available, otherwise total_productive_output",
        ["Cost Summary UI", "Recovery Summary"],
        False,
        True,
        "Primary denominator for required recovery rate.",
    ),
    VariableRecord(
        "total_business_overheads",
        "Cost Summary",
        "lib/calculations/costSummaryCalculations.js",
        "calculated_aggregate",
        "general_overhead_data.total_general_overheads",
        ["Recovery Summary", "Reconciliation Audit"],
        True,
        True,
        "General Overheads mapped into Cost Summary. This includes employee overheads where classified inside the General Overheads pathway.",
    ),
    VariableRecord(
        "total_business_cost_annual",
        "Cost Summary",
        "lib/calculations/costSummaryCalculations.js",
        "calculated_aggregate",
        "total_asset_cost_annual + total_business_overheads",
        ["Cost Summary UI", "Reconciliation Audit"],
        True,
        True,
        "Business cost excluding People Cost.",
    ),
    VariableRecord(
        "total_cost_burden",
        "Cost Summary",
        "lib/calculations/costSummaryCalculations.js",
        "downstream_contract_output",
        "total_people_cost_annual + total_asset_cost_annual + total_business_overheads",
        ["Recovery Summary", "Recovery Outcome", "Reconciliation Audit"],
        True,
        True,
        "Main Cost Summary output. Labour comes from Labour module, assets from Assets, and employee overheads through General Overheads. Must reconcile to P&L or explained variance.",
    ),
    VariableRecord(
        "required_revenue",
        "Cost Summary",
        "lib/calculations/costSummaryCalculations.js",
        "downstream_contract_output",
        "total_cost_burden",
        ["Recovery Summary", "Recovery Outcome"],
        True,
        True,
        "Baseline required revenue before recovery strategy.",
    ),
    VariableRecord(
        "required_recovery_rate",
        "Cost Summary",
        "lib/calculations/costSummaryCalculations.js",
        "downstream_contract_output",
        "required_revenue / total_recovery_hours",
        ["Recovery Summary", "Recovery Outcome"],
        False,
        True,
        "Baseline recovery rate.",
    ),

    # ============================================================
    # RECOVERY SUMMARY
    # ============================================================
    VariableRecord(
        "active_recovery_model",
        "Recovery Summary",
        "lib/calculations/recoverySummaryCalculations.js",
        "downstream_contract_output",
        "selected recovery_model",
        ["Cost Allocation", "Recovery Outcome"],
        False,
        True,
        "Recovery Summary owns recovery model. Cost Allocation must not define revenue_model.",
    ),
    VariableRecord(
        "labour_share_percent",
        "Recovery Summary",
        "Recovery Summary state/calculations",
        "input_output",
        "User selected recovery share",
        ["Cost Allocation", "Recovery Outcome"],
        False,
        True,
        "Recovery share must balance with asset and overhead shares.",
    ),
    VariableRecord(
        "asset_share_percent",
        "Recovery Summary",
        "Recovery Summary state/calculations",
        "input_output",
        "User selected recovery share",
        ["Cost Allocation", "Recovery Outcome"],
        False,
        True,
        "Recovery share must balance with labour and overhead shares.",
    ),
    VariableRecord(
        "overhead_share_percent",
        "Recovery Summary",
        "Recovery Summary state/calculations",
        "input_output",
        "User selected recovery share",
        ["Recovery Outcome"],
        False,
        True,
        "Recovery share must balance with labour and asset shares.",
    ),
    VariableRecord(
        "labour_recovery_cost",
        "Recovery Summary",
        "lib/calculations/recoverySummaryCalculations.js",
        "calculated_output",
        "total_cost_burden * labour_share_percent",
        ["Recovery Outcome"],
        False,
        True,
        "Recovery Summary distribution output.",
    ),
    VariableRecord(
        "asset_recovery_cost",
        "Recovery Summary",
        "lib/calculations/recoverySummaryCalculations.js",
        "calculated_output",
        "total_cost_burden * asset_share_percent",
        ["Recovery Outcome"],
        False,
        True,
        "Recovery Summary distribution output.",
    ),
    VariableRecord(
        "overhead_absorbed_cost",
        "Recovery Summary",
        "lib/calculations/recoverySummaryCalculations.js",
        "calculated_output",
        "total_cost_burden * overhead_share_percent",
        ["Recovery Outcome"],
        False,
        True,
        "Recovery Summary distribution output.",
    ),
    VariableRecord(
        "required_labour_recovery_rate",
        "Recovery Summary",
        "lib/calculations/recoverySummaryCalculations.js",
        "calculated_output",
        "labour_recovery_cost / total_productive_output",
        ["Recovery Outcome"],
        False,
        True,
        "Labour recovery pressure after recovery split.",
    ),
    VariableRecord(
        "required_asset_recovery",
        "Recovery Summary",
        "lib/calculations/recoverySummaryCalculations.js",
        "calculated_output",
        "asset_recovery_cost",
        ["Recovery Outcome"],
        False,
        True,
        "Annual asset recovery requirement.",
    ),

    # ============================================================
    # COST ALLOCATION
    # ============================================================
    VariableRecord(
        "structure_valid",
        "Cost Allocation",
        "lib/calculations/costAllocationRules.js",
        "calculated_output",
        "validation of links, groups, and active recovery model requirements",
        ["Recovery Outcome"],
        False,
        True,
        "Cost Allocation validates structure only. It must not calculate recovery.",
    ),
    VariableRecord(
        "staff_coverage_percent",
        "Cost Allocation",
        "lib/calculations/costAllocationRules.js",
        "calculated_output",
        "linked staff / active staff",
        ["Recovery Outcome"],
        False,
        True,
        "Coverage metric used by Recovery Outcome.",
    ),
    VariableRecord(
        "asset_coverage_percent",
        "Cost Allocation",
        "lib/calculations/costAllocationRules.js",
        "calculated_output",
        "linked assets / active assets",
        ["Recovery Outcome"],
        False,
        True,
        "Coverage metric used by Recovery Outcome.",
    ),
    VariableRecord(
        "group_coverage_percent",
        "Cost Allocation",
        "lib/calculations/costAllocationRules.js",
        "calculated_output",
        "valid groups / total groups",
        ["Recovery Outcome"],
        False,
        True,
        "Coverage metric used by Recovery Outcome.",
    ),

    # ============================================================
    # RECOVERY OUTCOME
    # ============================================================
    VariableRecord(
        "outcome_status",
        "Recovery Outcome",
        "lib/calculations/recoveryOutcomeCalculations.js",
        "decision_output",
        "decision rules based on Recovery Summary and Cost Allocation outputs",
        ["Recovery Outcome UI", "Business Outcome later"],
        False,
        True,
        "Strict values: viable, marginal, not_viable.",
    ),
    VariableRecord(
        "primary_constraint_key",
        "Recovery Outcome",
        "lib/calculations/recoveryOutcomeCalculations.js",
        "decision_output",
        "main blocking or warning reason",
        ["Recovery Outcome UI", "Business Outcome later"],
        False,
        True,
        "Strict constraint key set.",
    ),
    VariableRecord(
        "recommended_action",
        "Recovery Outcome",
        "lib/calculations/recoveryOutcomeCalculations.js",
        "decision_output",
        "human-readable action from outcome state",
        ["Recovery Outcome UI", "Business Outcome later"],
        False,
        True,
        "Should be short, direct, and actionable.",
    ),

    # ============================================================
    # RECONCILIATION AUDIT
    # ============================================================
    VariableRecord(
        "qs_tools_calculated_cost",
        "P&L Reconciliation",
        "tools/audit/qs_reconciliation_audit.py",
        "audit_output",
        "Usually total_cost_burden",
        ["Reconciliation Audit", "Business Outcome later"],
        True,
        True,
        "Calculated QS Tools burden to compare against P&L.",
    ),
    VariableRecord(
        "gross_variance",
        "P&L Reconciliation",
        "tools/audit/qs_reconciliation_audit.py",
        "audit_output",
        "qs_tools_calculated_cost - pnl_baseline_cost",
        ["Reconciliation Audit", "Business Outcome later"],
        True,
        True,
        "Gross variance is not automatically an error.",
    ),
    VariableRecord(
        "explained_variance_total",
        "P&L Reconciliation",
        "tools/audit/qs_reconciliation_audit.py",
        "audit_output",
        "sum(all explained variance categories)",
        ["Reconciliation Audit", "Business Outcome later"],
        True,
        True,
        "Explained variance offsets gross variance.",
    ),
    VariableRecord(
        "labour_model_variance",
        "P&L Reconciliation",
        "tools/audit/qs_reconciliation_audit.py",
        "audit_output",
        "QS Tools Labour model cost - mapped P&L labour cost",
        ["Reconciliation Audit", "Business Outcome later"],
        True,
        True,
        "Valid explained variance where Labour model differs from P&L labour treatment.",
    ),
    VariableRecord(
        "asset_model_variance",
        "P&L Reconciliation",
        "tools/audit/qs_reconciliation_audit.py",
        "audit_output",
        "QS Tools Assets model cost - mapped P&L asset cost",
        ["Reconciliation Audit", "Business Outcome later"],
        True,
        True,
        "Valid explained variance where asset model differs from accounting treatment.",
    ),
    VariableRecord(
        "asset_finance_variance",
        "P&L Reconciliation",
        "tools/audit/qs_reconciliation_audit.py",
        "audit_output",
        "Finance/interest timing or treatment difference",
        ["Reconciliation Audit", "Business Outcome later"],
        True,
        True,
        "Valid explained variance where finance costs are handled differently in P&L or year-end journals.",
    ),
    VariableRecord(
        "depreciation_exclusion_variance",
        "P&L Reconciliation",
        "tools/audit/qs_reconciliation_audit.py",
        "audit_output",
        "P&L depreciation excluded from QS Tools cash recovery model",
        ["Reconciliation Audit", "Business Outcome later"],
        True,
        True,
        "Valid explained variance where QS Tools excludes depreciation from real cash recovery.",
    ),
    VariableRecord(
        "employee_overhead_mapping_variance",
        "P&L Reconciliation",
        "tools/audit/qs_reconciliation_audit.py",
        "audit_output",
        "Staff overhead mapping difference",
        ["Reconciliation Audit", "Business Outcome later"],
        True,
        True,
        "Used where staff overheads are reclassified through General Overheads.",
    ),
    VariableRecord(
        "general_overhead_mapping_variance",
        "P&L Reconciliation",
        "tools/audit/qs_reconciliation_audit.py",
        "audit_output",
        "General overhead mapping difference",
        ["Reconciliation Audit", "Business Outcome later"],
        True,
        True,
        "Used where operating expense categories are mapped into General Overheads.",
    ),
    VariableRecord(
        "cost_of_sales_mapping_variance",
        "P&L Reconciliation",
        "tools/audit/qs_reconciliation_audit.py",
        "audit_output",
        "COGS/direct cost mapping difference",
        ["Reconciliation Audit", "Business Outcome later"],
        True,
        True,
        "Used where COGS/materials/subcontractors are excluded from internal cost burden or handled in Revenue / COGS.",
    ),
    VariableRecord(
        "timing_variance",
        "P&L Reconciliation",
        "tools/audit/qs_reconciliation_audit.py",
        "audit_output",
        "Timing or period mismatch",
        ["Reconciliation Audit", "Business Outcome later"],
        True,
        True,
        "Used where P&L period differs from annualised QS Tools model or journals occur at year end.",
    ),
    VariableRecord(
        "rounding_variance",
        "P&L Reconciliation",
        "tools/audit/qs_reconciliation_audit.py",
        "audit_output",
        "Immaterial rounding difference",
        ["Reconciliation Audit", "Business Outcome later"],
        True,
        True,
        "Used only for immaterial rounding differences.",
    ),
    VariableRecord(
        "unmapped_variance",
        "P&L Reconciliation",
        "tools/audit/qs_reconciliation_audit.py",
        "audit_output",
        "Variance not mapped to a known category",
        ["Reconciliation Audit", "Business Outcome later"],
        True,
        True,
        "Dangerous variance until explained.",
    ),
    VariableRecord(
        "unexplained_variance",
        "P&L Reconciliation",
        "tools/audit/qs_reconciliation_audit.py",
        "audit_output",
        "gross_variance - explained_variance_total",
        ["Reconciliation Audit", "Business Outcome later"],
        True,
        True,
        "This is the key risk number.",
    ),
    VariableRecord(
        "reconciliation_status",
        "P&L Reconciliation",
        "tools/audit/qs_reconciliation_audit.py",
        "audit_output",
        "status from unexplained variance and validation checks",
        ["Reconciliation Audit", "Business Outcome later"],
        True,
        True,
        "validated, validated_with_explained_variance, warning_unexplained_variance, failed_validation, untrusted.",
    ),
]


def get_variable_register() -> list[VariableRecord]:
    """Return the full variable register."""
    return VARIABLE_REGISTER


def get_variable_dicts() -> list[dict]:
    """Return the register as dictionaries."""
    return [asdict(record) for record in VARIABLE_REGISTER]


def get_variable_names() -> list[str]:
    """Return registered variable names."""
    return [record.variable_name for record in VARIABLE_REGISTER]


def find_variable(variable_name: str) -> VariableRecord | None:
    """Find one variable by exact name."""
    for record in VARIABLE_REGISTER:
        if record.variable_name == variable_name:
            return record
    return None


def find_by_module(module_name: str) -> list[VariableRecord]:
    """Find all variables owned by a module."""
    return [
        record
        for record in VARIABLE_REGISTER
        if record.owning_module.lower() == module_name.lower()
    ]


def export_register_json(output_path: Path | None = None) -> Path:
    """Export the variable register to JSON for audit tools."""
    if output_path is None:
        output_path = REPORTS_DIR / "variable_register.json"

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(get_variable_dicts(), indent=2),
        encoding="utf-8",
    )
    return output_path


def print_summary() -> None:
    """Print a simple register summary."""
    print("QS Tools Variable Register")
    print("-" * 60)
    print(f"Registered variables: {len(VARIABLE_REGISTER)}")

    module_counts: dict[str, int] = {}
    for record in VARIABLE_REGISTER:
        module_counts[record.owning_module] = module_counts.get(
            record.owning_module,
            0,
        ) + 1

    print("\nVariables by module:")
    for module_name, count in sorted(module_counts.items()):
        print(f"  {module_name}: {count}")


def main() -> None:
    print_summary()
    output_path = export_register_json()
    print("\nExported JSON register:")
    print(f"  {output_path}")


if __name__ == "__main__":
    main()