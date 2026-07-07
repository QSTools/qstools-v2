#!/usr/bin/env python3
"""
Mirra Module Brief Update Classifier
====================================

Classifies implemented-not-briefed fields before they are merged into v5.0 briefs.

Input:
  docs/Audit/MIRRA_MODULE_BRIEF_UPDATE_ACTIONS_BY_MODULE_v5.0.csv

Outputs:
  docs/Audit/MIRRA_MODULE_BRIEF_ACCEPTED_FIELDS_v5.0.csv
  docs/Audit/MIRRA_MODULE_BRIEF_REJECTED_INTERNAL_FIELDS_v5.0.csv
  docs/Audit/MIRRA_MODULE_BRIEF_REVIEW_FIELDS_v5.0.csv
  docs/Audit/MIRRA_MODULE_BRIEF_CLASSIFIED_FIELDS_v5.0.csv
  docs/Audit/MIRRA_MODULE_BRIEF_CLASSIFICATION_SUMMARY_v5.0.txt
"""

from __future__ import annotations

import argparse
import csv
from collections import Counter, defaultdict
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path


VERSION = "v5.0"


@dataclass(frozen=True)
class ClassifiedField:
    module_name: str
    variable_name: str
    classification: str
    recommended_action: str
    confidence: str
    reason: str
    update_type: str
    priority: str
    code_files: str
    notes: str


ACCEPT_SUFFIXES = (
    "_status",
    "_ready",
    "_warnings",
    "_warning",
    "_trust_state",
    "_benchmark_total",
    "_total",
    "_annual",
    "_rate",
    "_percent",
    "_hours",
    "_cost",
    "_costs",
    "_balance",
    "_variance",
    "_margin",
    "_gap",
    "_count",
    "_rows",
    "_lines",
    "_categories",
    "_breakdown",
    "_summary",
    "_signature",
)

ACCEPT_EXACT_NAMES = {
    "active_assets",
    "active_staff",
    "asset_interest_annual",
    "asset_status",
    "assets_benchmark_total",
    "assigned_asset_overhead_cost",
    "assigned_asset_overhead_cost_annual",
    "base_asset_cost_annual",
    "business_recovery_hours",
    "business_summary_warnings",
    "business_type",
    "cost_burden_breakdown",
    "cost_of_sales_lines",
    "cost_summary_ready",
    "current_margin_per_productive_hour",
    "direct_cost_categories",
    "direct_cost_category_totals",
    "employee_overheads_benchmark_total",
    "excluded_asset_finance_interest_total",
    "expected_labour_margin_percent",
    "finance_cost_annual",
    "general_overheads_benchmark_total",
    "gross_profit",
    "has_baseline",
    "has_productive_asset_recovery_base",
    "is_hydrated",
    "is_labour_based",
    "is_labour_reality",
    "is_product_based",
    "macro_required_operating_hour_rate",
    "margin_pool",
    "materials_cost",
    "model_ready",
    "model_readiness_status",
    "model_trust_state",
    "net_annual_business_open_hours",
    "net_position",
    "net_profit",
    "no_active_assets_confirmed",
    "operating_recovery_hours",
    "pnl_interest_marked_asset_finance_total",
    "pnl_interest_total",
    "productive_asset_cost",
    "productive_asset_recovery_cost_annual",
    "productive_hours",
    "productive_staff_type_rate_warnings",
    "recovery_gap_per_hour",
    "recovery_hours_used",
    "required_labour_burden_rate",
    "required_recovery_rate",
    "resolved_commercial_driver_mode",
    "running_cost_annual",
    "subcontract_cost",
    "support_asset_cost",
    "support_asset_count",
    "total_acc_levy_annual",
    "total_allocated_asset_overhead_cost_annual",
    "total_asset_interest_annual",
    "total_asset_recovery_cost_annual",
    "total_assigned_business_costs",
    "total_available_hours_before_productivity",
    "total_business_cost_annual",
    "total_business_costs",
    "total_cogs",
    "total_cost_of_sales",
    "total_direct_costs",
    "total_general_overheads_before_asset_assignment",
    "total_model_costs",
    "total_operating_expenses",
    "total_other_income",
    "total_people_cost_annual",
    "total_pnl_costs",
    "total_productive_paid_hours",
    "total_recovery_hours",
    "total_revenue",
    "total_staff_recovery_hours",
    "total_trading_income",
    "total_unassigned_asset_related_overhead_cost_annual",
    "unassigned_balance",
    "unassigned_details",
    "unreviewed_interest_count",
    "unreviewed_interest_total",
    "units_sold_annual",
    "weighted_all_productive_productivity_percent",
    "weighted_productivity_percent",
}

