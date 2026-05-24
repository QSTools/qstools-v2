"""
QS Tools — Calculation Test Runner
v1.0

Purpose:
Discover and prepare controlled calculation testing against the actual QS Tools
JavaScript calculation files.

Important:
This Python script is a runner only.
It must not become a duplicate business logic engine.

Current v1 behaviour:
- checks that Node.js is available
- discovers exports from key JS calculation files
- reports which calculation modules are loadable
- writes text and JSON reports
- does not change production app files

Next version:
- call specific exported calculation functions
- feed controlled test inputs
- compare actual outputs against expected outputs
"""

from __future__ import annotations

import json
import subprocess
import sys
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any


# ============================================================
# Paths
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]
REPORT_DIR = PROJECT_ROOT / "reports" / "audit" / "calculation_test_reports"
TEMP_DIR = REPORT_DIR / "_temp"


# ============================================================
# Calculation modules to inspect
# ============================================================

CALCULATION_MODULES = [
    {
        "module_name": "Labour",
        "path": "lib/calculations/labourCalculations.js",
        "critical": True,
        "notes": "Owns Labour core calculations.",
    },
    {
        "module_name": "Employee Overheads",
        "path": "lib/calculations/employeeOverheadCalculations.js",
        "critical": True,
        "notes": "Owns staff-linked employee overhead calculations.",
    },
    {
        "module_name": "Assets",
        "path": "lib/calculations/assetCalculations.js",
        "critical": True,
        "notes": "Owns asset cost calculations.",
    },
    {
        "module_name": "General Overheads",
        "path": "lib/calculations/generalOverheadCalculations.js",
        "critical": True,
        "notes": "Owns general overhead calculations.",
    },
    {
        "module_name": "Cost Summary",
        "path": "lib/calculations/costSummaryCalculations.js",
        "critical": True,
        "notes": "Owns total cost burden and required recovery baseline.",
    },
    {
        "module_name": "Recovery Summary",
        "path": "lib/calculations/recoverySummaryCalculations.js",
        "critical": True,
        "notes": "Owns recovery strategy distribution.",
    },
    {
    "module_name": "Cost Allocation",
    "path": "lib/calculations/costAllocationRules.js",
    "critical": False,
    "notes": "Owns structural validation logic. Marked non-critical for direct Node discovery because this file uses the Next.js @ alias and needs an alias-aware test adapter.",
},
    {
        "module_name": "Recovery Outcome",
        "path": "lib/calculations/recoveryOutcomeCalculations.js",
        "critical": True,
        "notes": "Owns recovery outcome decision logic.",
    },
    {
        "module_name": "Revenue Summary",
        "path": "lib/calculations/revenueSummaryCalculations.js",
        "critical": False,
        "notes": "Adjacent revenue summary calculations.",
    },
    {
        "module_name": "Business Summary",
        "path": "lib/calculations/businessSummaryCalculations.js",
        "critical": False,
        "notes": "Adjacent business summary calculations.",
    },
    {
        "module_name": "Business Modelling",
        "path": "lib/calculations/businessModellingCalculations.js",
        "critical": False,
        "notes": "Adjacent business modelling calculations.",
    },
    {
        "module_name": "Quote Engine",
        "path": "lib/calculations/quoteEngineCalculations.js",
        "critical": False,
        "notes": "Adjacent quote engine calculations.",
    },
]


# ============================================================
# Data models
# ============================================================

@dataclass
class ModuleDiscoveryResult:
    module_name: str
    path: str
    critical: bool
    exists: bool
    loadable: bool
    exports: list[str]
    default_export_type: str | None
    error: str | None
    notes: str


@dataclass
class CalculationAuditResult:
    node_available: bool
    node_version: str | None
    module_results: list[ModuleDiscoveryResult]
    status: str
    summary: dict[str, Any]


# ============================================================
# Helpers
# ============================================================

def run_command(command: list[str], cwd: Path) -> tuple[int, str, str]:
    """Run a subprocess command and return exit code, stdout, stderr."""
    try:
        completed = subprocess.run(
            command,
            cwd=str(cwd),
            capture_output=True,
            text=True,
            check=False,
            shell=False,
        )
        return completed.returncode, completed.stdout.strip(), completed.stderr.strip()
    except FileNotFoundError as exc:
        return 1, "", str(exc)


def check_node() -> tuple[bool, str | None]:
    """Check whether Node.js is available."""
    code, stdout, stderr = run_command(["node", "--version"], PROJECT_ROOT)

    if code != 0:
        return False, stderr or None

    return True, stdout


