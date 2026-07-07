#!/usr/bin/env python3
"""
Mirra Accepted Brief Addendum Builder
=====================================

Builds clean v5.0 module brief addendums from classified accepted fields only.

Input:
  docs/Audit/MIRRA_MODULE_BRIEF_CLASSIFIED_FIELDS_v5.0.csv

Outputs:
  docs/Audit/MIRRA_ACCEPTED_BRIEF_ADDENDUM_PACK_v5.0.txt
  docs/Audit/MIRRA_ACCEPTED_BRIEF_FIELDS_BY_MODULE_v5.0.csv
  docs/Audit/Accepted_Brief_Addendums_v5.0/<module>_ACCEPTED_BRIEF_ADDENDUM_v5.0.txt
"""

from __future__ import annotations

import argparse
import csv
from collections import Counter, defaultdict
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path


VERSION = "v5.0"

ACCEPTED_CLASSIFICATIONS = {
    "accept_contract_field",
    "accept_reference_wrapper",
}


@dataclass(frozen=True)
class AcceptedField:
    module_name: str
    variable_name: str
    classification: str
    recommended_action: str
    confidence: str
    reason: str
    code_files: str
    notes: str


def clean(value: str) -> str:
    return (value or "").strip()


def safe_file_name(value: str) -> str:
    value = clean(value).lower()
    value = value.replace("/", "-").replace("\\", "-").replace(" ", "-").replace("_", "-")
    allowed = "abcdefghijklmnopqrstuvwxyz0123456789-"
    return "".join(char for char in value if char in allowed).strip("-") or "unknown"


