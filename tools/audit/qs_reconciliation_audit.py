"""
QS Tools — P&L Reconciliation Audit
v1.0

Purpose:
Compare P&L baseline values against QS Tools calculated outputs and explain
the variance.

Core principle:
Gross variance is not automatically an error.
Only unexplained variance is treated as a calculation, mapping, or contract risk.

This script is a developer audit tool.
It does not change app code.
It does not patch production files.
It does not replace the calculation engine.
"""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any


# ============================================================
# Paths
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]
REPORT_DIR = PROJECT_ROOT / "reports" / "audit" / "reconciliation_reports"


# ============================================================
# Settings
# ============================================================

DOLLAR_TOLERANCE = 1.00
PERCENT_TOLERANCE = 0.001  # 0.1%


# ============================================================
# Data models
# ============================================================

@dataclass
class VarianceBreakdown:
    labour_model_variance: float = 0.0
    asset_model_variance: float = 0.0
    asset_finance_variance: float = 0.0
    depreciation_exclusion_variance: float = 0.0
    employee_overhead_mapping_variance: float = 0.0
    general_overhead_mapping_variance: float = 0.0
    cost_of_sales_mapping_variance: float = 0.0
    timing_variance: float = 0.0
    rounding_variance: float = 0.0
    unmapped_variance: float = 0.0


@dataclass
class ReconciliationInput:
    scenario_name: str
    pnl_baseline_cost: float
    qs_tools_calculated_cost: float
    variance_breakdown: VarianceBreakdown
    notes: str


@dataclass
class ReconciliationResult:
    scenario_name: str
    pnl_baseline_cost: float
    qs_tools_calculated_cost: float
    gross_variance: float
    explained_variance_total: float
    unexplained_variance: float
    tolerance_amount: float
    reconciliation_status: str
    trusted: bool
    variance_breakdown: VarianceBreakdown
    conclusion: str
    notes: str


@dataclass
class ReconciliationAuditReport:
    status: str
    total_scenarios: int
    passed_scenarios: int
    warning_scenarios: int
    failed_scenarios: int
    results: list[ReconciliationResult]


# ============================================================
# Helpers
# ============================================================

def round_money(value: float) -> float:
    """Round money values consistently."""
    return round(float(value), 2)


def calculate_tolerance(pnl_baseline_cost: float) -> float:
    """Calculate allowed unexplained tolerance."""
    percent_tolerance_amount = abs(pnl_baseline_cost) * PERCENT_TOLERANCE
    return round_money(max(DOLLAR_TOLERANCE, percent_tolerance_amount))


def calculate_explained_variance_total(breakdown: VarianceBreakdown) -> float:
    """Sum all explained variance categories."""
    return round_money(
        breakdown.labour_model_variance
        + breakdown.asset_model_variance
        + breakdown.asset_finance_variance
        + breakdown.depreciation_exclusion_variance
        + breakdown.employee_overhead_mapping_variance
        + breakdown.general_overhead_mapping_variance
        + breakdown.cost_of_sales_mapping_variance
        + breakdown.timing_variance
        + breakdown.rounding_variance
        + breakdown.unmapped_variance
    )


def build_status(unexplained_variance: float, tolerance_amount: float) -> str:
    """
    Build reconciliation status.

    validated:
      no gross variance or no meaningful unexplained variance

    validated_with_explained_variance:
      gross variance exists but is fully explained within tolerance

    warning_unexplained_variance:
      small unexplained variance remains within tolerance

    failed_validation:
      material unexplained variance remains
    """
    absolute_unexplained = abs(unexplained_variance)

    if absolute_unexplained == 0:
        return "validated"

    if absolute_unexplained <= tolerance_amount:
        return "validated_with_explained_variance"

    return "failed_validation"


def build_conclusion(result: ReconciliationResult) -> str:
    """Build plain-language conclusion."""
    if result.reconciliation_status == "validated":
        if abs(result.gross_variance) == 0:
            return "PASS — QS Tools calculated cost balances exactly to the P&L baseline."
        return "PASS — variance is fully explained. No material unexplained variance remains."

    if result.reconciliation_status == "validated_with_explained_variance":
        return (
            "PASS — gross variance exists, but remaining unexplained variance is "
            "within tolerance."
        )

    if result.reconciliation_status == "warning_unexplained_variance":
        return (
            "WARNING — small unexplained variance remains. Review if this becomes "
            "material."
        )

    return (
        "FAIL — material unexplained variance remains. Investigate calculation, "
        "mapping, duplicate cost inclusion, or missing P&L category."
    )


