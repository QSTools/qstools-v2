#!/usr/bin/env python3
"""
Mirra Brief Variable Extract
============================

Scans Mirra module briefs / contract briefs / build briefs and extracts the
intended brief-side variable contract.

This is the brief-side equivalent of the source-code extractor.

Inputs:
  Folder containing .txt / .md brief files

Outputs:
  docs/Audit/MIRRA_BRIEF_VARIABLE_REGISTER_v5.0.csv
  docs/Audit/MIRRA_BRIEF_OUTPUT_CONTRACT_REGISTER_v5.0.csv
  docs/Audit/MIRRA_BRIEF_WARNING_REGISTER_v5.0.csv
  docs/Audit/MIRRA_BRIEF_STATUS_REGISTER_v5.0.csv
  docs/Audit/MIRRA_BRIEF_MODULE_SUMMARY_v5.0.txt

Run from repo root:

  python tools/audit/mirra_brief_variable_extract.py --source docs/Mirra_v5_Briefs --out docs/Audit

If your briefs are elsewhere:

  python tools/audit/mirra_brief_variable_extract.py --source docs --out docs/Audit
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from collections import Counter, defaultdict
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path
from typing import Iterable, Iterator


VERSION = "v5.0"

SOURCE_EXTENSIONS = {
    ".txt",
    ".md",
}

DEFAULT_EXCLUDE_DIRS = {
    ".git",
    ".next",
    "node_modules",
    "out",
    "dist",
    "build",
    ".venv",
    "venv",
    "__pycache__",
    "coverage",
    "reports",
}

REGISTER_BASENAME = "MIRRA_BRIEF_VARIABLE_REGISTER_v5.0"
OUTPUT_CONTRACT_BASENAME = "MIRRA_BRIEF_OUTPUT_CONTRACT_REGISTER_v5.0"
WARNING_BASENAME = "MIRRA_BRIEF_WARNING_REGISTER_v5.0"
STATUS_BASENAME = "MIRRA_BRIEF_STATUS_REGISTER_v5.0"
SUMMARY_BASENAME = "MIRRA_BRIEF_MODULE_SUMMARY_v5.0"
JSON_BASENAME = "MIRRA_BRIEF_VARIABLE_REGISTER_v5.0"


SNAKE_CASE_RE = re.compile(r"\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b")
CAMEL_CASE_RE = re.compile(r"\b[a-z][a-zA-Z0-9]*[A-Z][a-zA-Z0-9]*\b")
CONSTANT_RE = re.compile(r"\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+\b")

OUTPUT_CONTRACT_HEADING_RE = re.compile(
    r"(output_contract|output contract|downstream contract|handoff contract|module output)",
    re.IGNORECASE,
)

WARNING_HEADING_RE = re.compile(
    r"(warning|warnings|warning_id|warning ids|review flags|blocking warnings)",
    re.IGNORECASE,
)

STATUS_HEADING_RE = re.compile(
    r"(status|statuses|trust state|readiness|ready|blocked|review_required)",
    re.IGNORECASE,
)

INPUT_HEADING_RE = re.compile(
    r"(input|inputs|source input|user input|owned input)",
    re.IGNORECASE,
)

OWNER_HEADING_RE = re.compile(
    r"(owner|ownership|owned by|source owner|module owner)",
    re.IGNORECASE,
)

ARRAY_HEADING_RE = re.compile(
    r"(rows|array|arrays|row contract|table rows|register rows)",
    re.IGNORECASE,
)

WARNING_ID_RE = re.compile(
    r"\b[a-z][a-z0-9]*(?:_[a-z0-9]+)*_"
    r"(?:warning|missing|blocked|invalid|mismatch|leak|review|required|"
    r"not_available|preview_only|under_recovering|margin_shortfall|zero|"
    r"duplicate|unmapped|upstream_blocked|failed|shortfall|variance|"
    r"underutilisation|underutilization|gap|drift)[a-z0-9_]*\b"
)

STATUS_VALUE_RE = re.compile(
    r"\b("
    r"ready|ready_with_warnings|review_required|blocked|preview_only|not_ready|"
    r"not_available|under_recovering|margin_shortfall|negative_outcome|"
    r"negative_position|at_risk|covered|under_recovered|over_recovered|"
    r"balanced|rounding_only|variance_review|leak_detected|active|approved|"
    r"pending_review|synced|failed|pass|pass_with_warnings|unmatched|"
    r"target_selected|not_reviewed"
    r")\b"
)

MODULE_PATTERNS = [
    (
        "business-setup",
        [
            "business setup",
            "business-setup",
            "business_setup",
            "setup_completed",
            "business_type",
        ],
    ),
    (
        "p-and-l",
        [
            "p&l",
            "p and l",
            "p-and-l",
            "profit and loss",
            "profit_and_loss",
            "pnl_",
            "pnl output",
            "pnl_output_contract",
        ],
    ),
    (
        "revenue-cogs",
        [
            "revenue / cogs",
            "revenue and cogs",
            "revenue-cogs",
            "revenue_cogs",
            "cogs",
            "cost of goods",
            "cost of sales",
            "direct_cost",
            "gross_margin",
        ],
    ),
    (
        "labour",
        [
            "labour",
            "labor",
            "staff",
            "productive hours",
            "productive labour",
            "labour_output_contract",
        ],
    ),
    (
        "assets",
        [
            "assets",
            "asset",
            "productive asset",
            "asset_output_contract",
            "asset reality",
        ],
    ),
    (
        "general-overheads",
        [
            "general overheads",
            "general overhead",
            "general-overheads",
            "general_overheads",
            "business overheads",
            "total_business_overheads",
        ],
    ),
    (
        "employee-overheads-legacy",
        [
            "employee overheads",
            "employee-overheads",
            "employee_overheads",
        ],
    ),
    (
        "module-reconciliation",
        [
            "module reconciliation",
            "module-reconciliation",
            "reconciliation",
            "variance",
            "leak_detected",
        ],
    ),
    (
        "model-readiness",
        [
            "model readiness",
            "model-readiness",
            "model_readiness",
            "model trust",
            "model_trust_state",
            "model_ready",
        ],
    ),
    (
        "opening-hours",
        [
            "opening hours",
            "opening-hours",
            "opening_hours",
            "business open hours",
            "net_annual_business_open_hours",
        ],
    ),
    (
        "cost-summary",
        [
            "cost summary",
            "cost-summary",
            "cost_summary",
            "total_cost_burden",
            "required_recovery_rate",
        ],
    ),
    (
        "business-summary",
        [
            "business summary",
            "business-summary",
            "business_summary",
            "net_position",
            "margin_pool",
        ],
    ),
    (
        "revenue-reality",
        [
            "revenue reality",
            "revenue-reality",
            "revenue_reality",
            "margin_after_labour",
        ],
    ),
    (
        "asset-reality",
        [
            "asset reality",
            "asset-reality",
            "asset_reality",
            "asset underutilisation",
            "asset underutilization",
        ],
    ),
    (
        "cost-allocation",
        [
            "cost allocation",
            "cost-allocation",
            "cost_allocation",
            "working group",
            "working groups",
            "allocation_status",
        ],
    ),
    (
        "recovery-summary",
        [
            "recovery summary",
            "recovery-summary",
            "recovery_summary",
            "component_required_recovery",
        ],
    ),
    (
        "rate-builder",
        [
            "rate builder",
            "rate-builder",
            "rate_builder",
            "minimum_recoverable_rate",
            "suggested sell rate",
        ],
    ),
    (
        "business-outcome",
        [
            "business outcome",
            "business-outcome",
            "business_outcome",
            "outcome",
        ],
    ),
    (
        "business-modelling",
        [
            "business modelling",
            "business modeling",
            "business-modelling",
            "business_modeling",
            "business_modelling",
            "target model",
            "selected_target_model",
            "quote_checker_target_set",
        ],
    ),
    (
        "quote-checker",
        [
            "quote checker",
            "quote-checker",
            "quote_checker",
            "quote check",
        ],
    ),
    (
        "soq-job-po",
        [
            "soq",
            "job po",
            "job / po",
            "purchase order",
            "work order",
        ],
    ),
    (
        "job-costing",
        [
            "job costing",
            "job-costing",
            "job profitability",
            "profitability",
        ],
    ),
    (
        "model-feedback",
        [
            "model feedback",
            "feedback loop",
            "model-feedback",
        ],
    ),
    (
        "model-review",
        [
            "model review",
            "model approval",
            "approval",
        ],
    ),
    (
        "data-quality",
        [
            "data quality",
            "data-quality",
            "quality dashboard",
        ],
    ),
    (
        "reporting-analytics",
        [
            "reporting",
            "analytics",
            "power bi",
        ],
    ),
    (
        "database-storage-export",
        [
            "database",
            "storage",
            "export",
            "persistence",
        ],
    ),
    (
        "integrations",
        [
            "integrations",
            "integration",
            "xero",
            "api",
            "connector",
            "sync",
        ],
    ),
    (
        "macro-micro",
        [
            "macro",
            "micro",
            "macro layer",
            "micro layer",
        ],
    ),
]


@dataclass(frozen=True)
class BriefVariableRecord:
    file_path: str
    file_name: str
    line_number: int
    module_hint: str
    variable_name: str
    variable_style: str
    likely_role: str
    section_hint: str
    context: str


def normalise_space(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def variable_style(name: str) -> str:
    if CONSTANT_RE.fullmatch(name):
        return "constant"

    if SNAKE_CASE_RE.fullmatch(name):
        return "snake_case"

    if CAMEL_CASE_RE.fullmatch(name):
        return "camelCase"

    if name[:1].isupper():
        return "PascalCase"

    return "plain"


def detect_module_hint(path: Path, variable_name: str = "", context: str = "") -> str:
    text = f"{path.name} {path.stem} {path} {variable_name} {context}".replace("\\", "/").lower()

    for module_name, patterns in MODULE_PATTERNS:
        if any(pattern.lower() in text for pattern in patterns):
            return module_name

    return "unknown"


def detect_section_hint(line: str, current_section: str) -> str:
    cleaned = line.strip().strip("#").strip().lower()

    if not cleaned:
        return current_section

    if OUTPUT_CONTRACT_HEADING_RE.search(cleaned):
        return "output_contract"

    if WARNING_HEADING_RE.search(cleaned):
        return "warnings"

    if STATUS_HEADING_RE.search(cleaned):
        return "status_readiness_trust"

    if INPUT_HEADING_RE.search(cleaned):
        return "inputs"

    if OWNER_HEADING_RE.search(cleaned):
        return "ownership"

    if ARRAY_HEADING_RE.search(cleaned):
        return "row_or_array_contract"

    if cleaned.startswith("formula") or "calculation" in cleaned:
        return "calculation"

    if cleaned.startswith("downstream") or "consumes" in cleaned or "consumer" in cleaned:
        return "downstream_consumption"

    return current_section


def likely_role(name: str, line: str, section_hint: str, context: str) -> str:
    haystack = f"{name} {line} {section_hint} {context}".lower()

    if "output_contract" in haystack or section_hint == "output_contract":
        return "output_contract_field"

    if WARNING_ID_RE.fullmatch(name) or "warning_id" in haystack or section_hint == "warnings":
        return "warning_id"

    if name.endswith("_status") or name == "status" or section_hint == "status_readiness_trust":
        if name.endswith("_trust_state") or name == "model_trust_state":
            return "trust_state_field"

        if name.endswith("_warnings"):
            return "warnings_field"

        if name.endswith("_ready") or name == "model_ready":
            return "readiness_field"

        if name.endswith("_status") or name in {"ready", "blocked", "review_required", "not_ready"}:
            return "status_field"

        return "status_or_readiness_field"

    if name.endswith("_trust_state") or name == "model_trust_state":
        return "trust_state_field"

    if name.endswith("_warnings") or name == "warnings":
        return "warnings_field"

    if name.endswith("_ready") or name == "model_ready" or name.startswith("is_") or name.startswith("has_"):
        return "readiness_field"

    if section_hint == "inputs":
        return "input_field"

    if section_hint == "row_or_array_contract":
        return "row_or_array_field"

    if section_hint == "calculation":
        return "calculation_field"

    if section_hint == "downstream_consumption":
        return "downstream_consumed_field"

    return "brief_variable"


def nearby_context(lines: list[str], index: int, radius: int = 2) -> str:
    start = max(0, index - radius)
    end = min(len(lines), index + radius + 1)

    return normalise_space(" ".join(line.strip() for line in lines[start:end] if line.strip()))[:700]


def should_scan(path: Path, source_root: Path) -> bool:
    if path.suffix.lower() not in SOURCE_EXTENSIONS:
        return False

    try:
        rel_parts = path.relative_to(source_root).parts
    except ValueError:
        rel_parts = path.parts

    if any(part in DEFAULT_EXCLUDE_DIRS for part in rel_parts):
        return False

    return True


def iter_source_files(source_root: Path) -> Iterator[Path]:
    for path in sorted(source_root.rglob("*")):
        if path.is_file() and should_scan(path, source_root):
            yield path


def add_record(
    records: list[BriefVariableRecord],
    path: Path,
    source_root: Path,
    line_number: int,
    name: str,
    line: str,
    section_hint: str,
    context: str,
) -> None:
    if not name:
        return

    if name in {
        "true",
        "false",
        "null",
        "undefined",
        "ready",
        "blocked",
        "active",
        "approved",
    }:
        pass

    try:
        rel_path = str(path.relative_to(source_root))
    except ValueError:
        rel_path = str(path)

    records.append(
        BriefVariableRecord(
            file_path=rel_path,
            file_name=path.name,
            line_number=line_number,
            module_hint=detect_module_hint(path, name, context),
            variable_name=name,
            variable_style=variable_style(name),
            likely_role=likely_role(name, line, section_hint, context),
            section_hint=section_hint,
            context=context,
        )
    )


def extract_from_file(path: Path, source_root: Path) -> list[BriefVariableRecord]:
    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        text = path.read_text(encoding="utf-8", errors="replace")

    lines = text.splitlines()
    records: list[BriefVariableRecord] = []
    current_section = ""

    for index, line in enumerate(lines):
        stripped = line.strip()

        if not stripped:
            continue

        if stripped.startswith("#") or stripped.isupper() or stripped.endswith(":"):
            current_section = detect_section_hint(stripped, current_section)

        context = nearby_context(lines, index)

        for match in SNAKE_CASE_RE.finditer(line):
            add_record(
                records=records,
                path=path,
                source_root=source_root,
                line_number=index + 1,
                name=match.group(0),
                line=line,
                section_hint=current_section,
                context=context,
            )

        for match in WARNING_ID_RE.finditer(line):
            add_record(
                records=records,
                path=path,
                source_root=source_root,
                line_number=index + 1,
                name=match.group(0),
                line=line,
                section_hint="warnings",
                context=context,
            )

        for match in STATUS_VALUE_RE.finditer(line):
            add_record(
                records=records,
                path=path,
                source_root=source_root,
                line_number=index + 1,
                name=match.group(1),
                line=line,
                section_hint="status_readiness_trust",
                context=context,
            )

    return records


def dedupe_records(records: Iterable[BriefVariableRecord]) -> list[BriefVariableRecord]:
    seen: set[tuple[str, int, str, str]] = set()
    output: list[BriefVariableRecord] = []

    for record in records:
        key = (
            record.file_path,
            record.line_number,
            record.variable_name,
            record.likely_role,
        )

        if key not in seen:
            seen.add(key)
            output.append(record)

    return output


def read_all_records(source: Path) -> tuple[list[BriefVariableRecord], int]:
    files = list(iter_source_files(source))
    records: list[BriefVariableRecord] = []

    for path in files:
        records.extend(extract_from_file(path, source))

    return dedupe_records(records), len(files)


def write_csv(path: Path, rows: list[BriefVariableRecord]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)

    fieldnames = [
        "file_path",
        "file_name",
        "line_number",
        "module_hint",
        "variable_name",
        "variable_style",
        "likely_role",
        "section_hint",
        "context",
    ]

    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()

        for row in rows:
            writer.writerow(asdict(row))


def write_json(path: Path, rows: list[BriefVariableRecord], source: Path, file_count: int) -> None:
    payload = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "version": VERSION,
        "source": str(source),
        "scanned_files": file_count,
        "record_count": len(rows),
        "unique_variable_count": len({row.variable_name for row in rows}),
        "records": [asdict(row) for row in rows],
    }

    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


def filtered(rows: list[BriefVariableRecord], roles: set[str]) -> list[BriefVariableRecord]:
    output = [row for row in rows if row.likely_role in roles]

    output.sort(
        key=lambda row: (
            row.module_hint,
            row.variable_name,
            row.file_path,
            row.line_number,
        )
    )

    return output


def write_summary(path: Path, rows: list[BriefVariableRecord], file_count: int, source: Path) -> None:
    module_counter = Counter(row.module_hint for row in rows)
    role_counter = Counter(row.likely_role for row in rows)
    section_counter = Counter(row.section_hint or "unclassified" for row in rows)
    style_counter = Counter(row.variable_style for row in rows)

    unique_by_module: dict[str, set[str]] = defaultdict(set)

    for row in rows:
        unique_by_module[row.module_hint].add(row.variable_name)

    output_contract_rows = [row for row in rows if row.likely_role == "output_contract_field"]
    warning_rows = [row for row in rows if row.likely_role == "warning_id"]
    status_rows = [
        row for row in rows
        if row.likely_role in {
            "status_field",
            "trust_state_field",
            "readiness_field",
            "warnings_field",
            "status_or_readiness_field",
        }
    ]

    lines: list[str] = []

    lines.append("# Mirra Brief Variable Summary")
    lines.append("")
    lines.append(f"Generated: {datetime.now().isoformat(timespec='seconds')}")
    lines.append(f"Version: {VERSION}")
    lines.append(f"Source: {source}")
    lines.append("")
    lines.append("## Totals")
    lines.append(f"- Scanned brief files: {file_count}")
    lines.append(f"- Extracted brief variable rows: {len(rows)}")
    lines.append(f"- Unique brief variables: {len({row.variable_name for row in rows})}")
    lines.append(f"- Brief output contract rows: {len(output_contract_rows)}")
    lines.append(f"- Brief warning rows: {len(warning_rows)}")
    lines.append(f"- Brief status / trust / readiness rows: {len(status_rows)}")
    lines.append("")

    lines.append("## Rows by Module")
    for module, count in module_counter.most_common():
        lines.append(f"- {module}: {count} rows / {len(unique_by_module[module])} unique variables")
    lines.append("")

    lines.append("## Rows by Role")
    for role, count in role_counter.most_common():
        lines.append(f"- {role}: {count}")
    lines.append("")

    lines.append("## Rows by Section")
    for section, count in section_counter.most_common():
        lines.append(f"- {section}: {count}")
    lines.append("")

    lines.append("## Rows by Naming Style")
    for style, count in style_counter.most_common():
        lines.append(f"- {style}: {count}")
    lines.append("")

    lines.append("## Next Review")
    lines.append("- Check that only current Mirra v5.0 briefs are included in the source folder.")
    lines.append("- If old QS Tools/v4.0 briefs are included, results will contain legacy drift.")
    lines.append("- Compare this brief register against MIRRA_CODE_OUTPUT_CONTRACT_REGISTER_BY_MODULE_v5.0.csv.")
    lines.append("")

    path.write_text("\n".join(lines), encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Extract variables from Mirra brief files.")

    parser.add_argument(
        "--source",
        required=True,
        help="Folder containing Mirra brief .txt/.md files.",
    )

    parser.add_argument(
        "--out",
        required=True,
        help="Output directory.",
    )

    return parser.parse_args()


def main() -> int:
    args = parse_args()

    source = Path(args.source).resolve()
    out = Path(args.out).resolve()

    if not source.exists() or not source.is_dir():
        raise SystemExit(f"Source folder not found: {source}")

    rows, file_count = read_all_records(source)

    rows.sort(
        key=lambda row: (
            row.module_hint,
            row.file_path,
            row.line_number,
            row.variable_name,
        )
    )

    output_contract_rows = filtered(rows, {"output_contract_field"})
    warning_rows = filtered(rows, {"warning_id"})
    status_rows = filtered(
        rows,
        {
            "status_field",
            "trust_state_field",
            "readiness_field",
            "warnings_field",
            "status_or_readiness_field",
        },
    )

    write_csv(out / f"{REGISTER_BASENAME}.csv", rows)
    write_csv(out / f"{OUTPUT_CONTRACT_BASENAME}.csv", output_contract_rows)
    write_csv(out / f"{WARNING_BASENAME}.csv", warning_rows)
    write_csv(out / f"{STATUS_BASENAME}.csv", status_rows)
    write_json(out / f"{JSON_BASENAME}.json", rows, source, file_count)
    write_summary(out / f"{SUMMARY_BASENAME}.txt", rows, file_count, source)

    print(f"Scanned brief files: {file_count}")
    print(f"Extracted brief variable rows: {len(rows)}")
    print(f"Unique brief variables: {len({row.variable_name for row in rows})}")
    print(f"Brief output contract rows: {len(output_contract_rows)}")
    print(f"Brief warning rows: {len(warning_rows)}")
    print(f"Brief status / trust / readiness rows: {len(status_rows)}")
    print(f"Wrote outputs to: {out}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())