def read_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        raise SystemExit(f"Input file not found: {path}")

    with path.open("r", newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def build_accepted_fields(rows: list[dict[str, str]]) -> list[AcceptedField]:
    output: list[AcceptedField] = []

    for row in rows:
        classification = clean(row.get("classification", ""))

        if classification not in ACCEPTED_CLASSIFICATIONS:
            continue

        output.append(
            AcceptedField(
                module_name=clean(row.get("module_name", "")) or "unknown",
                variable_name=clean(row.get("variable_name", "")),
                classification=classification,
                recommended_action=clean(row.get("recommended_action", "")),
                confidence=clean(row.get("confidence", "")),
                reason=clean(row.get("reason", "")),
                code_files=clean(row.get("code_files", "")),
                notes=clean(row.get("notes", "")),
            )
        )

    output.sort(key=lambda item: (item.module_name, item.classification, item.variable_name.lower()))
    return output


def grouped_by_module(rows: list[AcceptedField]) -> dict[str, list[AcceptedField]]:
    grouped: dict[str, list[AcceptedField]] = defaultdict(list)

    for row in rows:
        grouped[row.module_name].append(row)

    return dict(sorted(grouped.items()))


def write_csv(path: Path, rows: list[AcceptedField]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)

    fieldnames = [
        "module_name",
        "variable_name",
        "classification",
        "recommended_action",
        "confidence",
        "reason",
        "code_files",
        "notes",
    ]

    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()

        for row in rows:
            writer.writerow(asdict(row))


def write_module_addendums(out_dir: Path, rows: list[AcceptedField]) -> None:
    addendum_dir = out_dir / "Accepted_Brief_Addendums_v5.0"
    addendum_dir.mkdir(parents=True, exist_ok=True)

    grouped = grouped_by_module(rows)

    for module_name, items in grouped.items():
        file_path = addendum_dir / f"{safe_file_name(module_name)}_ACCEPTED_BRIEF_ADDENDUM_v5.0.txt"

        contract_fields = [
            item for item in items if item.classification == "accept_contract_field"
        ]

        reference_wrappers = [
            item for item in items if item.classification == "accept_reference_wrapper"
        ]

        lines: list[str] = []

        lines.append(f"# Mirra {VERSION} - {module_name} Accepted Brief Addendum")
        lines.append("")
        lines.append("STATUS: ACCEPTED FROM SOURCE-CODE CONTRACT AUDIT")
        lines.append("")
        lines.append("PURPOSE")
        lines.append("")
        lines.append("Add accepted implemented source-code fields to the v5.0 module brief.")
        lines.append("")
        lines.append("RULES")
        lines.append("")
        lines.append("- Preserve exact variable names.")
        lines.append("- Do not rename during this pass.")
        lines.append("- Add accepted contract fields to the module output contract section.")
        lines.append("- Add accepted reference wrappers separately as wrapper/reference fields, not business metrics.")
        lines.append("- Do not add rejected helper/display fields.")
        lines.append("- Do not add manual-review fields until reviewed.")
        lines.append("")

        if contract_fields:
            lines.append("## Output Contract Fields To Add")
            lines.append("")

            for item in contract_fields:
                lines.append(f"### `{item.variable_name}`")
                lines.append("")
                lines.append(f"- Classification: `{item.classification}`")
                lines.append(f"- Recommended action: `{item.recommended_action}`")
                lines.append(f"- Confidence: `{item.confidence}`")
                lines.append(f"- Reason: {item.reason}")

                if item.code_files:
                    lines.append(f"- Source code file(s): {item.code_files}")

                if item.notes:
                    lines.append(f"- Audit notes: {item.notes}")

                lines.append("")
                lines.append("Brief insertion instruction:")
                lines.append("")
                lines.append(f"- Add `{item.variable_name}` to the `{module_name}` output contract.")
                lines.append("- Define owner, meaning, source, downstream consumers where known, current/live status, and review notes.")
                lines.append("")

        if reference_wrappers:
            lines.append("## Reference Wrapper Fields To Document Separately")
            lines.append("")

            for item in reference_wrappers:
                lines.append(f"### `{item.variable_name}`")
                lines.append("")
                lines.append(f"- Classification: `{item.classification}`")
                lines.append(f"- Recommended action: `{item.recommended_action}`")
                lines.append(f"- Confidence: `{item.confidence}`")
                lines.append(f"- Reason: {item.reason}")

                if item.code_files:
                    lines.append(f"- Source code file(s): {item.code_files}")

                if item.notes:
                    lines.append(f"- Audit notes: {item.notes}")

                lines.append("")
                lines.append("Brief insertion instruction:")
                lines.append("")
                lines.append(f"- Document `{item.variable_name}` as a wrapper/reference field for `{module_name}`.")
                lines.append("- Do not describe it as a business metric.")
                lines.append("- Identify what object it wraps and which modules consume it.")
                lines.append("")

        file_path.write_text("\n".join(lines), encoding="utf-8")


def write_pack(path: Path, rows: list[AcceptedField]) -> None:
    module_counter = Counter(row.module_name for row in rows)
    classification_counter = Counter(row.classification for row in rows)
    grouped = grouped_by_module(rows)

    lines: list[str] = []

    lines.append("# Mirra v5.0 Accepted Brief Addendum Pack")
    lines.append("")
    lines.append(f"Generated: {datetime.now().isoformat(timespec='seconds')}")
    lines.append(f"Version: {VERSION}")
    lines.append("")
    lines.append("## Purpose")
    lines.append("")
    lines.append("This pack contains only accepted implemented fields from the source-code contract audit.")
    lines.append("These fields are safe to use as the first v5.0 brief update pass.")
    lines.append("")
    lines.append("## Totals")
    lines.append("")
    lines.append(f"- Accepted fields total: {len(rows)}")
    lines.append(f"- Modules affected: {len(grouped)}")
    lines.append("")

    lines.append("## By Classification")
    for classification, count in classification_counter.most_common():
        lines.append(f"- {classification}: {count}")
    lines.append("")

    lines.append("## By Module")
    for module_name, count in module_counter.most_common():
        lines.append(f"- {module_name}: {count}")
    lines.append("")

    lines.append("## Module Field Lists")
    lines.append("")

    for module_name, items in grouped.items():
        lines.append(f"### {module_name}")
        lines.append("")

        contract_fields = [
            item.variable_name
            for item in items
            if item.classification == "accept_contract_field"
        ]

        reference_wrappers = [
            item.variable_name
            for item in items
            if item.classification == "accept_reference_wrapper"
        ]

        if contract_fields:
            lines.append("Contract fields:")
            for variable_name in contract_fields:
                lines.append(f"- `{variable_name}`")
            lines.append("")

        if reference_wrappers:
            lines.append("Reference wrappers:")
            for variable_name in reference_wrappers:
                lines.append(f"- `{variable_name}`")
            lines.append("")

    lines.append("## Next Step")
    lines.append("")
    lines.append("Update the v5.0 module briefs from these accepted addendums only.")
    lines.append("Then rerun brief extraction and contract-vs-code comparison.")
    lines.append("")

    path.write_text("\n".join(lines), encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build accepted Mirra v5.0 brief addendums.")

    parser.add_argument(
        "--input",
        required=True,
        help="Path to MIRRA_MODULE_BRIEF_CLASSIFIED_FIELDS_v5.0.csv",
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

    rows = read_csv(input_path)
    accepted_fields = build_accepted_fields(rows)

    write_csv(out_dir / "MIRRA_ACCEPTED_BRIEF_FIELDS_BY_MODULE_v5.0.csv", accepted_fields)
    write_pack(out_dir / "MIRRA_ACCEPTED_BRIEF_ADDENDUM_PACK_v5.0.txt", accepted_fields)
    write_module_addendums(out_dir, accepted_fields)

    print(f"Input rows: {len(rows)}")
    print(f"Accepted fields: {len(accepted_fields)}")
    print(f"Wrote: {out_dir / 'MIRRA_ACCEPTED_BRIEF_FIELDS_BY_MODULE_v5.0.csv'}")
    print(f"Wrote: {out_dir / 'MIRRA_ACCEPTED_BRIEF_ADDENDUM_PACK_v5.0.txt'}")
    print(f"Wrote module addendums to: {out_dir / 'Accepted_Brief_Addendums_v5.0'}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
