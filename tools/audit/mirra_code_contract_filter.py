#!/usr/bin/env python3
"""
Mirra Code Contract Filter
==========================

Reads MIRRA_CODE_VARIABLE_REGISTER_v5.0.csv and filters it down to the useful
contract-level fields.

Input:
  docs/Audit/MIRRA_CODE_VARIABLE_REGISTER_v5.0.csv

Outputs:
  docs/Audit/MIRRA_CODE_CONTRACT_FIELDS_v50.csv
  docs/Audit/MIRRA_CODE_OUTPUT_CONTRACT_FIELDS_v5.0.csv
  docs/Audit/MIRRA_CODE_WARNING_IDS_v5.0.csv
  docs/Audit/MIRRA_CODE_STATUS_TRUST_FIELDS_v5.0.csv
  docs/Audit/MIRRA_CODE_MODULE_FIELD_SUMMARY_v5.0.txt
"""

from __future__ import annotations

import argparse
import csv
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path


CONTRACT_ROLES = {
    "output_contract_field",
    "status_field",
    "trust_state_field",
    "warnings_field",
    "readiness_field",
    "warning_id",
    "consumed_field",
    "object_field",
}

OUTPUT_CONTRACT_ROLES = {
    "output_contract_field",
}

WARNING_ROLES = {
    "warning_id",
}

STATUS_TRUST_ROLES = {
    "status_field",
    "trust_state_field",
    "warnings_field",
    "readiness_field",
}


