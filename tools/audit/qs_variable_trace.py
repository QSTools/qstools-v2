"""
QS Tools — Variable Flow Trace
v1.1

Purpose:
Trace where a selected variable appears across the QS Tools codebase.

Command:
python tools/audit/qs_variable_trace.py total_cost_burden

Outputs:
reports/audit/variable_trace_reports/<variable_name>_trace.txt
reports/audit/variable_trace_reports/<variable_name>_trace.json

Notes:
This tool is an audit helper only.
It does not change production files.
"""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import asdict
from pathlib import Path


# ============================================================
# Paths
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]
REPORT_DIR = PROJECT_ROOT / "reports" / "audit" / "variable_trace_reports"


# ============================================================
# Imports from register
# ============================================================

try:
    from qs_variable_register import find_variable
except ImportError:
    # Allows running from different working directories
    import sys

    sys.path.append(str(Path(__file__).resolve().parent))
    from qs_variable_register import find_variable


# ============================================================
# Scan settings
# ============================================================

INCLUDE_EXTENSIONS = {
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".py",
    ".json",
    ".txt",
}

EXCLUDED_DIRS = {
    ".git",
    ".next",
    "node_modules",
    ".venv",
    "venv",
    "__pycache__",
    "reports",
    "audit_reports",
}

EXCLUDED_FILES = {
    "variable_register.json",
}


# ============================================================
# Usage classification patterns
# ============================================================

MATH_OPERATOR_PATTERN = re.compile(r"(?<![=!<>])(?:\+|\-|\*|/|%)(?![=>])")
ASSIGNMENT_PATTERN = re.compile(r"\b(?:const|let|var)\s+[a-zA-Z0-9_]+\s*=")
JSX_PROP_PATTERN = re.compile(r"\b[a-zA-Z0-9_]+\s*=\s*\{")
DEFAULT_DESTRUCTURE_PATTERN = re.compile(
    r"\b[a-zA-Z0-9_]+\s*=\s*(0|false|true|null|undefined|\"\"|'')"
)
COMPARISON_PATTERN = re.compile(r"(===|!==|==|!=|>=|<=|>|<)")
FORMAT_ONLY_PATTERN = re.compile(
    r"(format_currency|formatCurrency|formatMoney|toNumber|safe_number|round_currency)"
)
OBJECT_KEY_PATTERN = re.compile(r"^\s*[a-zA-Z0-9_]+\s*:")
STRING_LITERAL_PATTERN = re.compile(r"^[\"'].*[\"'],?$")


# ============================================================
# Helpers
# ============================================================

def classify_file(path: Path) -> str:
    """Classify file into QS Tools architectural layer."""
    relative = path.relative_to(PROJECT_ROOT).as_posix()

    if relative.startswith("app/"):
        return "page"

    if relative.startswith("hooks/"):
        return "hook"

    if relative.startswith("lib/calculations/"):
        return "calculation"

    if relative.startswith("lib/selectors/"):
        return "selector"

    if relative.startswith("lib/storage/"):
        return "storage"

    if relative.startswith("lib/validation/"):
        return "validation"

    if relative.startswith("components/"):
        return "component"

    if relative.startswith("tools/audit/"):
        return "audit_tool"

    if relative.startswith("tools/"):
        return "tooling"

    if relative.startswith("docs/"):
        return "docs"

    if relative.startswith("reports/"):
        return "report"

    return "unknown"


def should_scan(path: Path) -> bool:
    """Return True if a file should be scanned."""
    if not path.is_file():
        return False

    if path.name in EXCLUDED_FILES:
        return False

    if path.suffix not in INCLUDE_EXTENSIONS:
        return False

    relative_parts = set(path.relative_to(PROJECT_ROOT).parts)
    if relative_parts.intersection(EXCLUDED_DIRS):
        return False

    return True


def snake_to_camel(name: str) -> str:
    """Convert snake_case to camelCase for alias drift checks."""
    parts = name.split("_")
    return parts[0] + "".join(part.capitalize() for part in parts[1:])


def read_file(path: Path) -> str:
    """Read a text file safely."""
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return path.read_text(encoding="utf-8", errors="ignore")


