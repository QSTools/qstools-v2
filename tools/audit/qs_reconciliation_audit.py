"""
QS Tools — P&L Reconciliation Audit
v1.1

Purpose:
Compare P&L baseline values against QS Tools calculated outputs and explain
the variance.

Core principle:
Gross variance is not automatically an error.
Only unexplained variance is treated as a calculation, mapping, or contract risk.

Modes:
1. Controlled proof mode:
   python tools/audit/qs_reconciliation_audit.py

2. Live snapshot mode:
   python tools/audit/qs_reconciliation_audit.py --snapshot reports/audit/live_snapshots/current_audit_snapshot.json

This script is a developer audit tool.
It does not change app code.
It does not patch production files.
It does not replace the calculation engine.
"""

from __future__ import annotations

import argparse
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
    source_mode: str = "controlled"


@dataclass
class ReconciliationResult:
    scenario_name: str
    source_mode: str
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
    source_mode: str
    snapshot_path: str | None
    total_scenarios: int
    passed_scenarios: int
    warning_scenarios: int
    failed_scenarios: int
    results: list[ReconciliationResult]


# ============================================================
# Helpers
# ============================================================

def round_money(value: Any) -> float:
    """Round money values consistently."""
    try:
        return round(float(value), 2)
    except (TypeError, ValueError):
        return 0.0


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


def build_status(
    unexplained_variance: float,
    tolerance_amount: float,
    gross_variance: float,
) -> str:
    """
    Build reconciliation status.

    validated:
      no gross variance and no unexplained variance

    validated_with_explained_variance:
      gross variance exists but remaining unexplained variance is within tolerance

    failed_validation:
      material unexplained variance remains
    """
    absolute_unexplained = abs(unexplained_variance)

    if absolute_unexplained == 0 and abs(gross_variance) == 0:
        return "validated"

    if absolute_unexplained <= tolerance_amount:
        return "validated_with_explained_variance"

    return "failed_validation"