def reconcile_scenario(input_data: ReconciliationInput) -> ReconciliationResult:
    """Run reconciliation for one scenario."""
    pnl_baseline_cost = round_money(input_data.pnl_baseline_cost)
    qs_tools_calculated_cost = round_money(input_data.qs_tools_calculated_cost)

    gross_variance = round_money(qs_tools_calculated_cost - pnl_baseline_cost)
    explained_variance_total = calculate_explained_variance_total(
        input_data.variance_breakdown
    )
    unexplained_variance = round_money(gross_variance - explained_variance_total)
    tolerance_amount = calculate_tolerance(pnl_baseline_cost)

    reconciliation_status = build_status(unexplained_variance, tolerance_amount)
    trusted = reconciliation_status in {
        "validated",
        "validated_with_explained_variance",
    }

    result = ReconciliationResult(
        scenario_name=input_data.scenario_name,
        pnl_baseline_cost=pnl_baseline_cost,
        qs_tools_calculated_cost=qs_tools_calculated_cost,
        gross_variance=gross_variance,
        explained_variance_total=explained_variance_total,
        unexplained_variance=unexplained_variance,
        tolerance_amount=tolerance_amount,
        reconciliation_status=reconciliation_status,
        trusted=trusted,
        variance_breakdown=input_data.variance_breakdown,
        conclusion="",
        notes=input_data.notes,
    )

    result.conclusion = build_conclusion(result)
    return result


# ============================================================
# Controlled scenarios
# ============================================================

def build_controlled_scenarios() -> list[ReconciliationInput]:
    """
    Build controlled reconciliation scenarios.

    These are proof scenarios only.
    Later versions can ingest real exported app state or JSON snapshots.
    """
    return [
        ReconciliationInput(
            scenario_name="Exact balance",
            pnl_baseline_cost=95000,
            qs_tools_calculated_cost=95000,
            variance_breakdown=VarianceBreakdown(),
            notes=(
                "Base case. QS Tools calculated burden equals the P&L baseline."
            ),
        ),
        ReconciliationInput(
            scenario_name="Fully explained Labour and Asset variance",
            pnl_baseline_cost=95000,
            qs_tools_calculated_cost=110000,
            variance_breakdown=VarianceBreakdown(
                labour_model_variance=9000,
                asset_finance_variance=6000,
            ),
            notes=(
                "QS Tools differs from P&L, but variance is fully explained by "
                "Labour model treatment and asset finance treatment."
            ),
        ),
        ReconciliationInput(
            scenario_name="Depreciation exclusion and overhead mapping variance",
            pnl_baseline_cost=120000,
            qs_tools_calculated_cost=113500,
            variance_breakdown=VarianceBreakdown(
                depreciation_exclusion_variance=-10000,
                general_overhead_mapping_variance=3500,
            ),
            notes=(
                "QS Tools excludes depreciation from cash recovery and includes "
                "an overhead mapping adjustment."
            ),
        ),
        ReconciliationInput(
            scenario_name="Material unexplained variance",
            pnl_baseline_cost=100000,
            qs_tools_calculated_cost=118000,
            variance_breakdown=VarianceBreakdown(
                labour_model_variance=5000,
                asset_finance_variance=3000,
            ),
            notes=(
                "Gross variance is only partly explained. The remaining variance "
                "should fail validation."
            ),
        ),
    ]


# ============================================================
# Report builder
# ============================================================

def build_audit_report() -> ReconciliationAuditReport:
    """Run all reconciliation scenarios."""
    scenarios = build_controlled_scenarios()
    results = [reconcile_scenario(scenario) for scenario in scenarios]

    passed_scenarios = sum(
        1
        for result in results
        if result.reconciliation_status in {
            "validated",
            "validated_with_explained_variance",
        }
    )
    warning_scenarios = sum(
        1
        for result in results
        if result.reconciliation_status == "warning_unexplained_variance"
    )
    failed_scenarios = sum(
        1
        for result in results
        if result.reconciliation_status == "failed_validation"
    )

    if failed_scenarios > 0:
        status = "failed_validation"
    elif warning_scenarios > 0:
        status = "warning_unexplained_variance"
    else:
        status = "validated"

    return ReconciliationAuditReport(
        status=status,
        total_scenarios=len(results),
        passed_scenarios=passed_scenarios,
        warning_scenarios=warning_scenarios,
        failed_scenarios=failed_scenarios,
        results=results,
    )


# ============================================================
# Report writers
# ============================================================

