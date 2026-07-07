#!/usr/bin/env python3
"""
Mirra Code Variable Extract
===========================

Scans actual Mirra source files and extracts a first-pass source-code register of:

- variables
- object keys
- output_contract references
- warning IDs
- status values
- readiness fields
- trust-state fields
- imports / exports / functions
- destructured consumed fields

This scans source scripts, not brief documents.

Run from repo root:

  python tools/audit/mirra_variable_extract.py --source . --out docs/Audit

Outputs:

  docs/Audit/MIRRA_CODE_VARIABLE_REGISTER_v4.0.csv
  docs/Audit/MIRRA_CODE_VARIABLE_REGISTER_v4.0.json
  docs/Audit/MIRRA_CODE_VARIABLE_SUMMARY_v4.0.txt
  docs/Audit/MIRRA_CODE_DUPLICATE_REVIEW_v4.0.csv
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


SCRIPT_VERSION = "v1.1"

SOURCE_EXTENSIONS = {
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
}

DEFAULT_INCLUDE_DIRS = [
    "app",
    "components",
    "hooks",
    "lib",
    "data",
    "context",
    "store",
    "utils",
]

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
}

REGISTER_BASENAME = "MIRRA_CODE_VARIABLE_REGISTER_v5.0"
SUMMARY_BASENAME = "MIRRA_CODE_VARIABLE_SUMMARY_v5.0"
DUPLICATE_BASENAME = "MIRRA_CODE_DUPLICATE_REVIEW_v5.0"


SNAKE_CASE_RE = re.compile(r"\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b")
CAMEL_CASE_RE = re.compile(r"\b[a-z][a-zA-Z0-9]*[A-Z][a-zA-Z0-9]*\b")
CONSTANT_RE = re.compile(r"\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+\b")

OBJECT_KEY_RE = re.compile(r"(?P<key>[A-Za-z_$][A-Za-z0-9_$]*)\s*:")
QUOTED_OBJECT_KEY_RE = re.compile(r"['\"](?P<key>[A-Za-z_$][A-Za-z0-9_$]*)['\"]\s*:")
DESTRUCTURE_RE = re.compile(r"(?:const|let|var)\s*\{(?P<body>[^}]+)\}\s*=")
ARRAY_DESTRUCTURE_RE = re.compile(r"(?:const|let|var)\s*\[(?P<body>[^\]]+)\]\s*=")
DECLARATION_RE = re.compile(r"\b(?:const|let|var)\s+(?P<name>[A-Za-z_$][A-Za-z0-9_$]*)")
FUNCTION_RE = re.compile(r"\bfunction\s+(?P<name>[A-Za-z_$][A-Za-z0-9_$]*)\s*\(")
ARROW_FUNCTION_RE = re.compile(
    r"\b(?:const|let|var)\s+(?P<name>[A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(?:\([^)]*\)|[A-Za-z_$][A-Za-z0-9_$]*)\s*=>"
)
EXPORT_FUNCTION_RE = re.compile(
    r"\bexport\s+(?:default\s+)?function\s+(?P<name>[A-Za-z_$][A-Za-z0-9_$]*)\s*\("
)
IMPORT_RE = re.compile(r"^\s*import\s+(?P<body>.+?)\s+from\s+['\"](?P<source>.+?)['\"]")
LOCAL_STORAGE_RE = re.compile(
    r"\blocalStorage\.(?:getItem|setItem|removeItem)\(\s*['\"](?P<key>[^'\"]+)['\"]"
)
OUTPUT_CONTRACT_RE = re.compile(r"\boutput_contract\b")

WARNING_ID_RE = re.compile(
    r"\b[a-z][a-z0-9]*(?:_[a-z0-9]+)*_"
    r"(?:warning|missing|blocked|invalid|mismatch|leak|review|required|"
    r"not_available|preview_only|under_recovering|margin_shortfall|zero|"
    r"duplicate|unmapped|upstream_blocked|failed|shortfall|variance|"
    r"underutilisation|underutilization|gap|drift)[a-z0-9_]*\b"
)

STATUS_VALUE_RE = re.compile(
    r"['\"](?P<status>"
    r"ready|ready_with_warnings|review_required|blocked|preview_only|not_ready|"
    r"not_available|under_recovering|margin_shortfall|negative_outcome|"
    r"negative_position|at_risk|covered|under_recovered|over_recovered|"
    r"balanced|rounding_only|variance_review|leak_detected|active|approved|"
    r"pending_review|synced|failed|pass|pass_with_warnings|unmatched|"
    r"target_selected|not_reviewed"
    r")['\"]"
)


@dataclass(frozen=True)
class CodeVariableRecord:
    file_path: str
    file_name: str
    source_area: str
    line_number: int
    variable_name: str
    variable_style: str
    extraction_type: str
    likely_role: str
    module_hint: str
    context: str


@dataclass(frozen=True)
class DuplicateCodeRecord:
    variable_name: str
    occurrence_count: int
    file_count: int
    source_areas: str
    extraction_types: str
    likely_roles: str
    module_hints: str
    files: str
    review_reason: str


def normalise_space(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def detect_source_area(path: Path) -> str:
    parts = path.parts

    for area in DEFAULT_INCLUDE_DIRS:
        if area in parts:
            return area

    return parts[0] if parts else ""


def detect_module_hint(path: Path, variable_name: str = "") -> str:
    text = str(path).replace("\\", "/").lower()
    stem = path.stem.lower()
    combined = f"{text} {stem} {variable_name}".lower()

    module_patterns = [
        (
            "business-setup",
            [
                "business-setup",
                "businesssetup",
                "usebusinesssetup",
                "business_setup_",
                "setup_completed",
            ],
        ),
        (
            "p-and-l",
            [
                "p-and-l",
                "pnl",
                "profitandloss",
                "profit-and-loss",
                "profit_and_loss",
                "pnl_",
                "pnloutput",
                "pnl_output_contract",
                "profitandlossstorage",
                "profitandlossselectors",
                "profitandlosscalculations",
                "profitandlossprofilestorage",
            ],
        ),
        (
            "revenue-cogs",
            [
                "revenue-cogs",
                "revenuecogs",
                "revenue_cogs",
                "xero-cog",
                "xerocog",
                "cogimport",
                "cog_import",
                "cog_",
                "revenue_cogs_",
                "revenue_cogs_output_contract",
                "direct_cost_",
                "direct_cost_category",
                "total_direct_costs",
                "gross_margin_percent",
            ],
        ),
        (
            "labour",
            [
                "labour",
                "labor",
                "labour_",
                "labour_output_contract",
                "staff_",
                "active_staff",
                "staff_name",
                "productive_labour",
                "total_labour_cost_annual",
                "total_productive_output",
                "productive_hours",
            ],
        ),
        (
            "assets",
            [
                "assets",
                "asset",
                "asset_",
                "assets_",
                "asset_output_contract",
                "productive_asset",
                "total_asset_cost_annual",
                "assets_ready",
            ],
        ),
        (
            "general-overheads",
            [
                "general-overheads",
                "generaloverheads",
                "general-overhead",
                "generaloverhead",
                "general_overheads",
                "general_overhead",
                "generaloverheadstorage",
                "general_overheads_output_contract",
                "overhead_",
                "overheads_",
                "total_business_overheads",
                "overhead_category_overrides",
            ],
        ),
        (
            "employee-overheads-legacy",
            [
                "employeeoverhead",
                "employee-overhead",
                "employee_overhead",
                "employeeoverheadprofilestorage",
            ],
        ),
        (
            "module-reconciliation",
            [
                "module-reconciliation",
                "modulereconciliation",
                "reconciliation",
                "reconciliationrules",
                "reconciliation_",
                "model_reconciliation",
                "warning_checks",
                "blocking_checks",
                "variance_review",
                "leak_detected",
                "audit_location",
            ],
        ),
        (
            "model-readiness",
            [
                "model-readiness",
                "modelreadiness",
                "model_readiness",
                "model_ready",
                "model_trust_state",
                "model_readiness_status",
                "model_readiness_",
                "blocking_modules",
                "warning_modules",
                "modelreadinessauditpanel",
                "modelreadinessvariancebreakdown",
            ],
        ),
        (
            "opening-hours",
            [
                "opening-hours",
                "openinghours",
                "opening_hours",
                "openinghourscalculations",
                "openinghoursstorage",
                "net_annual_business_open_hours",
                "macro_required_operating_hour_rate",
                "is_open",
            ],
        ),
        (
            "cost-summary",
            [
                "cost-summary",
                "costsummary",
                "cost_summary",
                "cost_summary_output_contract",
                "costsummaryselectors",
                "usecostsummary",
                "total_cost_burden",
                "total_people_cost_annual",
                "required_recovery_rate",
            ],
        ),
        (
            "business-summary",
            [
                "business-summary",
                "businesssummary",
                "business_summary",
                "business_summary_output_contract",
                "businesssummaryselectors",
                "usebusinesssummary",
                "net_position",
                "margin_pool",
                "business_summary_warnings",
                "business_summary_status",
            ],
        ),
        (
            "revenue-reality",
            [
                "revenue-reality",
                "revenuereality",
                "revenue_reality",
                "revenuerealitycalculations",
                "userevenuereality",
                "margin_after_labour",
                "labour_consumption_of_margin_percent",
            ],
        ),
        (
            "asset-reality",
            [
                "asset-reality",
                "assetreality",
                "asset_reality",
                "asset_underutilisation",
                "asset_underutilization",
                "weighted_required_asset_recovery_rate",
            ],
        ),
        (
            "cost-allocation",
            [
                "cost-allocation",
                "costallocation",
                "cost_allocation",
                "cost_allocation_",
                "costallocationstorage",
                "costallocationprofilestorage",
                "costallocationrules",
                "usecostallocation",
                "system_allocation",
                "system_allocation_overrides",
                "system_allocation_amount_overrides",
                "allocation_status",
                "recovery_share_total_percent",
                "review_subcategory",
            ],
        ),
        (
            "recovery-summary",
            [
                "recovery-summary",
                "recoverysummary",
                "recovery_summary",
                "recovery_summary_",
                "recoverysummaryselectors",
                "recoverysummarycalculations",
                "userecoverysummary",
                "component_required_recovery",
                "recovery_warning_system",
                "build_recovery_warning",
                "recoveryriskwarningsystem",
                "cost_stream",
            ],
        ),
        (
            "recovery-outcome-legacy",
            [
                "recovery-outcome",
                "recoveryoutcome",
                "recovery_outcome",
                "outcome_status",
                "recoveryoutcomecalculations",
            ],
        ),
        (
            "quote-engine-legacy",
            [
                "quote-engine",
                "quoteengine",
                "quote_engine",
                "quote_result_status",
                "quoteenginestorage",
                "quoteengineselectors",
                "quoteenginecalculations",
            ],
        ),
        (
            "rate-builder",
            [
                "rate-builder",
                "ratebuilder",
                "rate_builder",
                "rate_builder_",
                "minimum_recoverable_rate",
                "suggested_sell_rate",
            ],
        ),
        (
            "business-outcome",
            [
                "business-outcome",
                "businessoutcome",
                "business_outcome",
                "business_outcome_",
            ],
        ),
        (
            "business-modelling",
            [
                "business-modelling",
                "businessmodelling",
                "business_modelling",
                "business_modelling_",
                "businessmodellingselectors",
                "businessmodellingcalculations",
                "usebusinessmodelling",
                "target_model",
                "target_model_rows",
                "selected_target_model",
            ],
        ),
        (
            "quote-checker",
            [
                "quote-checker",
                "quotechecker",
                "quote_checker",
                "quote_checker_",
                "quote_checker_target_set",
            ],
        ),
        (
            "integrations",
            [
                "integrations",
                "integration",
                "xero",
                "xero_",
                "xero_cog",
                "source_import",
                "normalised_import",
                "normalized_import",
                "connector_",
                "sync_",
            ],
        ),
        (
            "layout-shared",
            [
                "layout",
                "sidebar",
                "navigation",
                "collapsiblesection",
                "sidebarnavigation",
            ],
        ),
    ]

    for module_name, patterns in module_patterns:
        if any(pattern in combined for pattern in patterns):
            return module_name

    return ""


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


def nearby_context(lines: list[str], index: int, radius: int = 1) -> str:
    start = max(0, index - radius)
    end = min(len(lines), index + radius + 1)

    return normalise_space(" ".join(line.strip() for line in lines[start:end] if line.strip()))[:500]


def likely_role(name: str, extraction_type: str, line: str, context: str, path: Path) -> str:
    haystack = f"{name} {extraction_type} {line} {context} {path}".lower()

    if extraction_type == "localStorage_key":
        return "storage_key"

    if extraction_type == "import":
        return "imported_dependency"

    if extraction_type == "export_function":
        return "exported_function"

    if "output_contract" in haystack:
        return "output_contract_field"

    if name.endswith("_status") or name == "status":
        return "status_field"

    if name.endswith("_trust_state") or name.endswith("TrustState") or name == "model_trust_state":
        return "trust_state_field"

    if name.endswith("_warnings") or name.endswith("Warnings") or name == "warnings":
        return "warnings_field"

    if (
        name.endswith("_ready")
        or name.endswith("Ready")
        or name == "model_ready"
        or name.startswith("is_")
        or name.startswith("has_")
    ):
        return "readiness_field"

    if "warning" in haystack or WARNING_ID_RE.fullmatch(name):
        return "warning_id"

    if name.startswith("use") and name[:4] != "user":
        return "hook_or_react_function"

    if "selector" in haystack:
        return "selector"

    if "calculation" in haystack or "calculate" in haystack:
        return "calculation"

    if extraction_type in {"object_key", "quoted_object_key"}:
        return "object_field"

    if extraction_type == "destructured_name":
        return "consumed_field"

    if extraction_type == "declaration":
        return "local_variable"

    return "mentioned"


def should_scan(path: Path, source_root: Path, include_dirs: list[str]) -> bool:
    if path.suffix.lower() not in SOURCE_EXTENSIONS:
        return False

    try:
        rel_parts = path.relative_to(source_root).parts
    except ValueError:
        rel_parts = path.parts

    if any(part in DEFAULT_EXCLUDE_DIRS for part in rel_parts):
        return False

    if include_dirs:
        return rel_parts and rel_parts[0] in include_dirs

    return True


def iter_source_files(source_root: Path, include_dirs: list[str]) -> Iterator[Path]:
    for path in sorted(source_root.rglob("*")):
        if path.is_file() and should_scan(path, source_root, include_dirs):
            yield path


def split_names_from_destructure(body: str) -> list[str]:
    names: list[str] = []

    for raw_part in body.split(","):
        part = raw_part.strip()

        if not part:
            continue

        if ":" in part:
            part = part.split(":", 1)[0].strip()

        part = part.replace("...", "").strip()

        if re.fullmatch(r"[A-Za-z_$][A-Za-z0-9_$]*", part):
            names.append(part)

    return names


def add_record(
    records: list[CodeVariableRecord],
    path: Path,
    source_root: Path,
    lines: list[str],
    line_index: int,
    name: str,
    extraction_type: str,
) -> None:
    if not name:
        return

    if name in {"true", "false", "null", "undefined", "return", "const", "let", "var"}:
        return

    line = lines[line_index]
    context = nearby_context(lines, line_index)

    try:
        rel_path = str(path.relative_to(source_root))
    except ValueError:
        rel_path = str(path)

    records.append(
        CodeVariableRecord(
            file_path=rel_path,
            file_name=path.name,
            source_area=detect_source_area(path),
            line_number=line_index + 1,
            variable_name=name,
            variable_style=variable_style(name),
            extraction_type=extraction_type,
            likely_role=likely_role(name, extraction_type, line, context, path),
            module_hint=detect_module_hint(path, name),
            context=context,
        )
    )


def extract_from_file(path: Path, source_root: Path) -> list[CodeVariableRecord]:
    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        text = path.read_text(encoding="utf-8", errors="replace")

    lines = text.splitlines()
    records: list[CodeVariableRecord] = []

    for idx, line in enumerate(lines):
        stripped = line.strip()

        if not stripped or stripped.startswith("//"):
            continue

        for match in LOCAL_STORAGE_RE.finditer(line):
            add_record(records, path, source_root, lines, idx, match.group("key"), "localStorage_key")

        if OUTPUT_CONTRACT_RE.search(line):
            add_record(records, path, source_root, lines, idx, "output_contract", "output_contract_reference")

        for match in IMPORT_RE.finditer(line):
            import_body = match.group("body")
            imported_names = re.findall(r"\b[A-Za-z_$][A-Za-z0-9_$]*\b", import_body)

            for name in imported_names:
                if name not in {"from", "as"}:
                    add_record(records, path, source_root, lines, idx, name, "import")

        for match in EXPORT_FUNCTION_RE.finditer(line):
            add_record(records, path, source_root, lines, idx, match.group("name"), "export_function")

        for match in FUNCTION_RE.finditer(line):
            add_record(records, path, source_root, lines, idx, match.group("name"), "function")

        for match in ARROW_FUNCTION_RE.finditer(line):
            add_record(records, path, source_root, lines, idx, match.group("name"), "arrow_function")

        for match in DECLARATION_RE.finditer(line):
            add_record(records, path, source_root, lines, idx, match.group("name"), "declaration")

        for match in DESTRUCTURE_RE.finditer(line):
            for name in split_names_from_destructure(match.group("body")):
                add_record(records, path, source_root, lines, idx, name, "destructured_name")

        for match in ARRAY_DESTRUCTURE_RE.finditer(line):
            for name in split_names_from_destructure(match.group("body")):
                add_record(records, path, source_root, lines, idx, name, "array_destructured_name")

        for match in QUOTED_OBJECT_KEY_RE.finditer(line):
            add_record(records, path, source_root, lines, idx, match.group("key"), "quoted_object_key")

        for match in OBJECT_KEY_RE.finditer(line):
            add_record(records, path, source_root, lines, idx, match.group("key"), "object_key")

        for match in WARNING_ID_RE.finditer(line):
            add_record(records, path, source_root, lines, idx, match.group(0), "warning_id")

        for match in STATUS_VALUE_RE.finditer(line):
            add_record(records, path, source_root, lines, idx, match.group("status"), "status_value")

        for match in SNAKE_CASE_RE.finditer(line):
            add_record(records, path, source_root, lines, idx, match.group(0), "snake_case_reference")

    return records


def dedupe_records(records: Iterable[CodeVariableRecord]) -> list[CodeVariableRecord]:
    seen: set[tuple[str, int, str, str]] = set()
    output: list[CodeVariableRecord] = []

    for record in records:
        key = (
            record.file_path,
            record.line_number,
            record.variable_name,
            record.extraction_type,
        )

        if key not in seen:
            seen.add(key)
            output.append(record)

    return output


def build_duplicate_review(records: list[CodeVariableRecord]) -> list[DuplicateCodeRecord]:
    grouped: dict[str, list[CodeVariableRecord]] = defaultdict(list)

    for record in records:
        grouped[record.variable_name].append(record)

    rows: list[DuplicateCodeRecord] = []

    for variable_name, items in sorted(grouped.items()):
        if len(items) <= 1:
            continue

        files = sorted({item.file_path for item in items})
        areas = sorted({item.source_area for item in items})
        extraction_types = sorted({item.extraction_type for item in items})
        roles = sorted({item.likely_role for item in items})
        modules = sorted({item.module_hint or "unknown" for item in items})

        reasons: list[str] = []

        if len(files) > 1:
            reasons.append("appears_in_multiple_files")

        if len(roles) > 1:
            reasons.append("appears_with_multiple_roles")

        if len(modules) > 1:
            reasons.append("appears_across_multiple_modules")

        if "output_contract_field" in roles and "consumed_field" in roles:
            reasons.append("possible_handoff_field")

        if variable_name.endswith("_status") or variable_name.endswith("_trust_state"):
            reasons.append("status_or_trust_field")

        if variable_name == "output_contract":
            reasons.append("output_contract_usage")

        if not reasons:
            reasons.append("repeated_reference")

        rows.append(
            DuplicateCodeRecord(
                variable_name=variable_name,
                occurrence_count=len(items),
                file_count=len(files),
                source_areas=" | ".join(areas),
                extraction_types=" | ".join(extraction_types),
                likely_roles=" | ".join(roles),
                module_hints=" | ".join(modules),
                files=" | ".join(files[:40]),
                review_reason=" | ".join(reasons),
            )
        )

    rows.sort(key=lambda row: (row.file_count, row.occurrence_count), reverse=True)
    return rows


def write_register_csv(path: Path, records: list[CodeVariableRecord]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)

    fieldnames = [
        "file_path",
        "file_name",
        "source_area",
        "line_number",
        "variable_name",
        "variable_style",
        "extraction_type",
        "likely_role",
        "module_hint",
        "context",
    ]

    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()

        for record in records:
            writer.writerow(asdict(record))


def write_duplicate_csv(path: Path, rows: list[DuplicateCodeRecord]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)

    fieldnames = [
        "variable_name",
        "occurrence_count",
        "file_count",
        "source_areas",
        "extraction_types",
        "likely_roles",
        "module_hints",
        "files",
        "review_reason",
    ]

    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()

        for row in rows:
            writer.writerow(asdict(row))


def write_json(path: Path, records: list[CodeVariableRecord], duplicates: list[DuplicateCodeRecord], source: Path) -> None:
    payload = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "script_version": SCRIPT_VERSION,
        "source": str(source),
        "record_count": len(records),
        "unique_variable_count": len({record.variable_name for record in records}),
        "duplicate_review_count": len(duplicates),
        "records": [asdict(record) for record in records],
        "duplicate_review": [asdict(row) for row in duplicates],
    }

    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


def write_summary(path: Path, records: list[CodeVariableRecord], duplicates: list[DuplicateCodeRecord], scanned_files: int, source: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)

    area_counter = Counter(record.source_area for record in records)
    role_counter = Counter(record.likely_role for record in records)
    type_counter = Counter(record.extraction_type for record in records)
    style_counter = Counter(record.variable_style for record in records)
    module_counter = Counter(record.module_hint or "unknown" for record in records)

    output_contract_records = [
        record for record in records
        if record.variable_name == "output_contract" or record.likely_role == "output_contract_field"
    ]

    warning_records = [
        record for record in records
        if record.likely_role == "warning_id" or record.extraction_type == "warning_id"
    ]

    local_storage_records = [
        record for record in records
        if record.extraction_type == "localStorage_key"
    ]

    lines: list[str] = []

    lines.append("# Mirra Code Variable Summary")
    lines.append("")
    lines.append(f"Generated: {datetime.now().isoformat(timespec='seconds')}")
    lines.append(f"Script version: {SCRIPT_VERSION}")
    lines.append(f"Source: {source}")
    lines.append("")
    lines.append("## Totals")
    lines.append(f"- Scanned files: {scanned_files}")
    lines.append(f"- Extracted records: {len(records)}")
    lines.append(f"- Unique names / values: {len({record.variable_name for record in records})}")
    lines.append(f"- Duplicate review rows: {len(duplicates)}")
    lines.append(f"- Output contract related records: {len(output_contract_records)}")
    lines.append(f"- Warning ID records: {len(warning_records)}")
    lines.append(f"- localStorage key records: {len(local_storage_records)}")
    lines.append("")

    lines.append("## Records by Source Area")
    for key, count in area_counter.most_common():
        lines.append(f"- {key}: {count}")
    lines.append("")

    lines.append("## Records by Module Hint")
    for key, count in module_counter.most_common():
        lines.append(f"- {key}: {count}")
    lines.append("")

    lines.append("## Records by Likely Role")
    for key, count in role_counter.most_common():
        lines.append(f"- {key}: {count}")
    lines.append("")

    lines.append("## Records by Extraction Type")
    for key, count in type_counter.most_common():
        lines.append(f"- {key}: {count}")
    lines.append("")

    lines.append("## Records by Naming Style")
    for key, count in style_counter.most_common():
        lines.append(f"- {key}: {count}")
    lines.append("")

    lines.append("## localStorage Keys")
    if local_storage_records:
        for record in sorted(local_storage_records, key=lambda r: (r.variable_name, r.file_path))[:150]:
            lines.append(f"- {record.variable_name} | {record.file_path}:{record.line_number}")
    else:
        lines.append("- None found")
    lines.append("")

    lines.append("## Top Duplicate Review Items")
    if duplicates:
        for row in duplicates[:80]:
            lines.append(
                f"- {row.variable_name}: {row.occurrence_count} occurrences, "
                f"{row.file_count} files ({row.review_reason})"
            )
    else:
        lines.append("- None")
    lines.append("")

    lines.append("## Notes")
    lines.append("- This scans actual source scripts, not the brief documents.")
    lines.append("- Module detection uses file paths, filenames, and variable-name prefixes.")
    lines.append("- Some shared utilities and layout records may still appear as unknown.")
    lines.append("- Next step is to rerun the contract filter and review the remaining unknown module bucket.")
    lines.append("")

    path.write_text("\n".join(lines), encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Extract variables from Mirra source code.")

    parser.add_argument(
        "--source",
        required=True,
        help="Repo root or source root to scan.",
    )

    parser.add_argument(
        "--out",
        required=True,
        help="Output directory.",
    )

    parser.add_argument(
        "--include",
        nargs="*",
        default=DEFAULT_INCLUDE_DIRS,
        help="Top-level folders to include. Default: app components hooks lib data context store utils",
    )

    return parser.parse_args()


def main() -> int:
    args = parse_args()

    source = Path(args.source).resolve()
    output = Path(args.out).resolve()

    if not source.exists() or not source.is_dir():
        raise SystemExit(f"Source folder not found: {source}")

    source_files = list(iter_source_files(source, args.include))

    if not source_files:
        raise SystemExit(f"No source files found under {source}")

    records: list[CodeVariableRecord] = []

    for path in source_files:
        records.extend(extract_from_file(path, source))

    records = dedupe_records(records)

    records.sort(
        key=lambda record: (
            record.source_area,
            record.module_hint,
            record.file_path,
            record.line_number,
            record.variable_name,
        )
    )

    duplicates = build_duplicate_review(records)

    register_csv = output / f"{REGISTER_BASENAME}.csv"
    register_json = output / f"{REGISTER_BASENAME}.json"
    summary_txt = output / f"{SUMMARY_BASENAME}.txt"
    duplicate_csv = output / f"{DUPLICATE_BASENAME}.csv"

    write_register_csv(register_csv, records)
    write_json(register_json, records, duplicates, source)
    write_summary(summary_txt, records, duplicates, len(source_files), source)
    write_duplicate_csv(duplicate_csv, duplicates)

    print(f"Scanned files: {len(source_files)}")
    print(f"Extracted records: {len(records)}")
    print(f"Unique names / values: {len({record.variable_name for record in records})}")
    print(f"Duplicate review rows: {len(duplicates)}")
    print(f"Wrote: {register_csv}")
    print(f"Wrote: {register_json}")
    print(f"Wrote: {summary_txt}")
    print(f"Wrote: {duplicate_csv}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())