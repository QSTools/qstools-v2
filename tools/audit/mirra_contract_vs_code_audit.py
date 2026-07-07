#!/usr/bin/env python3
"""
Mirra Contract vs Code Audit
============================

Compares brief-side intended output contracts against code-side implemented
output contracts.

Inputs:
  docs/Audit/MIRRA_CODE_OUTPUT_CONTRACT_REGISTER_BY_MODULE_v5.0.csv
  docs/Audit/MIRRA_BRIEF_OUTPUT_CONTRACT_REGISTER_v5.0.csv

Outputs:
  docs/Audit/MIRRA_CONTRACT_VS_CODE_AUDIT_v5.0.csv
  docs/Audit/MIRRA_CONTRACT_VS_CODE_SUMMARY_v5.0.txt
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
class AuditRow:
    module_name: str
    variable_name: str
    audit_status: str
    code_present: str
    brief_present: str
    code_role: str
    brief_role: str
    code_files: str
    brief_files: str
    notes: str


def read_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        raise SystemExit(f"Input file not found: {path}")

    with path.open("r", newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def normalise_module(value: str) -> str:
    value = (value or "").strip()

    if not value:
        return "unknown"

    return value


def normalise_variable(value: str) -> str:
    return (value or "").strip()


def code_key(row: dict[str, str]) -> tuple[str, str]:
    return (
        normalise_module(row.get("module_name", row.get("module_hint", ""))),
        normalise_variable(row.get("variable_name", "")),
    )


def brief_key(row: dict[str, str]) -> tuple[str, str]:
    return (
        normalise_module(row.get("module_hint", row.get("module_name", ""))),
        normalise_variable(row.get("variable_name", "")),
    )


def join_unique(values: list[str], limit: int = 20) -> str:
    cleaned = sorted({value for value in values if value})

    return " | ".join(cleaned[:limit])


def build_lookup(rows: list[dict[str, str]], source: str) -> dict[tuple[str, str], list[dict[str, str]]]:
    lookup: dict[tuple[str, str], list[dict[str, str]]] = defaultdict(list)

    for row in rows:
        key = code_key(row) if source == "code" else brief_key(row)

        module, variable = key

        if not module or not variable:
            continue

        lookup[key].append(row)

    return lookup


def classify_status(
    key: tuple[str, str],
    code_lookup: dict[tuple[str, str], list[dict[str, str]]],
    brief_lookup: dict[tuple[str, str], list[dict[str, str]]],
) -> str:
    module, variable = key
    code_present = key in code_lookup
    brief_present = key in brief_lookup

    if code_present and brief_present:
        return "matched"

    if brief_present and not code_present:
        return "brief_only_missing_in_code"

    if code_present and not brief_present:
        if module.endswith("-legacy"):
            return "code_only_legacy_review"
        if module == "unknown":
            return "code_only_unknown_owner"
        return "code_only_not_in_brief"

    return "unknown"


def build_notes(status: str, module: str, variable: str) -> str:
    notes: list[str] = []

    if status == "matched":
        notes.append("brief_and_code_aligned")

    if status == "brief_only_missing_in_code":
        notes.append("intended_contract_not_currently_exposed_by_code")

    if status == "code_only_not_in_brief":
        notes.append("implemented_contract_not_documented_in_brief")

    if status == "code_only_legacy_review":
        notes.append("legacy_module_contract_still_present_in_code")

    if status == "code_only_unknown_owner":
        notes.append("code_contract_owner_needs_review")

    if module.endswith("-legacy"):
        notes.append("legacy_module")

    if module == "unknown":
        notes.append("unknown_owner")

    if variable.endswith("_status"):
        notes.append("status_field")

    if variable.endswith("_ready") or variable.startswith("is_") or variable == "model_ready":
        notes.append("readiness_field")

    if variable.endswith("_warnings"):
        notes.append("warnings_field")

    if variable.endswith("_trust_state") or variable == "model_trust_state":
        notes.append("trust_state_field")

    return " | ".join(notes)


def build_audit_rows(
    code_rows: list[dict[str, str]],
    brief_rows: list[dict[str, str]],
) -> list[AuditRow]:
    code_lookup = build_lookup(code_rows, "code")
    brief_lookup = build_lookup(brief_rows, "brief")

    all_keys = sorted(set(code_lookup.keys()) | set(brief_lookup.keys()))

    output: list[AuditRow] = []

    for key in all_keys:
        module, variable = key
        status = classify_status(key, code_lookup, brief_lookup)

        code_items = code_lookup.get(key, [])
        brief_items = brief_lookup.get(key, [])

        code_roles = join_unique([item.get("likely_role", "") for item in code_items])
        brief_roles = join_unique([item.get("likely_role", "") for item in brief_items])

        code_files = join_unique(
            [
                item.get("source_files", "")
                or item.get("file_path", "")
                or item.get("first_seen_file", "")
                for item in code_items
            ]
        )

        brief_files = join_unique(
            [
                item.get("file_path", "")
                or item.get("source_files", "")
                or item.get("first_seen_file", "")
                for item in brief_items
            ]
        )

        output.append(
            AuditRow(
                module_name=module,
                variable_name=variable,
                audit_status=status,
                code_present="yes" if code_items else "no",
                brief_present="yes" if brief_items else "no",
                code_role=code_roles,
                brief_role=brief_roles,
                code_files=code_files,
                brief_files=brief_files,
                notes=build_notes(status, module, variable),
            )
        )

    output.sort(
        key=lambda row: (
            row.module_name,
            row.audit_status,
            row.variable_name,
        )
    )

    return output


def write_audit_csv(path: Path, rows: list[AuditRow]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)

    fieldnames = [
        "module_name",
        "variable_name",
        "audit_status",
        "code_present",
        "brief_present",
        "code_role",
        "brief_role",
        "code_files",
        "brief_files",
        "notes",
    ]

    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()

        for row in rows:
            writer.writerow(asdict(row))


def write_summary(path: Path, rows: list[AuditRow], code_count: int, brief_count: int) -> None:
    status_counter = Counter(row.audit_status for row in rows)
    module_counter = Counter(row.module_name for row in rows)
    module_status_counter: dict[str, Counter[str]] = defaultdict(Counter)

    for row in rows:
        module_status_counter[row.module_name][row.audit_status] += 1

    matched_rows = [row for row in rows if row.audit_status == "matched"]
    missing_rows = [row for row in rows if row.audit_status == "brief_only_missing_in_code"]
    code_only_rows = [row for row in rows if row.audit_status == "code_only_not_in_brief"]
    legacy_rows = [row for row in rows if row.audit_status == "code_only_legacy_review"]
    unknown_rows = [row for row in rows if row.audit_status == "code_only_unknown_owner"]

    lines: list[str] = []

    lines.append("# Mirra Contract vs Code Audit Summary")
    lines.append("")
    lines.append(f"Generated: {datetime.now().isoformat(timespec='seconds')}")
    lines.append(f"Version: {VERSION}")
    lines.append("")
    lines.append("## Input")
    lines.append(f"- Code output contract rows: {code_count}")
    lines.append(f"- Brief output contract rows: {brief_count}")
    lines.append("")
    lines.append("## Audit Totals")
    lines.append(f"- Total audit rows: {len(rows)}")
    lines.append(f"- Matched: {len(matched_rows)}")
    lines.append(f"- Brief only / missing in code: {len(missing_rows)}")
    lines.append(f"- Code only / not in brief: {len(code_only_rows)}")
    lines.append(f"- Code only / legacy review: {len(legacy_rows)}")
    lines.append(f"- Code only / unknown owner: {len(unknown_rows)}")
    lines.append("")

    lines.append("## Audit Status Counts")
    for status, count in status_counter.most_common():
        lines.append(f"- {status}: {count}")
    lines.append("")

    lines.append("## Rows by Module")
    for module, count in module_counter.most_common():
        statuses = module_status_counter[module]
        status_text = ", ".join(f"{status}={count}" for status, count in statuses.most_common())
        lines.append(f"- {module}: {count} ({status_text})")
    lines.append("")

    lines.append("## Priority Review")
    lines.append("- First review `code_only_not_in_brief`: implemented fields that are not documented.")
    lines.append("- Then review `brief_only_missing_in_code`: intended fields not yet implemented.")
    lines.append("- Then review legacy code-only rows to decide whether they stay, move, or get renamed.")
    lines.append("- Unknown-owner code-only rows should either get a module owner or be marked shared/internal.")
    lines.append("")
    lines.append("## Important")
    lines.append("- This comparison only checks exact module + variable-name matches.")
    lines.append("- It does not yet detect likely renames, aliases, or same field names under different module owners.")
    lines.append("- The next pass can add fuzzy matching and alias mapping.")
    lines.append("")

    path.write_text("\n".join(lines), encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Compare Mirra brief output contracts against code output contracts.")

    parser.add_argument(
        "--code",
        required=True,
        help="Path to MIRRA_CODE_OUTPUT_CONTRACT_REGISTER_BY_MODULE_v5.0.csv",
    )

    parser.add_argument(
        "--brief",
        required=True,
        help="Path to MIRRA_BRIEF_OUTPUT_CONTRACT_REGISTER_v5.0.csv",
    )

    parser.add_argument(
        "--out",
        required=True,
        help="Output directory",
    )

    return parser.parse_args()


def main() -> int:
    args = parse_args()

    code_path = Path(args.code).resolve()
    brief_path = Path(args.brief).resolve()
    out_dir = Path(args.out).resolve()

    code_rows = read_csv(code_path)
    brief_rows = read_csv(brief_path)

    audit_rows = build_audit_rows(code_rows, brief_rows)

    audit_csv = out_dir / "MIRRA_CONTRACT_VS_CODE_AUDIT_v5.0.csv"
    summary_txt = out_dir / "MIRRA_CONTRACT_VS_CODE_SUMMARY_v5.0.txt"

    write_audit_csv(audit_csv, audit_rows)
    write_summary(summary_txt, audit_rows, len(code_rows), len(brief_rows))

    print(f"Code output contract rows: {len(code_rows)}")
    print(f"Brief output contract rows: {len(brief_rows)}")
    print(f"Audit rows: {len(audit_rows)}")
    print(f"Wrote: {audit_csv}")
    print(f"Wrote: {summary_txt}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())