def normalise_path_for_node(path: Path) -> str:
    """Return a file path string suitable for a generated Node script."""
    return path.as_posix()


def create_node_discovery_script() -> Path:
    """
    Create a temporary Node .mjs script that imports modules and lists exports.

    The generated script is placed under reports/audit/calculation_test_reports/_temp.
    """
    TEMP_DIR.mkdir(parents=True, exist_ok=True)
    script_path = TEMP_DIR / "discover_calculation_exports.mjs"

    module_payload = []
    for module in CALCULATION_MODULES:
        absolute_path = PROJECT_ROOT / module["path"]
        module_payload.append(
            {
                "module_name": module["module_name"],
                "path": module["path"],
                "absolute_path": normalise_path_for_node(absolute_path),
                "critical": module["critical"],
                "notes": module["notes"],
            }
        )

    script = f"""
import path from "path";
import {{ pathToFileURL }} from "url";
import fs from "fs";

const modules = {json.dumps(module_payload, indent=2)};

const results = [];

for (const moduleInfo of modules) {{
  const exists = fs.existsSync(moduleInfo.absolute_path);

  if (!exists) {{
    results.push({{
      module_name: moduleInfo.module_name,
      path: moduleInfo.path,
      critical: moduleInfo.critical,
      exists: false,
      loadable: false,
      exports: [],
      default_export_type: null,
      error: "File does not exist",
      notes: moduleInfo.notes
    }});
    continue;
  }}

  try {{
    const fileUrl = pathToFileURL(moduleInfo.absolute_path).href;
    const importedModule = await import(fileUrl);

    const exportNames = Object.keys(importedModule).sort();
    const defaultExportType =
      Object.prototype.hasOwnProperty.call(importedModule, "default")
        ? typeof importedModule.default
        : null;

    results.push({{
      module_name: moduleInfo.module_name,
      path: moduleInfo.path,
      critical: moduleInfo.critical,
      exists: true,
      loadable: true,
      exports: exportNames,
      default_export_type: defaultExportType,
      error: null,
      notes: moduleInfo.notes
    }});
  }} catch (error) {{
    results.push({{
      module_name: moduleInfo.module_name,
      path: moduleInfo.path,
      critical: moduleInfo.critical,
      exists: true,
      loadable: false,
      exports: [],
      default_export_type: null,
      error: String(error && error.stack ? error.stack : error),
      notes: moduleInfo.notes
    }});
  }}
}}

console.log(JSON.stringify(results, null, 2));
"""

    script_path.write_text(script, encoding="utf-8")
    return script_path


def discover_module_exports() -> list[ModuleDiscoveryResult]:
    """Run the Node discovery script and parse results."""
    script_path = create_node_discovery_script()

    code, stdout, stderr = run_command(
        ["node", str(script_path)],
        PROJECT_ROOT,
    )

    if code != 0:
        return [
            ModuleDiscoveryResult(
                module_name="Node discovery runner",
                path=str(script_path.relative_to(PROJECT_ROOT)),
                critical=True,
                exists=True,
                loadable=False,
                exports=[],
                default_export_type=None,
                error=stderr or stdout or "Node discovery failed.",
                notes="The generated Node discovery runner failed.",
            )
        ]

    try:
        raw_results = json.loads(stdout)
    except json.JSONDecodeError as exc:
        return [
            ModuleDiscoveryResult(
                module_name="Node discovery parser",
                path=str(script_path.relative_to(PROJECT_ROOT)),
                critical=True,
                exists=True,
                loadable=False,
                exports=[],
                default_export_type=None,
                error=f"Could not parse Node output as JSON: {exc}\\nOutput:\\n{stdout}",
                notes="The generated Node discovery runner returned invalid JSON.",
            )
        ]

    return [ModuleDiscoveryResult(**item) for item in raw_results]


def build_status(
    node_available: bool,
    module_results: list[ModuleDiscoveryResult],
) -> str:
    """Build overall audit status."""
    if not node_available:
        return "untrusted"

    critical_modules = [item for item in module_results if item.critical]
    failed_critical = [
        item for item in critical_modules if not item.exists or not item.loadable
    ]

    if failed_critical:
        return "failed_validation"

    if any(not item.loadable for item in module_results):
        return "warning_unexplained_variance"

    return "validated"


