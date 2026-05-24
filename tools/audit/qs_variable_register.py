"""
QS Tools — Variable Register
v1.0

Purpose:
Central register of important QS Tools variables used by the audit tools.

This register is used by:
- qs_variable_trace.py
- qs_calc_test_runner.py
- qs_reconciliation_audit.py

The register does not calculate business logic.
It only defines ownership, expected source files, downstream consumers,
and whether each variable requires testing or P&L reconciliation.
"""

from __future__ import annotations

from dataclasses import dataclass, asdict
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
        ["Employee Overheads", "Cost Summary", "Cost Allocation"],
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
        "Cost Summary consumes this as productive output. Must not be rebuilt downstream.",
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
        "downstream_contract_output",
        "base_labour_cost_annual",
        ["Cost Summary"],
        True,
        True,
        "Locked Labour output consumed by Cost Summary.",
    ),
    VariableRecord(
        "entitlements_annual",
        "Labour",
        "lib/calculations/labourCalculations.js",
        "downstream_contract_output",
        "labour_rate * non_productive_paid_hours",
        ["Cost Summary"],
        True,
        True,
        "Locked Labour output consumed by Cost Summary.",
    ),
    VariableRecord(
        "employer_kiwisaver_gross",
        "Labour",
        "lib/calculations/labourCalculations.js",
        "downstream_contract_output",
        "labour_rate * paid_hours_per_year * employer_kiwisaver_rate",
        ["Cost Summary"],
        True,
        True,
        "Locked Labour output consumed by Cost Summary.",
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
        "downstream_contract_output",
        "employer_kiwisaver_gross * derived esct_rate",
        ["Cost Summary"],
        True,
        True,
        "Locked Labour output consumed by Cost Summary.",
    ),
    VariableRecord(
        "total_employer_contribution_cost",
        "Labour",
        "lib/calculations/labourCalculations.js",
        "downstream_contract_output",
        "employer_kiwisaver_gross + esct_amount",
        ["Cost Summary", "Labour UI"],
        True,
        True,
        "Subtotal only. KiwiSaver and ESCT must remain separately visible.",
    ),
    VariableRecord(
        "total_labour_cost_annual",
        "Labour",
        "lib/calculations/labourCalculations.js",
        "calculated_output",
        "base_labour_cost_annual + total_employer_contribution_cost",
        ["Labour UI"],
        False,
        True,
        "Labour-only annual burden before Employee Overheads.",
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
    # EMPLOYEE OVERHEADS
    # ============================================================
    VariableRecord(
        "employee_overheads_total_annual",
        "Employee Overheads",
        "lib/calculations/employeeOverheadCalculations.js",
        "downstream_contract_output",
        "Employee overhead categories summed per staff_id",
        ["Cost Summary"],
        True,
        True,
        "Must join to Labour by staff_id only.",
    ),
    VariableRecord(
        "total_employee_overheads_annual",
        "Employee Overheads",
        "lib/calculations/employeeOverheadCalculations.js",
        "downstream_contract_output",
        "sum(employee_overheads_total_annual)",
        ["Cost Summary"],
        True,
        True,
        "Aggregate Employee Overheads output.",
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
        "sum(all fixed categories + custom overhead items)",
        ["Cost Summary"],
        True,
        True,
        "Cost Summary maps this to total_business_overheads.",
    ),

    # ============================================================
    # COST SUMMARY
    # ============================================================
    VariableRecord(
        "total_gross_wages_annual",
        "Cost Summary",
        "lib/calculations/costSummaryCalculations.js",
        "calculated_aggregate",
        "sum(gross_wages_annual)",
        ["Cost Summary UI", "Reconciliation Audit"],
        True,
        True,
        "Aggregate of locked Labour output.",
    ),
    VariableRecord(
        "total_entitlements_annual",
        "Cost Summary",
        "lib/calculations/costSummaryCalculations.js",
        "calculated_aggregate",
        "sum(entitlements_annual)",
        ["Cost Summary UI", "Reconciliation Audit"],
        True,
        True,
        "Aggregate of locked Labour output.",
    ),
    VariableRecord(
        "total_employer_kiwisaver_annual",
        "Cost Summary",
        "lib/calculations/costSummaryCalculations.js",
        "calculated_aggregate",
        "sum(employer_kiwisaver_gross)",
        ["Cost Summary UI", "Reconciliation Audit"],
        True,
        True,
        "Aggregate of locked Labour output.",
    ),
    VariableRecord(
        "total_esct_annual",
        "Cost Summary",
        "lib/calculations/costSummaryCalculations.js",
        "calculated_aggregate",
        "sum(esct_amount)",
        ["Cost Summary UI", "Reconciliation Audit"],
        True,
        True,
        "Aggregate of locked Labour output.",
    ),
    VariableRecord(
        "total_people_cost_annual",
        "Cost Summary",
        "lib/calculations/costSummaryCalculations.js",
        "calculated_aggregate",
        "wages + entitlements + KiwiSaver + ESCT + employee overheads",
        ["Recovery Summary", "Reconciliation Audit"],
        True,
        True,
        "Critical Cost Summary People Cost output.",
    ),
    VariableRecord(
        "total_productive_output",
        "Cost Summary",
        "lib/calculations/costSummaryCalculations.js",
        "calculated_aggregate",
        "sum(productive_hours)",
        ["Recovery Summary"],
        False,
        True,
        "Used to calculate required_recovery_rate.",
    ),
    VariableRecord(
        "total_business_overheads",
        "Cost Summary",
        "lib/calculations/costSummaryCalculations.js",
        "calculated_aggregate",
        "total_general_overheads",
        ["Recovery Summary", "Reconciliation Audit"],
        True,
        True,
        "General Overheads mapped into Cost Summary.",
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
        "Main Cost Summary output. Must reconcile to P&L or explained variance.",
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
        "required_revenue / total_productive_output",
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
    # P&L / RECONCILIATION
    # ============================================================
    VariableRecord(
        "pnl_baseline_cost",
        "P&L Reconciliation",
        "P&L import / reconciliation audit",
        "source_truth_input",
        "Entered/imported P&L baseline cost",
        ["Reconciliation Audit", "Business Outcome later"],
        True,
        True,
        "Source truth baseline from P&L/Xero.",
    ),
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
        module_counts[record.owning_module] = module_counts.get(record.owning_module, 0) + 1

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