def classify_line_usage(line: str) -> str:
    """
    Classify how a matched line is using the variable.

    Returns:
    - formula
    - assignment
    - jsx_prop
    - default_value
    - comparison
    - formatting
    - object_key
    - string_literal
    - reference
    """
    stripped = line.strip()

    if not stripped:
        return "reference"

    if STRING_LITERAL_PATTERN.search(stripped):
        return "string_literal"

    if JSX_PROP_PATTERN.search(stripped):
        return "jsx_prop"

    if DEFAULT_DESTRUCTURE_PATTERN.search(stripped):
        return "default_value"

    if FORMAT_ONLY_PATTERN.search(stripped):
        return "formatting"

    if COMPARISON_PATTERN.search(stripped):
        return "comparison"

    if OBJECT_KEY_PATTERN.search(stripped):
        # Object key mappings are common in selectors/hooks:
        # total_cost_burden: calculations.total_cost_burden
        # These are usually contract passing, not formulas.
        if MATH_OPERATOR_PATTERN.search(stripped):
            return "formula"
        return "object_key"

    if ASSIGNMENT_PATTERN.search(stripped) and MATH_OPERATOR_PATTERN.search(stripped):
        return "formula"

    if MATH_OPERATOR_PATTERN.search(stripped):
        return "formula"

    if ASSIGNMENT_PATTERN.search(stripped):
        return "assignment"

    return "reference"


def find_matches(path: Path, variable_name: str) -> list[dict]:
    """Find exact variable matches in one file."""
    content = read_file(path)
    lines = content.splitlines()

    pattern = re.compile(rf"\b{re.escape(variable_name)}\b")
    matches = []

    for line_number, line in enumerate(lines, start=1):
        if pattern.search(line):
            stripped = line.strip()
            usage_type = classify_line_usage(stripped)

            matches.append(
                {
                    "line_number": line_number,
                    "line": stripped,
                    "usage_type": usage_type,
                    "has_arithmetic": usage_type == "formula",
                }
            )

    return matches


def find_alias_matches(path: Path, variable_name: str) -> list[dict]:
    """Find likely camelCase alias matches."""
    camel_name = snake_to_camel(variable_name)

    if camel_name == variable_name:
        return []

    content = read_file(path)
    lines = content.splitlines()

    pattern = re.compile(rf"\b{re.escape(camel_name)}\b")
    matches = []

    for line_number, line in enumerate(lines, start=1):
        if pattern.search(line):
            matches.append(
                {
                    "alias": camel_name,
                    "line_number": line_number,
                    "line": line.strip(),
                    "usage_type": classify_line_usage(line.strip()),
                }
            )

    return matches


def scan_codebase(variable_name: str) -> list[dict]:
    """Scan the project for a variable."""
    findings = []

    for path in PROJECT_ROOT.rglob("*"):
        if not should_scan(path):
            continue

        matches = find_matches(path, variable_name)
        alias_matches = find_alias_matches(path, variable_name)

        if not matches and not alias_matches:
            continue

        layer = classify_file(path)
        relative_path = path.relative_to(PROJECT_ROOT).as_posix()

        findings.append(
            {
                "file": relative_path,
                "layer": layer,
                "matches": matches,
                "alias_matches": alias_matches,
            }
        )

    return findings


def is_risky_layer(layer: str) -> bool:
    """Return True if formulas should generally not exist in this layer."""
    return layer in {"component", "page"}


def build_risk_flags(variable_name: str, findings: list[dict]) -> list[str]:
    """Build risk flags based on findings."""
    flags = []

    for finding in findings:
        layer = finding["layer"]
        file_path = finding["file"]

        for match in finding["matches"]:
            usage_type = match.get("usage_type")

            if usage_type == "formula" and is_risky_layer(layer):
                flags.append(
                    f"Possible business formula in {layer}: "
                    f"{file_path}:{match['line_number']}"
                )

            if usage_type == "formula" and layer == "hook":
                flags.append(
                    f"Check hook formula/orchestration: "
                    f"{file_path}:{match['line_number']}"
                )

            if usage_type == "formula" and layer == "selector":
                flags.append(
                    f"Check selector formula/shaping: "
                    f"{file_path}:{match['line_number']}"
                )

        if finding["alias_matches"]:
            flags.append(
                f"Possible alias drift: camelCase alias found in {file_path}"
            )

    if not findings:
        flags.append("Variable was not found in scanned codebase.")

    registered = find_variable(variable_name)
    if registered is None:
        flags.append("Variable is not currently registered in qs_variable_register.py.")

    return flags


def build_layer_summary(findings: list[dict]) -> dict[str, int]:
    """Return count of findings by layer."""
    summary: dict[str, int] = {}

    for finding in findings:
        layer = finding["layer"]
        summary[layer] = summary.get(layer, 0) + 1

    return dict(sorted(summary.items()))


def build_usage_summary(findings: list[dict]) -> dict[str, int]:
    """Return count of usage types across all exact matches."""
    summary: dict[str, int] = {}

    for finding in findings:
        for match in finding["matches"]:
            usage_type = match.get("usage_type", "unknown")
            summary[usage_type] = summary.get(usage_type, 0) + 1

    return dict(sorted(summary.items()))