def build_summary(
    node_available: bool,
    node_version: str | None,
    module_results: list[ModuleDiscoveryResult],
) -> dict[str, Any]:
    """Build report summary."""
    total_modules = len(module_results)
    existing_modules = sum(1 for item in module_results if item.exists)
    loadable_modules = sum(1 for item in module_results if item.loadable)
    critical_modules = sum(1 for item in module_results if item.critical)
    failed_critical_modules = sum(
        1
        for item in module_results
        if item.critical and (not item.exists or not item.loadable)
    )

    return {
        "node_available": node_available,
        "node_version": node_version,
        "total_modules_checked": total_modules,
        "existing_modules": existing_modules,
        "loadable_modules": loadable_modules,
        "critical_modules": critical_modules,
        "failed_critical_modules": failed_critical_modules,
    }


def build_audit_result() -> CalculationAuditResult:
    """Build the full calculation audit result."""
    node_available, node_version_or_error = check_node()

    if not node_available:
        module_results: list[ModuleDiscoveryResult] = []
        status = "untrusted"
        summary = build_summary(False, None, module_results)
        summary["node_error"] = node_version_or_error

        return CalculationAuditResult(
            node_available=False,
            node_version=None,
            module_results=module_results,
            status=status,
            summary=summary,
        )

    module_results = discover_module_exports()
    status = build_status(node_available, module_results)
    summary = build_summary(node_available, node_version_or_error, module_results)

    return CalculationAuditResult(
        node_available=True,
        node_version=node_version_or_error,
        module_results=module_results,
        status=status,
        summary=summary,
    )


def write_json_report(result: CalculationAuditResult) -> Path:
    """Write JSON report."""
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = REPORT_DIR / "qs_calc_test_report.json"

    payload = {
        "node_available": result.node_available,
        "node_version": result.node_version,
        "status": result.status,
        "summary": result.summary,
        "module_results": [asdict(item) for item in result.module_results],
    }

    output_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return output_path


def write_text_report(result: CalculationAuditResult) -> Path:
    """Write readable text report."""
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = REPORT_DIR / "qs_calc_test_report.txt"

    lines = []
    lines.append("QS TOOLS CALCULATION TEST RUNNER REPORT")
    lines.append("=" * 80)
    lines.append(f"Status: {result.status}")
    lines.append(f"Node available: {result.node_available}")
    lines.append(f"Node version: {result.node_version or 'N/A'}")
    lines.append("")

    lines.append("SUMMARY")
    lines.append("-" * 80)
    for key, value in result.summary.items():
        lines.append(f"{key}: {value}")
    lines.append("")

    lines.append("MODULE DISCOVERY")
    lines.append("-" * 80)

    if not result.module_results:
        lines.append("No module discovery results available.")

    for item in result.module_results:
        lines.append("")
        lines.append(f"Module: {item.module_name}")
        lines.append(f"Path: {item.path}")
        lines.append(f"Critical: {item.critical}")
        lines.append(f"Exists: {item.exists}")
        lines.append(f"Loadable: {item.loadable}")
        lines.append(f"Default export type: {item.default_export_type or 'None'}")
        lines.append(f"Notes: {item.notes}")

        if item.exports:
            lines.append("Exports:")
            for export_name in item.exports:
                lines.append(f"  - {export_name}")
        else:
            lines.append("Exports: None discovered")

        if item.error:
            lines.append("Error:")
            lines.append(item.error)

    lines.append("")
    lines.append("INTERPRETATION")
    lines.append("-" * 80)
    lines.append(
        "This v1 runner confirms which actual JS calculation files can be loaded "
        "and which exported functions are available for controlled testing."
    )
    lines.append(
        "Next step: wire test adapters to the discovered exports so Python can "
        "feed controlled inputs into the real JS calculation functions."
    )
    lines.append(
        "No production files were changed by this runner."
    )

    output_path.write_text("\n".join(lines), encoding="utf-8")
    return output_path


def print_console_summary(
    result: CalculationAuditResult,
    text_path: Path,
    json_path: Path,
) -> None:
    """Print concise console summary."""
    print("QS Tools Calculation Test Runner")
    print("-" * 60)
    print(f"Status: {result.status}")
    print(f"Node available: {result.node_available}")
    print(f"Node version: {result.node_version or 'N/A'}")

    for key, value in result.summary.items():
        print(f"{key}: {value}")

    print("")
    print("Reports:")
    print(f"  {text_path}")
    print(f"  {json_path}")


def main() -> None:
    result = build_audit_result()
    text_path = write_text_report(result)
    json_path = write_json_report(result)

    print_console_summary(result, text_path, json_path)

    if result.status in {"failed_validation", "untrusted"}:
        sys.exit(1)


if __name__ == "__main__":
    main()