def build_conclusion(result: ReconciliationResult) -> str:
    """Build plain-language conclusion."""
    if result.reconciliation_status == "validated":
        return "PASS — QS Tools calculated cost balances exactly to the P&L baseline."

    if result.reconciliation_status == "validated_with_explained_variance":
        return (
            "PASS — gross variance exists, but remaining unexplained variance is "
            "within tolerance or fully explained."
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

    reconciliation_status = build_status(
        unexplained_variance=unexplained_variance,
        tolerance_amount=tolerance_amount,
        gross_variance=gross_variance,
    )
    trusted = reconciliation_status in {
        "validated",
        "validated_with_explained_variance",
    }

    result = ReconciliationResult(
        scenario_name=input_data.scenario_name,
        source_mode=input_data.source_mode,
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
    Live app-state checks should use --snapshot.
    """
    return [
        ReconciliationInput(
            scenario_name="Exact balance",
            pnl_baseline_cost=95000,
            qs_tools_calculated_cost=95000,
            variance_breakdown=VarianceBreakdown(),
            notes="Base case. QS Tools calculated burden equals the P&L baseline.",
            source_mode="controlled",
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
            source_mode="controlled",
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
            source_mode="controlled",
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
            source_mode="controlled",
        ),
    ]


# ============================================================
# Live snapshot mode
# ============================================================

def load_json_file(path: Path) -> dict[str, Any]:
    """Load a JSON file and return a dictionary."""
    if not path.exists():
        raise FileNotFoundError(f"Snapshot file not found: {path}")

    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError(f"Snapshot file is not valid JSON: {path}\n{exc}") from exc

    if not isinstance(payload, dict):
        raise ValueError("Snapshot JSON root must be an object.")

    return payload


def build_variance_breakdown_from_snapshot(
    payload: dict[str, Any],
) -> VarianceBreakdown:
    """Build variance breakdown from snapshot JSON."""
    raw = payload.get("explained_variance", {})
    if not isinstance(raw, dict):
        raw = {}

    return VarianceBreakdown(
        labour_model_variance=round_money(raw.get("labour_model_variance", 0)),
        asset_model_variance=round_money(raw.get("asset_model_variance", 0)),
        asset_finance_variance=round_money(raw.get("asset_finance_variance", 0)),
        depreciation_exclusion_variance=round_money(
            raw.get("depreciation_exclusion_variance", 0)
        ),
        employee_overhead_mapping_variance=round_money(
            raw.get("employee_overhead_mapping_variance", 0)
        ),
        general_overhead_mapping_variance=round_money(
            raw.get("general_overhead_mapping_variance", 0)
        ),
        cost_of_sales_mapping_variance=round_money(
            raw.get("cost_of_sales_mapping_variance", 0)
        ),
        timing_variance=round_money(raw.get("timing_variance", 0)),
        rounding_variance=round_money(raw.get("rounding_variance", 0)),
        unmapped_variance=round_money(raw.get("unmapped_variance", 0)),
    )


def build_snapshot_scenario(snapshot_path: Path) -> ReconciliationInput:
    """Build one reconciliation scenario from a live app-state snapshot."""
    payload = load_json_file(snapshot_path)

    pnl = payload.get("pnl", {})
    qs_tools = payload.get("qs_tools", {})

    if not isinstance(pnl, dict):
        pnl = {}

    if not isinstance(qs_tools, dict):
        qs_tools = {}

    snapshot_name = str(
        payload.get("snapshot_name")
        or snapshot_path.stem
        or "Live app-state snapshot"
    )

    pnl_baseline_cost = round_money(pnl.get("pnl_baseline_cost", 0))

    qs_tools_calculated_cost = round_money(
        qs_tools.get(
            "qs_tools_calculated_cost",
            qs_tools.get("total_cost_burden", 0),
        )
    )

    notes = str(
        payload.get("notes")
        or "Live app-state snapshot reconciliation."
    )

    return ReconciliationInput(
        scenario_name=snapshot_name,
        pnl_baseline_cost=pnl_baseline_cost,
        qs_tools_calculated_cost=qs_tools_calculated_cost,
        variance_breakdown=build_variance_breakdown_from_snapshot(payload),
        notes=notes,
        source_mode="snapshot",
    )


# ============================================================
# Report builder
# ============================================================

def build_audit_report(
    snapshot_path: Path | None = None,
) -> ReconciliationAuditReport:
    """Run controlled scenarios or one snapshot scenario."""
    if snapshot_path is not None:
        scenarios = [build_snapshot_scenario(snapshot_path)]
        source_mode = "snapshot"
        snapshot_path_text = str(snapshot_path)
    else:
        scenarios = build_controlled_scenarios()
        source_mode = "controlled"
        snapshot_path_text = None

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
        source_mode=source_mode,
        snapshot_path=snapshot_path_text,
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
    lines.append(f"Source mode: {report.source_mode}")

    if report.snapshot_path:
        lines.append(f"Snapshot path: {report.snapshot_path}")

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
        lines.append(f"Source mode: {result.source_mode}")
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

    if report.source_mode == "controlled":
        lines.append(
            "Controlled mode intentionally includes one failed scenario to prove "
            "that material unexplained variance is detected."
        )
    else:
        lines.append(
            "Snapshot mode checks one live app-state snapshot. A failed snapshot "
            "should be investigated before trusting downstream results."
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
    print(f"Source mode: {report.source_mode}")

    if report.snapshot_path:
        print(f"Snapshot path: {report.snapshot_path}")

    print(f"Total scenarios: {report.total_scenarios}")
    print(f"Passed scenarios: {report.passed_scenarios}")
    print(f"Warning scenarios: {report.warning_scenarios}")
    print(f"Failed scenarios: {report.failed_scenarios}")
    print("")
    print("Reports:")
    print(f"  {text_path}")
    print(f"  {json_path}")


# ============================================================
# CLI
# ============================================================

def parse_args() -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description="Run QS Tools P&L reconciliation audit."
    )
    parser.add_argument(
        "--snapshot",
        type=str,
        default=None,
        help="Optional path to a live app-state snapshot JSON file.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    snapshot_path = None
    if args.snapshot:
        snapshot_path = Path(args.snapshot)
        if not snapshot_path.is_absolute():
            snapshot_path = PROJECT_ROOT / snapshot_path

    report = build_audit_report(snapshot_path=snapshot_path)
    text_path = write_text_report(report)
    json_path = write_json_report(report)

    print_console_summary(report, text_path, json_path)


if __name__ == "__main__":
    main()