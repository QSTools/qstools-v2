#!/usr/bin/env python3
"""
Mirra Module Brief Update Pack Builder
======================================

Builds module-by-module v5.0 brief update addendums from the contract triage actions.

Input:
  docs/Audit/MIRRA_CONTRACT_TRIAGE_ACTIONS_v5.0.csv

Outputs:
  docs/Audit/MIRRA_MODULE_BRIEF_UPDATE_PACK_v5.0.txt
  docs/Audit/MIRRA_MODULE_BRIEF_UPDATE_ACTIONS_BY_MODULE_v5.0.csv
  docs/Audit/Module_Brief_Updates_v5.0/<module>_BRIEF_UPDATE_v5.0.txt
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
class ModuleUpdateRow:
    module_name: str
    variable_name: str
    update_type: str
    recommended_action: str
    priority: str
    reason: str
    code_files: str
    notes: str


def read_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        raise SystemExit(f"Input file not found: {path}")

    with path.open("r", newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def clean(value: str) -> str:
    return (value or "").strip()


def safe_file_name(value: str) -> str:
    value = clean(value).lower()
    value = value.replace("/", "-")
    value = value.replace("\\", "-")
    value = value.replace(" ", "-")
    value = value.replace("_", "-")

    allowed = "abcdefghijklmnopqrstuvwxyz0123456789-"

    return "".join(char for char in value if char in allowed).strip("-") or "unknown"


def build_update_rows(rows: list[dict[str, str]]) -> list[ModuleUpdateRow]:
    output: list[ModuleUpdateRow] = []

    for row in rows:
        recommended_action = clean(row.get("recommended_action", ""))

        if recommended_action != "add_to_v5_module_brief":
            continue

        output.append(
            ModuleUpdateRow(
                module_name=clean(row.get("module_name", "")) or "unknown",
                variable_name=clean(row.get("variable_name", "")),
                update_type="add_implemented_output_contract_to_brief",
                recommended_action=recommended_action,
                priority=clean(row.get("priority", "")),
                reason=clean(row.get("reason", "")),
                code_files=clean(row.get("code_files", "")),
                notes=clean(row.get("notes", "")),
            )
        )

    output.sort(
        key=lambda item: (
            item.module_name,
            item.variable_name,
        )
    )

    return output


def write_csv_rows(path: Path, rows: list[ModuleUpdateRow]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)

    fieldnames = [
        "module_name",
        "variable_name",
        "update_type",
        "recommended_action",
        "priority",
        "reason",
        "code_files",
        "notes",
    ]

    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()

        for row in rows:
            writer.writerow(asdict(row))


def grouped_by_module(rows: list[ModuleUpdateRow]) -> dict[str, list[ModuleUpdateRow]]:
    grouped: dict[str, list[ModuleUpdateRow]] = defaultdict(list)

    for row in rows:
        grouped[row.module_name].append(row)

    return dict(sorted(grouped.items()))


def write_module_update_files(out_dir: Path, rows: list[ModuleUpdateRow]) -> None:
    module_dir = out_dir / "Module_Brief_Updates_v5.0"
    module_dir.mkdir(parents=True, exist_ok=True)

    grouped = grouped_by_module(rows)

    for module_name, items in grouped.items():
        file_path = module_dir / f"{safe_file_name(module_name)}_BRIEF_UPDATE_v5.0.txt"

        lines: list[str] = []

        lines.append(f"# Mirra {VERSION} — {module_name} Brief Update")
        lines.append("")
        lines.append("STATUS: GENERATED FROM SOURCE-CODE CONTRACT AUDIT")
        lines.append("")
        lines.append("PURPOSE")
        lines.append("")
        lines.append("Add implemented code-side output contract fields that are currently missing from the v5.0 module brief.")
        lines.append("")
        lines.append("IMPORTANT")
        lines.append("")
        lines.append("- These fields already exist in source code output contracts.")
        lines.append("- This update does not say the field is commercially correct.")
        lines.append("- This update says the brief must either document the field or explicitly reject/deprecate it.")
        lines.append("- Do not rename variables during this pass.")
        lines.append("")
        lines.append("FIELDS TO ADD / REVIEW")
        lines.append("")

        for item in items:
            lines.append(f"## {item.variable_name}")
            lines.append("")
            lines.append(f"- Recommended action: {item.recommended_action}")
            lines.append(f"- Update type: {item.update_type}")
            lines.append(f"- Priority: {item.priority}")
            lines.append(f"- Reason: {item.reason}")

            if item.code_files:
                lines.append(f"- Source code file(s): {item.code_files}")

            if item.notes:
                lines.append(f"- Audit notes: {item.notes}")

            lines.append("")
            lines.append("Brief update instruction:")
            lines.append("")
            lines.append(f"- Add `{item.variable_name}` to the `{module_name}` output contract section, unless manual review decides it is stale or should be deprecated.")
            lines.append("- Preserve exact variable name.")
            lines.append("- Record owner, meaning, source file, downstream consumers if known, and whether it is current/live/future/deprecated.")
            lines.append("")

        file_path.write_text("\n".join(lines), encoding="utf-8")


def write_pack(path: Path, rows: list[ModuleUpdateRow]) -> None:
    module_counter = Counter(row.module_name for row in rows)
    grouped = grouped_by_module(rows)

    lines: list[str] = []

    lines.append("# Mirra v5.0 Module Brief Update Pack")
    lines.append("")
    lines.append(f"Generated: {datetime.now().isoformat(timespec='seconds')}")
    lines.append(f"Version: {VERSION}")
    lines.append("")
    lines.append("## Purpose")
    lines.append("")
    lines.append("This pack lists implemented source-code output contract fields that are missing from the current v5.0 module briefs.")
    lines.append("")
    lines.append("Use this to update the module briefs before treating missing code fields as bugs.")
    lines.append("")
    lines.append("## Totals")
    lines.append("")
    lines.append(f"- Total implemented-not-briefed fields to add/review: {len(rows)}")
    lines.append(f"- Modules affected: {len(grouped)}")
    lines.append("")
    lines.append("## Fields by Module")
    lines.append("")

    for module_name, count in module_counter.most_common():
        lines.append(f"- {module_name}: {count}")

    lines.append("")
    lines.append("## Module Details")
    lines.append("")

    for module_name, items in grouped.items():
        lines.append(f"### {module_name}")
        lines.append("")

        for item in items:
            lines.append(f"- `{item.variable_name}`")

        lines.append("")

    lines.append("## Recommended Review Order")
    lines.append("")
    lines.append("1. P&L")
    lines.append("2. Labour")
    lines.append("3. Assets")
    lines.append("4. General Overheads")
    lines.append("5. Cost Summary")
    lines.append("6. Business Summary")
    lines.append("7. Revenue / COGS")
    lines.append("8. Module Reconciliation / Model Readiness")
    lines.append("9. Business Modelling / Rate Builder / Recovery Summary")
    lines.append("10. Opening Hours")
    lines.append("")
    lines.append("## Rule")
    lines.append("")
    lines.append("Add implemented fields to briefs first. Do not remove source-code fields until they have been reviewed and explicitly deprecated.")
    lines.append("")

    path.write_text("\n".join(lines), encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build Mirra v5.0 module brief update pack.")

    parser.add_argument(
        "--actions",
        required=True,
        help="Path to MIRRA_CONTRACT_TRIAGE_ACTIONS_v5.0.csv",
    )

    parser.add_argument(
        "--out",
        required=True,
        help="Output directory",
    )

    return parser.parse_args()


def main() -> int:
    args = parse_args()

    actions_path = Path(args.actions).resolve()
    out_dir = Path(args.out).resolve()

    action_rows = read_csv(actions_path)
    update_rows = build_update_rows(action_rows)

    write_csv_rows(
        out_dir / "MIRRA_MODULE_BRIEF_UPDATE_ACTIONS_BY_MODULE_v5.0.csv",
        update_rows,
    )

    write_pack(
        out_dir / "MIRRA_MODULE_BRIEF_UPDATE_PACK_v5.0.txt",
        update_rows,
    )

    write_module_update_files(out_dir, update_rows)

    print(f"Input action rows: {len(action_rows)}")
    print(f"Implemented-not-briefed update rows: {len(update_rows)}")
    print(f"Wrote: {out_dir / 'MIRRA_MODULE_BRIEF_UPDATE_ACTIONS_BY_MODULE_v5.0.csv'}")
    print(f"Wrote: {out_dir / 'MIRRA_MODULE_BRIEF_UPDATE_PACK_v5.0.txt'}")
    print(f"Wrote module update files to: {out_dir / 'Module_Brief_Updates_v5.0'}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())