def write_json_report(report: ReconciliationAuditReport) -> Path:
    """Write JSON reconciliation report."""
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = REPORT_DIR / "qs_reconciliation_audit_report.json"

    output_path.write_text(
        json.dumps(asdict(report), indent=2),
        encoding="utf-8",
    )

    return output_path


def write_text_report(report: ReconciliationAuditReport) -> Path:
    """Write readable text reconciliation report."""
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = REPORT_DIR / "qs_reconciliation_audit_report.txt"

    lines = []
    lines.append("QS TOOLS P&L RECONCILIATION AUDIT REPORT")
    lines.append("=" * 80)
    lines.append(f"Status: {report.status}")
    lines.append(f"Total scenarios: {report.total_scenarios}")
    lines.append(f"Passed scenarios: {report.passed_scenarios}")
    lines.append(f"Warning scenarios: {report.warning_scenarios}")
    lines.append(f"Failed scenarios: {report.failed_scenarios}")
    lines.append("")

    for result in report.results:
        breakdown = result.variance_breakdown

        lines.append("SCENARIO")
        lines.append("-" * 80)
        lines.append(f"Name: {result.scenario_name}")
        lines.append(f"Status: {result.reconciliation_status}")
        lines.append(f"Trusted: {result.trusted}")
        lines.append("")
        lines.append(f"P&L baseline cost:          ${result.pnl_baseline_cost:,.2f}")
        lines.append(f"QS Tools calculated cost:   ${result.qs_tools_calculated_cost:,.2f}")
        lines.append(f"Gross variance:             ${result.gross_variance:,.2f}")
        lines.append("")
        lines.append("Explained variance:")
        lines.append(f"  Labour model variance:              ${breakdown.labour_model_variance:,.2f}")
        lines.append(f"  Asset model variance:               ${breakdown.asset_model_variance:,.2f}")
        lines.append(f"  Asset finance variance:             ${breakdown.asset_finance_variance:,.2f}")
        lines.append(f"  Depreciation exclusion variance:    ${breakdown.depreciation_exclusion_variance:,.2f}")
        lines.append(f"  Employee overhead mapping variance: ${breakdown.employee_overhead_mapping_variance:,.2f}")
        lines.append(f"  General overhead mapping variance:  ${breakdown.general_overhead_mapping_variance:,.2f}")
        lines.append(f"  Cost of sales mapping variance:     ${breakdown.cost_of_sales_mapping_variance:,.2f}")
        lines.append(f"  Timing variance:                    ${breakdown.timing_variance:,.2f}")
        lines.append(f"  Rounding variance:                  ${breakdown.rounding_variance:,.2f}")
        lines.append(f"  Unmapped variance:                  ${breakdown.unmapped_variance:,.2f}")
        lines.append("")
        lines.append(f"Explained variance total:  ${result.explained_variance_total:,.2f}")
        lines.append(f"Unexplained variance:      ${result.unexplained_variance:,.2f}")
        lines.append(f"Tolerance amount:          ${result.tolerance_amount:,.2f}")
        lines.append("")
        lines.append(f"Conclusion: {result.conclusion}")
        lines.append(f"Notes: {result.notes}")
        lines.append("")

    lines.append("INTERPRETATION")
    lines.append("-" * 80)
    lines.append(
        "Gross variance is not automatically an error. The key audit value is "
        "unexplained variance."
    )
    lines.append(
        "If unexplained variance is material, the result must be treated as "
        "untrusted until the variance is mapped, explained, or corrected."
    )
    lines.append(
        "This v1 audit uses controlled scenarios only. Later versions can ingest "
        "real exported app state or JSON snapshots."
    )

    output_path.write_text("\n".join(lines), encoding="utf-8")
    return output_path


def print_console_summary(
    report: ReconciliationAuditReport,
    text_path: Path,
    json_path: Path,
) -> None:
    """Print concise console summary."""
    print("QS Tools P&L Reconciliation Audit")
    print("-" * 60)
    print(f"Status: {report.status}")
    print(f"Total scenarios: {report.total_scenarios}")
    print(f"Passed scenarios: {report.passed_scenarios}")
    print(f"Warning scenarios: {report.warning_scenarios}")
    print(f"Failed scenarios: {report.failed_scenarios}")
    print("")
    print("Reports:")
    print(f"  {text_path}")
    print(f"  {json_path}")


def main() -> None:
    report = build_audit_report()
    text_path = write_text_report(report)
    json_path = write_json_report(report)

    print_console_summary(report, text_path, json_path)

    # Do not exit non-zero yet.
    # This v1 contains an intentional failed scenario to prove the audit detects it.


if __name__ == "__main__":
    main()