def build_trace_result(variable_name: str) -> dict:
    """Build full trace result."""
    registered = find_variable(variable_name)
    findings = scan_codebase(variable_name)
    risk_flags = build_risk_flags(variable_name, findings)

    return {
        "variable_name": variable_name,
        "registered": registered is not None,
        "register_record": asdict(registered) if registered else None,
        "finding_count": len(findings),
        "layer_summary": build_layer_summary(findings),
        "usage_summary": build_usage_summary(findings),
        "findings": findings,
        "risk_flags": risk_flags,
    }


def write_json_report(result: dict) -> Path:
    """Write JSON trace report."""
    REPORT_DIR.mkdir(parents=True, exist_ok=True)

    output_path = REPORT_DIR / f"{result['variable_name']}_trace.json"
    output_path.write_text(json.dumps(result, indent=2), encoding="utf-8")

    return output_path


def write_text_report(result: dict) -> Path:
    """Write readable text trace report."""
    REPORT_DIR.mkdir(parents=True, exist_ok=True)

    variable_name = result["variable_name"]
    output_path = REPORT_DIR / f"{variable_name}_trace.txt"

    lines = []
    lines.append("QS TOOLS VARIABLE TRACE REPORT")
    lines.append("=" * 80)
    lines.append(f"Variable: {variable_name}")
    lines.append(f"Registered: {result['registered']}")
    lines.append(f"Files found: {result['finding_count']}")
    lines.append("")

    if result["register_record"]:
        record = result["register_record"]
        lines.append("REGISTER RECORD")
        lines.append("-" * 80)
        lines.append(f"Owner: {record['owning_module']}")
        lines.append(f"Owning file: {record['owning_file']}")
        lines.append(f"Type: {record['variable_type']}")
        lines.append(f"Calculation/source: {record['calculation_source']}")
        lines.append(f"Downstream consumers: {', '.join(record['downstream_consumers'])}")
        lines.append(f"Must balance to P&L: {record['must_balance_to_pnl']}")
        lines.append(f"Test required: {record['test_required']}")
        lines.append(f"Notes: {record['notes']}")
        lines.append("")

    lines.append("LAYER SUMMARY")
    lines.append("-" * 80)
    if result["layer_summary"]:
        for layer, count in result["layer_summary"].items():
            lines.append(f"{layer}: {count}")
    else:
        lines.append("No layer findings.")
    lines.append("")

    lines.append("USAGE SUMMARY")
    lines.append("-" * 80)
    if result["usage_summary"]:
        for usage_type, count in result["usage_summary"].items():
            lines.append(f"{usage_type}: {count}")
    else:
        lines.append("No usage findings.")
    lines.append("")

    lines.append("FINDINGS")
    lines.append("-" * 80)

    if not result["findings"]:
        lines.append("No matches found.")

    for finding in result["findings"]:
        lines.append(f"\nFile: {finding['file']}")
        lines.append(f"Layer: {finding['layer']}")

        if finding["matches"]:
            lines.append("Matches:")
            for match in finding["matches"]:
                usage_type = match.get("usage_type", "unknown")
                usage_marker = f" [{usage_type.upper()}]"
                lines.append(
                    f"  L{match['line_number']}: {match['line']}{usage_marker}"
                )

        if finding["alias_matches"]:
            lines.append("Alias matches:")
            for match in finding["alias_matches"]:
                usage_type = match.get("usage_type", "unknown")
                lines.append(
                    f"  L{match['line_number']}: "
                    f"{match['alias']} -> {match['line']} [{usage_type.upper()}]"
                )

    lines.append("")
    lines.append("RISK FLAGS")
    lines.append("-" * 80)

    if not result["risk_flags"]:
        lines.append("No risk flags.")

    for flag in result["risk_flags"]:
        lines.append(f"- {flag}")

    output_path.write_text("\n".join(lines), encoding="utf-8")
    return output_path


def print_console_summary(result: dict, text_path: Path, json_path: Path) -> None:
    """Print short result summary."""
    print("QS Tools Variable Trace")
    print("-" * 60)
    print(f"Variable: {result['variable_name']}")
    print(f"Registered: {result['registered']}")
    print(f"Files found: {result['finding_count']}")
    print(f"Risk flags: {len(result['risk_flags'])}")

    if result["layer_summary"]:
        print("")
        print("Layer summary:")
        for layer, count in result["layer_summary"].items():
            print(f"  {layer}: {count}")

    if result["usage_summary"]:
        print("")
        print("Usage summary:")
        for usage_type, count in result["usage_summary"].items():
            print(f"  {usage_type}: {count}")

    print("")
    print("Reports:")
    print(f"  {text_path}")
    print(f"  {json_path}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Trace a QS Tools variable.")
    parser.add_argument(
        "variable_name",
        help="Variable name to trace, e.g. total_cost_burden",
    )

    args = parser.parse_args()

    result = build_trace_result(args.variable_name)
    text_path = write_text_report(result)
    json_path = write_json_report(result)

    print_console_summary(result, text_path, json_path)


if __name__ == "__main__":
    main()