REFERENCE_WRAPPER_NAMES = {
    "asset_output_contract",
    "assets_output",
    "assets_outputs",
    "business_setup_output_contract",
    "business_summary_output_contract",
    "business_summary_outputs",
    "cost_allocation_contract",
    "cost_allocation_output_contract",
    "cost_summary_output_contract",
    "cost_summary_outputs",
    "general_overheads_output",
    "general_overheads_output_contract",
    "general_overheads_outputs",
    "labour_output",
    "labour_output_contract",
    "labour_outputs",
    "pnl_output",
    "pnl_output_contract",
    "recovery_summary_contract",
    "revenue_cogs_output_contract",
    "revenue_cogs_outputs",
}

REVIEW_WRAPPER_NAMES = {
    "assets",
    "asset_detail",
    "asset_outputs",
    "business_modelling_state",
    "business_setup",
    "business_setup_state",
    "business_summary",
    "calculations",
    "cost_allocation",
    "cost_summary",
    "current_overhead_state",
    "fallback_recovery_summary",
    "general_overheads",
    "labour",
    "labour_data",
    "labour_profiles",
    "model_readiness",
    "opening_hours_module",
    "output_contract",
    "overhead_state",
    "pnl_sync_signature",
    "profit_and_loss",
    "profit_and_loss_state",
    "reconciliation",
    "recovery_outputs",
    "recovery_plan",
    "recovery_summary",
    "revenue_cogs",
    "revenue_cogs_state",
    "state",
    "summary",
}

REJECT_EXACT_NAMES = {
    "actions",
    "build_asset_recovery_overlay",
    "build_active_labour_rate_model_for_calculation",
    "build_all_labour_type_rows",
    "build_cost_allocation_output_contract",
    "build_general_overheads_from_pnl",
    "build_general_overhead_allocation_outputs",
    "build_labour_rate_result_metrics",
    "build_labour_type_rows_by_class",
    "build_pnl_sync_signature",
    "build_productive_labour_type_rows",
    "build_reconciliation",
    "build_support_labour_type_rows",
    "build_unassigned_details",
    "build_warnings",
    "format_number",
    "get_nested_value",
    "good",
    "label",
    "pool_key",
    "safe_array",
    "safe_number",
    "tone",
    "value",
    "warn",
}

REJECT_PREFIXES = (
    "build_",
    "get_",
    "format_",
    "safe_",
)

DISPLAY_ONLY_NAMES = {
    "good",
    "warn",
    "tone",
    "label",
    "value",
    "Ready",
}


def clean(value: str) -> str:
    return (value or "").strip()