def read_rows(path: Path) -> list[dict[str, str]]:
    with path.open("r", newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        return list(reader)


def write_rows(path: Path, rows: list[dict[str, str]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)

    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()

        for row in rows:
            writer.writerow({field: row.get(field, "") for field in fieldnames})


def unique_rows(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    seen: set[tuple[str, str, str, str, str]] = set()
    output: list[dict[str, str]] = []

    for row in rows:
        key = (
            row.get("module_hint", ""),
            row.get("variable_name", ""),
            row.get("likely_role", ""),
            row.get("file_path", ""),
            row.get("line_number", ""),
        )

        if key in seen:
            continue

        seen.add(key)
        output.append(row)

    return output


def likely_is_noise(row: dict[str, str]) -> bool:
    name = row.get("variable_name", "")
    role = row.get("likely_role", "")
    extraction_type = row.get("extraction_type", "")

    noisy_names = {
        "useState",
        "useEffect",
        "useMemo",
        "React",
        "Fragment",
        "console",
        "Math",
        "Number",
        "String",
        "Array",
        "Object",
        "Date",
        "JSON",
        "className",
        "style",
        "children",
        "label",
        "value",
        "title",
        "message",
        "description",
        "index",
        "item",
        "row",
        "rows",
        "card",
        "section",
        "data",
        "raw",
        "parsed",
        "error",
        "loading",
        "disabled",
    }

    if name in noisy_names and role not in {
        "output_contract_field",
        "status_field",
        "trust_state_field",
        "warnings_field",
        "readiness_field",
        "warning_id",
    }:
        return True

    if extraction_type in {"import", "function", "export_function"}:
        return True

    return False


def filter_rows(rows: list[dict[str, str]], role_set: set[str]) -> list[dict[str, str]]:
    filtered = [
        row for row in rows
        if row.get("likely_role", "") in role_set and not likely_is_noise(row)
    ]

    return unique_rows(filtered)


def write_summary(
    path: Path,
    all_rows: list[dict[str, str]],
    contract_rows: list[dict[str, str]],
    output_rows: list[dict[str, str]],
    warning_rows: list[dict[str, str]],
    status_rows: list[dict[str, str]],
) -> None:
    module_counter = Counter(row.get("module_hint", "") or "unknown" for row in contract_rows)
    role_counter = Counter(row.get("likely_role", "") for row in contract_rows)
    area_counter = Counter(row.get("source_area", "") for row in contract_rows)

    fields_by_module: dict[str, set[str]] = defaultdict(set)

    for row in contract_rows:
        module = row.get("module_hint", "") or "unknown"
        fields_by_module[module].add(row.get("variable_name", ""))

    lines: list[str] = []

    lines.append("# Mirra Code Contract Field Summary")
    lines.append("")
    lines.append(f"Generated: {datetime.now().isoformat(timespec='seconds')}")
    lines.append("")
    lines.append("## Input")
    lines.append(f"- Full source-code register rows: {len(all_rows)}")
    lines.append("")
    lines.append("## Filtered Outputs")
    lines.append(f"- Contract field rows: {len(contract_rows)}")
    lines.append(f"- Output contract rows: {len(output_rows)}")
    lines.append(f"- Warning ID rows: {len(warning_rows)}")
    lines.append(f"- Status / trust / readiness rows: {len(status_rows)}")
    lines.append("")
    lines.append("## Contract Rows by Role")
    for role, count in role_counter.most_common():
        lines.append(f"- {role}: {count}")
    lines.append("")
    lines.append("## Contract Rows by Source Area")
    for area, count in area_counter.most_common():
        lines.append(f"- {area}: {count}")
    lines.append("")
    lines.append("## Contract Rows by Module Hint")
    for module, count in module_counter.most_common():
        lines.append(f"- {module}: {count} rows / {len(fields_by_module[module])} unique fields")
    lines.append("")
    lines.append("## Module Field Counts")
    for module in sorted(fields_by_module):
        lines.append(f"- {module}: {len(fields_by_module[module])} unique fields")
    lines.append("")
    lines.append("## Next Review")
    lines.append("- Review unknown module rows first.")
    lines.append("- Review output_contract fields by module.")
    lines.append("- Review warning IDs for old QS Tools naming or stale module ownership.")
    lines.append("- Compare filtered contract fields against the locked v5.0 brief variables.")
    lines.append("")

    path.write_text("\n".join(lines), encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Filter Mirra code variable register to contract fields.")

    parser.add_argument(
        "--input",
        required=True,
        help="Path to MIRRA_CODE_VARIABLE_REGISTER_v5.0.csv",
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

    fieldnames = list(rows[0].keys())

    contract_rows = filter_rows(rows, CONTRACT_ROLES)
    output_rows = filter_rows(rows, OUTPUT_CONTRACT_ROLES)
    warning_rows = filter_rows(rows, WARNING_ROLES)
    status_rows = filter_rows(rows, STATUS_TRUST_ROLES)

    contract_rows.sort(key=lambda r: (r.get("module_hint", ""), r.get("variable_name", ""), r.get("file_path", ""), r.get("line_number", "")))
    output_rows.sort(key=lambda r: (r.get("module_hint", ""), r.get("variable_name", ""), r.get("file_path", ""), r.get("line_number", "")))
    warning_rows.sort(key=lambda r: (r.get("module_hint", ""), r.get("variable_name", ""), r.get("file_path", ""), r.get("line_number", "")))
    status_rows.sort(key=lambda r: (r.get("module_hint", ""), r.get("variable_name", ""), r.get("file_path", ""), r.get("line_number", "")))

    write_rows(out_dir / "MIRRA_CODE_CONTRACT_FIELDS_v5.0.csv", contract_rows, fieldnames)
    write_rows(out_dir / "MIRRA_CODE_OUTPUT_CONTRACT_FIELDS_v5.0.csv", output_rows, fieldnames)
    write_rows(out_dir / "MIRRA_CODE_WARNING_IDS_v5.0.csv", warning_rows, fieldnames)
    write_rows(out_dir / "MIRRA_CODE_STATUS_TRUST_FIELDS_v5.0.csv", status_rows, fieldnames)

    write_summary(
        out_dir / "MIRRA_CODE_MODULE_FIELD_SUMMARY_v5.0.txt",
        rows,
        contract_rows,
        output_rows,
        warning_rows,
        status_rows,
    )

    print(f"Read rows: {len(rows)}")
    print(f"Contract field rows: {len(contract_rows)}")
    print(f"Output contract rows: {len(output_rows)}")
    print(f"Warning ID rows: {len(warning_rows)}")
    print(f"Status / trust / readiness rows: {len(status_rows)}")
    print(f"Wrote outputs to: {out_dir}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())