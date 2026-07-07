#!/usr/bin/env python3
"""
Mirra Contract Triage Pack Builder
==================================

Creates a readable v5.0 triage pack from the contract-vs-code audit outputs.

Inputs:
  docs/Audit/MIRRA_TRIAGE_IMPLEMENTED_NOT_BRIEFED_v5.0.csv
  docs/Audit/MIRRA_TRIAGE_BRIEFED_NOT_IMPLEMENTED_v5.0.csv
  docs/Audit/MIRRA_TRIAGE_UNKNOWN_OWNER_v5.0.csv
  docs/Audit/MIRRA_TRIAGE_LEGACY_OUTPUTS_v5.0.csv

Outputs:
  docs/Audit/MIRRA_CONTRACT_TRIAGE_PACK_v5.0.txt
  docs/Audit/MIRRA_CONTRACT_TRIAGE_ACTIONS_v5.0.csv
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
class ActionRow:
    priority: str
    action_type: str
    module_name: str
    variable_name: str
    recommended_action: str
    reason: str
    code_files: str
    brief_files: str
    notes: str


def read_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []

    with path.open("r", newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def write_actions(path: Path, rows: list[ActionRow]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)

    fieldnames = [
        "priority",
        "action_type",
        "module_name",
        "variable_name",
        "recommended_action",
        "reason",
        "code_files",
        "brief_files",
        "notes",
    ]

    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()

        for row in rows:
            writer.writerow(asdict(row))


def clean(value: str) -> str:
    return (value or "").strip()


def module_of(row: dict[str, str]) -> str:
    return clean(row.get("module_name", "")) or "unknown"


def variable_of(row: dict[str, str]) -> str:
    return clean(row.get("variable_name", ""))


def is_current_core_module(module: str) -> bool:
    return module in {
        "business-setup",
        "p-and-l",
        "revenue-cogs",
        "labour",
        "assets",
        "general-overheads",
        "module-reconciliation",
        "model-readiness",
        "opening-hours",
        "cost-summary",
        "business-summary",
        "revenue-reality",
        "asset-reality",
        "cost-allocation",
        "recovery-summary",
        "rate-builder",
        "business-outcome",
        "business-modelling",
    }


def is_future_module(module: str) -> bool:
    return module in {
        "quote-checker",
        "soq-job-po",
        "job-costing",
        "model-feedback",
        "model-review",
        "data-quality",
        "reporting-analytics",
        "database-storage-export",
        "integrations",
        "macro-micro",
    }


def action_for_implemented_not_briefed(row: dict[str, str]) -> ActionRow:
    module = module_of(row)
    variable = variable_of(row)

    if module == "unknown":
        priority = "P1"
        action = "assign_owner_or_mark_shared"
        reason = "Implemented code output has no confirmed module owner."
    elif module.endswith("-legacy"):
        priority = "P2"
        action = "legacy_review"
        reason = "Implemented output belongs to a legacy module bucket."
    elif is_current_core_module(module):
        priority = "P1"
        action = "add_to_v5_module_brief"
        reason = "Implemented output contract exists in code but is not documented in v5.0 brief."
    else:
        priority = "P2"
        action = "review_before_brief_update"
        reason = "Implemented output is outside current core module list."

    return ActionRow(
        priority=priority,
        action_type="implemented_not_briefed",
        module_name=module,
        variable_name=variable,
        recommended_action=action,
        reason=reason,
        code_files=clean(row.get("code_files", "")),
        brief_files=clean(row.get("brief_files", "")),
        notes=clean(row.get("notes", "")),
    )


def action_for_briefed_not_implemented(row: dict[str, str]) -> ActionRow:
    module = module_of(row)
    variable = variable_of(row)

    if is_future_module(module):
        priority = "P3"
        action = "future_backlog"
        reason = "Briefed field belongs to a future or later-stage module."
    elif module == "unknown":
        priority = "P2"
        action = "brief_owner_review"
        reason = "Briefed field has no confirmed owner."
    elif is_current_core_module(module):
        priority = "P2"
        action = "check_alias_or_backlog"
        reason = "Briefed field is not exposed by code; may be missing, renamed, or future within current module."
    else:
        priority = "P3"
        action = "backlog_review"
        reason = "Briefed field not found in code."

    return ActionRow(
        priority=priority,
        action_type="briefed_not_implemented",
        module_name=module,
        variable_name=variable,
        recommended_action=action,
        reason=reason,
        code_files=clean(row.get("code_files", "")),
        brief_files=clean(row.get("brief_files", "")),
        notes=clean(row.get("notes", "")),
    )


def action_for_unknown_owner(row: dict[str, str]) -> ActionRow:
    return ActionRow(
        priority="P1",
        action_type="unknown_owner",
        module_name=module_of(row),
        variable_name=variable_of(row),
        recommended_action="assign_owner_or_mark_shared_internal",
        reason="Code output exists but module ownership is unknown.",
        code_files=clean(row.get("code_files", "")),
        brief_files=clean(row.get("brief_files", "")),
        notes=clean(row.get("notes", "")),
    )


def action_for_legacy(row: dict[str, str]) -> ActionRow:
    return ActionRow(
        priority="P2",
        action_type="legacy_output",
        module_name=module_of(row),
        variable_name=variable_of(row),
        recommended_action="rename_migrate_or_explicitly_keep_legacy",
        reason="Legacy output contract still exists in code.",
        code_files=clean(row.get("code_files", "")),
        brief_files=clean(row.get("brief_files", "")),
        notes=clean(row.get("notes", "")),
    )


def build_actions(
    implemented_not_briefed: list[dict[str, str]],
    briefed_not_implemented: list[dict[str, str]],
    unknown_owner: list[dict[str, str]],
    legacy_outputs: list[dict[str, str]],
) -> list[ActionRow]:
    rows: list[ActionRow] = []

    rows.extend(action_for_implemented_not_briefed(row) for row in implemented_not_briefed)
    rows.extend(action_for_briefed_not_implemented(row) for row in briefed_not_implemented)
    rows.extend(action_for_unknown_owner(row) for row in unknown_owner)
    rows.extend(action_for_legacy(row) for row in legacy_outputs)

    rows.sort(
        key=lambda row: (
            row.priority,
            row.action_type,
            row.module_name,
            row.variable_name,
        )
    )

    return rows


def write_pack(path: Path, rows: list[ActionRow]) -> None:
    priority_counter = Counter(row.priority for row in rows)
    action_counter = Counter(row.action_type for row in rows)
    module_counter = Counter(row.module_name for row in rows)
    recommended_counter = Counter(row.recommended_action for row in rows)

    by_action_module: dict[str, Counter[str]] = defaultdict(Counter)

    for row in rows:
        by_action_module[row.action_type][row.module_name] += 1

    lines: list[str] = []

    lines.append("# Mirra v5.0 Contract Triage Pack")
    lines.append("")
    lines.append(f"Generated: {datetime.now().isoformat(timespec='seconds')}")
    lines.append(f"Version: {VERSION}")
    lines.append("")
    lines.append("## Purpose")
    lines.append("")
    lines.append("This pack converts the contract-vs-code audit into practical actions.")
    lines.append("It does not automatically declare code wrong. It separates implemented code truth, intended brief truth, future backlog, owner gaps, and legacy outputs.")
    lines.append("")
    lines.append("## Totals")
    lines.append(f"- Total action rows: {len(rows)}")
    lines.append("")
    lines.append("## By Priority")
    for priority, count in priority_counter.most_common():
        lines.append(f"- {priority}: {count}")
    lines.append("")
    lines.append("## By Action Type")
    for action_type, count in action_counter.most_common():
        lines.append(f"- {action_type}: {count}")
    lines.append("")
    lines.append("## By Recommended Action")
    for action, count in recommended_counter.most_common():
        lines.append(f"- {action}: {count}")
    lines.append("")
    lines.append("## By Module")
    for module, count in module_counter.most_common():
        lines.append(f"- {module}: {count}")
    lines.append("")
    lines.append("## Action Type by Module")
    for action_type in sorted(by_action_module):
        lines.append(f"### {action_type}")
        for module, count in by_action_module[action_type].most_common():
            lines.append(f"- {module}: {count}")
        lines.append("")
    lines.append("## Recommended Order")
    lines.append("")
    lines.append("1. P1 add_to_v5_module_brief")
    lines.append("   - Add implemented source-code outputs to the relevant module briefs.")
    lines.append("")
    lines.append("2. P1 assign_owner_or_mark_shared_internal")
    lines.append("   - Assign unknown owner fields or explicitly mark them shared/internal.")
    lines.append("")
    lines.append("3. P2 legacy_review")
    lines.append("   - Decide rename, migrate, or explicitly keep legacy outputs.")
    lines.append("")
    lines.append("4. P2 check_alias_or_backlog")
    lines.append("   - Review briefed fields missing from current code for aliases or future build scope.")
    lines.append("")
    lines.append("5. P3 future_backlog")
    lines.append("   - Keep future/later-stage fields in backlog briefs, not current implementation contracts.")
    lines.append("")

    path.write_text("\n".join(lines), encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build Mirra v5.0 contract triage pack.")

    parser.add_argument("--implemented-not-briefed", required=True)
    parser.add_argument("--briefed-not-implemented", required=True)
    parser.add_argument("--unknown-owner", required=True)
    parser.add_argument("--legacy", required=True)
    parser.add_argument("--out", required=True)

    return parser.parse_args()


def main() -> int:
    args = parse_args()

    out = Path(args.out).resolve()

    implemented_not_briefed = read_csv(Path(args.implemented_not_briefed).resolve())
    briefed_not_implemented = read_csv(Path(args.briefed_not_implemented).resolve())
    unknown_owner = read_csv(Path(args.unknown_owner).resolve())
    legacy_outputs = read_csv(Path(args.legacy).resolve())

    rows = build_actions(
        implemented_not_briefed=implemented_not_briefed,
        briefed_not_implemented=briefed_not_implemented,
        unknown_owner=unknown_owner,
        legacy_outputs=legacy_outputs,
    )

    write_actions(out / "MIRRA_CONTRACT_TRIAGE_ACTIONS_v5.0.csv", rows)
    write_pack(out / "MIRRA_CONTRACT_TRIAGE_PACK_v5.0.txt", rows)

    print(f"Implemented not briefed: {len(implemented_not_briefed)}")
    print(f"Briefed not implemented: {len(briefed_not_implemented)}")
    print(f"Unknown owner: {len(unknown_owner)}")
    print(f"Legacy outputs: {len(legacy_outputs)}")
    print(f"Total action rows: {len(rows)}")
    print(f"Wrote: {out / 'MIRRA_CONTRACT_TRIAGE_ACTIONS_v5.0.csv'}")
    print(f"Wrote: {out / 'MIRRA_CONTRACT_TRIAGE_PACK_v5.0.txt'}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())