def read_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        raise SystemExit(f"Input file not found: {path}")

    with path.open("r", newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def write_csv(path: Path, rows: list[ClassifiedField]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)

    fieldnames = [
        "module_name",
        "variable_name",
        "classification",
        "recommended_action",
        "confidence",
        "reason",
        "update_type",
        "priority",
        "code_files",
        "notes",
    ]

    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()

        for row in rows:
            writer.writerow(asdict(row))


def classify_variable(module_name: str, variable_name: str, notes: str, code_files: str) -> tuple[str, str, str, str]:
    """
    Returns:
      classification, recommended_action, confidence, reason
    """

    variable = clean(variable_name)
    variable_lower = variable.lower()
    notes_lower = clean(notes).lower()
    code_files_lower = clean(code_files).lower()

    if variable in DISPLAY_ONLY_NAMES or variable_lower in DISPLAY_ONLY_NAMES:
        return (
            "display_only_do_not_brief",
            "reject_from_output_contract_brief",
            "high",
            "Field appears to be a UI display/status presentation token rather than a module output contract.",
        )

    if variable in REJECT_EXACT_NAMES or variable_lower in REJECT_EXACT_NAMES:
        return (
            "internal_helper_do_not_brief",
            "reject_from_output_contract_brief",
            "high",
            "Field appears to be an internal helper, utility, formatter, selector helper, or builder function.",
        )

    if variable_lower.startswith(REJECT_PREFIXES):
        return (
            "internal_helper_do_not_brief",
            "reject_from_output_contract_brief",
            "high",
            "Field name starts with helper/function prefix and should not be documented as an output contract variable.",
        )

    if "legacy" in variable_lower or "legacy" in notes_lower or "legacy" in code_files_lower:
        return (
            "legacy_or_stale_review",
            "manual_review_before_briefing",
            "medium",
            "Field contains or references legacy terminology and needs explicit keep/migrate/remove decision.",
        )

    if variable in REFERENCE_WRAPPER_NAMES or variable_lower in REFERENCE_WRAPPER_NAMES:
        return (
            "accept_reference_wrapper",
            "document_as_reference_wrapper_not_business_metric",
            "medium",
            "Field appears to be a named module output contract wrapper consumed by another module.",
        )

    if variable in REVIEW_WRAPPER_NAMES or variable_lower in REVIEW_WRAPPER_NAMES:
        return (
            "owner_review_required",
            "manual_owner_review_before_briefing",
            "medium",
            "Field appears to be a wrapper, state object, or cross-module reference rather than a direct metric.",
        )

    if variable in ACCEPT_EXACT_NAMES or variable_lower in ACCEPT_EXACT_NAMES:
        return (
            "accept_contract_field",
            "add_to_v5_module_brief_output_contract",
            "high",
            "Field is a named business/status/readiness/financial/hour/recovery output used by code.",
        )

    if variable_lower.endswith(ACCEPT_SUFFIXES):
        return (
            "accept_contract_field",
            "add_to_v5_module_brief_output_contract",
            "medium",
            "Field suffix indicates a likely contract output such as total, status, warning, cost, rate, hours, or row array.",
        )

    if "_output_contract" in variable_lower:
        return (
            "accept_reference_wrapper",
            "document_as_reference_wrapper_not_business_metric",
            "medium",
            "Field appears to be an output contract wrapper reference.",
        )

    if "warning" in variable_lower or "warnings" in notes_lower:
        return (
            "accept_contract_field",
            "add_to_v5_module_brief_output_contract",
            "medium",
            "Field appears to carry warning state consumed by the UI or downstream modules.",
        )

    if "status" in variable_lower or "status_field" in notes_lower:
        return (
            "accept_contract_field",
            "add_to_v5_module_brief_output_contract",
            "medium",
            "Field appears to carry module status state.",
        )

    if "ready" in variable_lower or "readiness_field" in notes_lower:
        return (
            "accept_contract_field",
            "add_to_v5_module_brief_output_contract",
            "medium",
            "Field appears to carry module readiness state.",
        )

    if "trust_state" in variable_lower or "trust_state_field" in notes_lower:
        return (
            "accept_contract_field",
            "add_to_v5_module_brief_output_contract",
            "medium",
            "Field appears to carry model trust state.",
        )

    if variable_lower.endswith("_rows") or variable_lower.endswith("_lines"):
        return (
            "accept_contract_field",
            "add_to_v5_module_brief_output_contract",
            "medium",
            "Field appears to be a row/line array used by downstream display or calculation layers.",
        )

    return (
        "owner_review_required",
        "manual_owner_review_before_briefing",
        "low",
        "No strong automated signal. Needs human review before adding to a module brief.",
    )


def classify_rows(rows: list[dict[str, str]]) -> list[ClassifiedField]:
    output: list[ClassifiedField] = []

    for row in rows:
        module_name = clean(row.get("module_name", "")) or "unknown"
        variable_name = clean(row.get("variable_name", ""))
        notes = clean(row.get("notes", ""))
        code_files = clean(row.get("code_files", ""))

        if not variable_name:
            continue

        classification, recommended_action, confidence, reason = classify_variable(
            module_name=module_name,
            variable_name=variable_name,
            notes=notes,
            code_files=code_files,
        )

        output.append(
            ClassifiedField(
                module_name=module_name,
                variable_name=variable_name,
                classification=classification,
                recommended_action=recommended_action,
                confidence=confidence,
                reason=reason,
                update_type=clean(row.get("update_type", "")),
                priority=clean(row.get("priority", "")),
                code_files=code_files,
                notes=notes,
            )
        )

    output.sort(
        key=lambda item: (
            item.classification,
            item.module_name,
            item.variable_name.lower(),
        )
    )

    return output


def write_summary(path: Path, rows: list[ClassifiedField]) -> None:
    classification_counter = Counter(row.classification for row in rows)
    action_counter = Counter(row.recommended_action for row in rows)
    confidence_counter = Counter(row.confidence for row in rows)
    module_counter = Counter(row.module_name for row in rows)

    by_module_classification: dict[str, Counter[str]] = defaultdict(Counter)

    for row in rows:
        by_module_classification[row.module_name][row.classification] += 1

    accepted = [
        row
        for row in rows
        if row.classification in {"accept_contract_field", "accept_reference_wrapper"}
    ]

    rejected = [
        row
        for row in rows
        if row.classification in {"internal_helper_do_not_brief", "display_only_do_not_brief"}
    ]

    review = [
        row
        for row in rows
        if row.classification in {"legacy_or_stale_review", "owner_review_required"}
    ]

    lines: list[str] = []

    lines.append("# Mirra v5.0 Module Brief Field Classification Summary")
    lines.append("")
    lines.append(f"Generated: {datetime.now().isoformat(timespec='seconds')}")
    lines.append(f"Version: {VERSION}")
    lines.append("")
    lines.append("## Purpose")
    lines.append("")
    lines.append("Classifies implemented-not-briefed fields before merging them into v5.0 module briefs.")
    lines.append("This prevents implementation helpers and UI display tokens from being documented as formal output contract variables.")
    lines.append("")
    lines.append("## Totals")
    lines.append(f"- Total classified fields: {len(rows)}")
    lines.append(f"- Accepted fields: {len(accepted)}")
    lines.append(f"- Rejected internal/display fields: {len(rejected)}")
    lines.append(f"- Manual review fields: {len(review)}")
    lines.append("")

    lines.append("## By Classification")
    for classification, count in classification_counter.most_common():
        lines.append(f"- {classification}: {count}")
    lines.append("")

    lines.append("## By Recommended Action")
    for action, count in action_counter.most_common():
        lines.append(f"- {action}: {count}")
    lines.append("")

    lines.append("## By Confidence")
    for confidence, count in confidence_counter.most_common():
        lines.append(f"- {confidence}: {count}")
    lines.append("")

    lines.append("## By Module")
    for module_name, count in module_counter.most_common():
        classes = by_module_classification[module_name]
        class_text = ", ".join(f"{name}={value}" for name, value in classes.most_common())
        lines.append(f"- {module_name}: {count} ({class_text})")
    lines.append("")

    lines.append("## What To Do Next")
    lines.append("")
    lines.append("1. Add `accept_contract_field` rows to the relevant v5.0 module output contract sections.")
    lines.append("2. Add `accept_reference_wrapper` rows only as wrapper/reference fields, not business metrics.")
    lines.append("3. Do not add `internal_helper_do_not_brief` or `display_only_do_not_brief` rows to module contracts.")
    lines.append("4. Manually decide `owner_review_required` and `legacy_or_stale_review` rows.")
    lines.append("5. Re-run brief extraction and contract-vs-code comparison after updates.")
    lines.append("")

    path.write_text("\n".join(lines), encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Classify Mirra module brief update fields.")

    parser.add_argument(
        "--input",
        required=True,
        help="Path to MIRRA_MODULE_BRIEF_UPDATE_ACTIONS_BY_MODULE_v5.0.csv",
    )

    parser.add_argument(
        "--out",
        required=True,
        help="Output directory",
    )

    return parser.parse_args()


def main() -> int:
    args = parse_args()

    input_path = Path(args.input).resolve()
    out_dir = Path(args.out).resolve()

    input_rows = read_csv(input_path)
    classified = classify_rows(input_rows)

    accepted = [
        row
        for row in classified
        if row.classification in {"accept_contract_field", "accept_reference_wrapper"}
    ]

    rejected = [
        row
        for row in classified
        if row.classification in {"internal_helper_do_not_brief", "display_only_do_not_brief"}
    ]

    review = [
        row
        for row in classified
        if row.classification in {"legacy_or_stale_review", "owner_review_required"}
    ]

    write_csv(out_dir / "MIRRA_MODULE_BRIEF_CLASSIFIED_FIELDS_v5.0.csv", classified)
    write_csv(out_dir / "MIRRA_MODULE_BRIEF_ACCEPTED_FIELDS_v5.0.csv", accepted)
    write_csv(out_dir / "MIRRA_MODULE_BRIEF_REJECTED_INTERNAL_FIELDS_v5.0.csv", rejected)
    write_csv(out_dir / "MIRRA_MODULE_BRIEF_REVIEW_FIELDS_v5.0.csv", review)
    write_summary(out_dir / "MIRRA_MODULE_BRIEF_CLASSIFICATION_SUMMARY_v5.0.txt", classified)

    print(f"Input rows: {len(input_rows)}")
    print(f"Classified rows: {len(classified)}")
    print(f"Accepted fields: {len(accepted)}")
    print(f"Rejected internal/display fields: {len(rejected)}")
    print(f"Manual review fields: {len(review)}")
    print(f"Wrote: {out_dir / 'MIRRA_MODULE_BRIEF_CLASSIFIED_FIELDS_v5.0.csv'}")
    print(f"Wrote: {out_dir / 'MIRRA_MODULE_BRIEF_ACCEPTED_FIELDS_v5.0.csv'}")
    print(f"Wrote: {out_dir / 'MIRRA_MODULE_BRIEF_REJECTED_INTERNAL_FIELDS_v5.0.csv'}")
    print(f"Wrote: {out_dir / 'MIRRA_MODULE_BRIEF_REVIEW_FIELDS_v5.0.csv'}")
    print(f"Wrote: {out_dir / 'MIRRA_MODULE_BRIEF_CLASSIFICATION_SUMMARY_v5.0.txt'}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())