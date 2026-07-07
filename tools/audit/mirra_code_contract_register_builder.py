#!/usr/bin/env python3
"""
Mirra Code Contract Register Builder
====================================

Builds a clean module-level contract register from the filtered source-code
contract fields.

Input:
  docs/Audit/MIRRA_CODE_CONTRACT_FIELDS_v5.0.csv

Outputs:
  docs/Audit/MIRRA_CODE_CONTRACT_REGISTER_BY_MODULE_v5.0.csv
  docs/Audit/MIRRA_CODE_OUTPUT_CONTRACT_REGISTER_BY_MODULE_v5.0.csv
  docs/Audit/MIRRA_CODE_CONTRACT_REGISTER_SUMMARY_v5.0.txt
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
class ModuleContractRecord:
    module_name: str
    variable_name: str
    likely_role: str
    variable_style: str
    occurrence_count: int
    source_areas: str
    source_files: str
    first_seen_file: str
    first_seen_line: str
    extraction_types: str
    notes: str


def read_rows(path: Path) -> list[dict[str, str]]:
    with path.open("r", newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def write_rows(path: Path, rows: list[ModuleContractRecord]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)

    fieldnames = [
        "module_name",
        "variable_name",
        "likely_role",
        "variable_style",
        "occurrence_count",
        "source_areas",
        "source_files",
        "first_seen_file",
        "first_seen_line",
        "extraction_types",
        "notes",
    ]

    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()

        for row in rows:
            writer.writerow(asdict(row))


def clean_module_name(value: str) -> str:
    value = (value or "").strip()

    if not value:
        return "unknown"

    return value


def role_priority(role: str) -> int:
    priorities = {
        "output_contract_field": 1,
        "consumed_field": 2,
        "status_field": 3,
        "trust_state_field": 4,
        "readiness_field": 5,
        "warnings_field": 6,
        "warning_id": 7,
        "object_field": 8,
    }

    return priorities.get(role, 99)


def choose_primary_role(roles: list[str]) -> str:
    roles = [role for role in roles if role]

    if not roles:
        return ""

    return sorted(roles, key=role_priority)[0]


def choose_primary_style(styles: list[str]) -> str:
    styles = [style for style in styles if style]

    if not styles:
        return ""

    return Counter(styles).most_common(1)[0][0]


def build_register(rows: list[dict[str, str]]) -> list[ModuleContractRecord]:
    grouped: dict[tuple[str, str], list[dict[str, str]]] = defaultdict(list)

    for row in rows:
        module_name = clean_module_name(row.get("module_hint", ""))
        variable_name = row.get("variable_name", "").strip()

        if not variable_name:
            continue

        grouped[(module_name, variable_name)].append(row)

    output: list[ModuleContractRecord] = []

    for (module_name, variable_name), items in sorted(grouped.items()):
        roles = [item.get("likely_role", "") for item in items]
        styles = [item.get("variable_style", "") for item in items]
        source_areas = sorted({item.get("source_area", "") for item in items if item.get("source_area", "")})
        extraction_types = sorted({item.get("extraction_type", "") for item in items if item.get("extraction_type", "")})
        files = sorted({item.get("file_path", "") for item in items if item.get("file_path", "")})

        first = sorted(
            items,
            key=lambda item: (
                item.get("file_path", ""),
                int(item.get("line_number", "0") or "0"),
            ),
        )[0]

        notes: list[str] = []

        unique_roles = sorted(set(role for role in roles if role))

        if len(unique_roles) > 1:
            notes.append("multiple_roles_detected")

        if len(files) > 1:
            notes.append("appears_in_multiple_files")

        if "output_contract_field" in unique_roles:
            notes.append("downstream_contract_candidate")

        if "consumed_field" in unique_roles:
            notes.append("consumed_from_upstream")

        if module_name.endswith("-legacy"):
            notes.append("legacy_module_review_required")

        if module_name == "unknown":
            notes.append("module_owner_review_required")

        output.append(
            ModuleContractRecord(
                module_name=module_name,
                variable_name=variable_name,
                likely_role=choose_primary_role(roles),
                variable_style=choose_primary_style(styles),
                occurrence_count=len(items),
                source_areas=" | ".join(source_areas),
                source_files=" | ".join(files[:20]),
                first_seen_file=first.get("file_path", ""),
                first_seen_line=first.get("line_number", ""),
                extraction_types=" | ".join(extraction_types),
                notes=" | ".join(notes),
            )
        )

    output.sort(
        key=lambda row: (
            row.module_name,
            role_priority(row.likely_role),
            row.variable_name,
        )
    )

    return output


def write_summary(
    path: Path,
    all_register_rows: list[ModuleContractRecord],
    output_contract_rows: list[ModuleContractRecord],
) -> None:
    module_counter = Counter(row.module_name for row in all_register_rows)
    output_counter = Counter(row.module_name for row in output_contract_rows)
    role_counter = Counter(row.likely_role for row in all_register_rows)
    legacy_rows = [row for row in all_register_rows if row.module_name.endswith("-legacy")]
    unknown_rows = [row for row in all_register_rows if row.module_name == "unknown"]

    lines: list[str] = []

    lines.append("# Mirra Code Contract Register Summary")
    lines.append("")
    lines.append(f"Generated: {datetime.now().isoformat(timespec='seconds')}")
    lines.append(f"Version: {VERSION}")
    lines.append("")
    lines.append("## Totals")
    lines.append(f"- Module contract register rows: {len(all_register_rows)}")
    lines.append(f"- Output contract register rows: {len(output_contract_rows)}")
    lines.append(f"- Legacy module rows: {len(legacy_rows)}")
    lines.append(f"- Unknown owner rows: {len(unknown_rows)}")
    lines.append("")
    lines.append("## Register Rows by Module")
    for module, count in module_counter.most_common():
        lines.append(f"- {module}: {count}")
    lines.append("")
    lines.append("## Output Contract Rows by Module")
    for module, count in output_counter.most_common():
        lines.append(f"- {module}: {count}")
    lines.append("")
    lines.append("## Register Rows by Role")
    for role, count in role_counter.most_common():
        lines.append(f"- {role}: {count}")
    lines.append("")
    lines.append("## Review Flags")
    lines.append("- Legacy module rows should be reviewed before finalising v5.0 contracts.")
    lines.append("- Unknown owner rows should either be assigned to a module or accepted as shared utility/UI fields.")
    lines.append("- Output contract rows are the priority set for locked module briefs.")
    lines.append("- This file is source-code truth only. It does not prove that the brief contract is correct.")
    lines.append("")

    path.write_text("\n".join(lines), encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build Mirra module-level code contract register.")

    parser.add_argument(
        "--input",
        required=True,
        help="Path to MIRRA_CODE_CONTRACT_FIELDS_v5.0.csv",
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

    if not input_path.exists():
        raise SystemExit(f"Input file not found: {input_path}")

    rows = read_rows(input_path)

    if not rows:
        raise SystemExit(f"No rows found in input file: {input_path}")

    register_rows = build_register(rows)

    output_contract_rows = [
        row for row in register_rows
        if row.likely_role == "output_contract_field"
    ]

    write_rows(
        out_dir / "MIRRA_CODE_CONTRACT_REGISTER_BY_MODULE_v5.0.csv",
        register_rows,
    )

    write_rows(
        out_dir / "MIRRA_CODE_OUTPUT_CONTRACT_REGISTER_BY_MODULE_v5.0.csv",
        output_contract_rows,
    )

    write_summary(
        out_dir / "MIRRA_CODE_CONTRACT_REGISTER_SUMMARY_v5.0.txt",
        register_rows,
        output_contract_rows,
    )

    print(f"Input rows: {len(rows)}")
    print(f"Module contract register rows: {len(register_rows)}")
    print(f"Output contract register rows: {len(output_contract_rows)}")
    print(f"Wrote outputs to: {out_dir}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())