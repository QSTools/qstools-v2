"""
QS Tools — Calculation Test Runner
v1.6

Purpose:
Run controlled calculation tests against the actual QS Tools JavaScript
calculation files.

Important:
This Python script is a runner only.
It must not become a duplicate production calculation engine.

Current behaviour:
- checks that Node.js is available
- uses a Node alias loader so direct imports can resolve Next.js "@/..." paths
- discovers exports from key JS calculation files
- runs controlled Cost Summary test against calculateCostSummary
- runs controlled Recovery Summary hours-based test against calculateRecoverySummary
- runs controlled Cost Allocation valid-structure test against calculate_cost_allocation
- runs controlled Recovery Outcome healthy test against calculateRecoveryOutcome
- writes text and JSON reports
- does not change production app files
"""

from __future__ import annotations

import json
import subprocess
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any


# ============================================================
# Paths
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]
REPORT_DIR = PROJECT_ROOT / "reports" / "audit" / "calculation_test_reports"
TEMP_DIR = REPORT_DIR / "_temp"
NODE_ALIAS_LOADER = PROJECT_ROOT / "tools" / "audit" / "qs_node_alias_loader.mjs"


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
        "critical": False,
        "notes": (
            "Legacy / retired as standalone source for Cost Summary. "
            "Employee overheads are now included through General Overheads."
        ),
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
        "notes": (
            "Owns general overhead calculations. Employee overheads are included "
            "inside this overhead pathway."
        ),
    },
    {
        "module_name": "Cost Summary",
        "path": "lib/calculations/costSummaryCalculations.js",
        "critical": True,
        "notes": (
            "Owns total cost burden and required recovery baseline. Consumes "
            "Labour, Assets, and General Overheads only."
        ),
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
        "critical": True,
        "notes": "Owns structural validation logic. Loaded through the audit Node alias loader.",
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
class CalculationCheckResult:
    variable_name: str
    expected: float | int | str | bool | list | None
    actual: float | int | str | bool | list | None
    difference: float | None
    passed: bool
    notes: str


@dataclass
class ControlledTestResult:
    test_name: str
    module_name: str
    function_name: str
    status: str
    selected_call_shape: str | None
    checks: list[CalculationCheckResult]
    raw_actual_output: dict[str, Any] | None
    attempted_call_shapes: list[dict[str, Any]]
    error: str | None
    notes: str


@dataclass
class CalculationAuditResult:
    node_available: bool
    node_version: str | None
    module_results: list[ModuleDiscoveryResult]
    controlled_tests: list[ControlledTestResult]
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


def build_node_command(script_path: Path) -> list[str]:
    """Build a Node command using the audit alias loader when available."""
    if NODE_ALIAS_LOADER.exists():
        return [
            "node",
            "--loader",
            NODE_ALIAS_LOADER.as_uri(),
            str(script_path),
        ]

    return ["node", str(script_path)]


def check_node() -> tuple[bool, str | None]:
    """Check whether Node.js is available."""
    code, stdout, stderr = run_command(["node", "--version"], PROJECT_ROOT)

    if code != 0:
        return False, stderr or None

    return True, stdout


def normalise_path_for_node(path: Path) -> str:
    """Return a file path string suitable for a generated Node script."""
    return path.as_posix()


def almost_equal(
    actual: Any,
    expected: Any,
    tolerance: float = 0.01,
) -> tuple[bool, float | None]:
    """Compare numeric values with tolerance."""
    try:
        actual_number = float(actual)
        expected_number = float(expected)
    except (TypeError, ValueError):
        return actual == expected, None

    difference = actual_number - expected_number
    return abs(difference) <= tolerance, difference


def make_check(variable_name: str, expected: Any, actual: Any) -> CalculationCheckResult:
    """Create one calculation check."""
    passed, difference = almost_equal(actual, expected)

    return CalculationCheckResult(
        variable_name=variable_name,
        expected=expected,
        actual=actual,
        difference=difference,
        passed=passed,
        notes=(
            "PASS"
            if passed
            else "Expected value did not match actual calculation output."
        ),
    )


# ============================================================
# Node discovery
# ============================================================

def create_node_discovery_script() -> Path:
    """Create a temporary Node .mjs script that imports modules and lists exports."""
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
        build_node_command(script_path),
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
                error=f"Could not parse Node output as JSON: {exc}\nOutput:\n{stdout}",
                notes="The generated Node discovery runner returned invalid JSON.",
            )
        ]

    return [ModuleDiscoveryResult(**item) for item in raw_results]


# ============================================================
# Controlled Cost Summary test
# ============================================================

def create_cost_summary_test_script() -> Path:
    """Create a temporary Node .mjs script that calls calculateCostSummary."""
    TEMP_DIR.mkdir(parents=True, exist_ok=True)
    script_path = TEMP_DIR / "cost_summary_controlled_test.mjs"

    cost_summary_path = normalise_path_for_node(
        PROJECT_ROOT / "lib" / "calculations" / "costSummaryCalculations.js"
    )

    script = f"""
import {{ pathToFileURL }} from "url";

const modulePath = {json.dumps(cost_summary_path)};
const moduleUrl = pathToFileURL(modulePath).href;

const importedModule = await import(moduleUrl);
const calculateCostSummary = importedModule.calculateCostSummary;

if (typeof calculateCostSummary !== "function") {{
  console.log(JSON.stringify({{
    success: false,
    error: "calculateCostSummary export was not found or is not a function.",
    selected_call_shape: null,
    actual: null,
    attempts: []
  }}, null, 2));
  process.exit(0);
}}

const labour_data = {{
  total_labour_cost_annual: 59995,
  total_productive_output: 1000,
  total_staff_recovery_hours: 1000,
  business_recovery_hours: 1000,
  operating_recovery_hours: 1000,
  total_recovery_hours: 1000,
}};

const asset_data = {{
  total_asset_cost_annual: 12000,
  total_asset_interest_annual: 0,
}};

const general_overhead_data = {{
  total_general_overheads: 23000,
}};

const result = calculateCostSummary({{
  labour_data,
  asset_data,
  general_overhead_data,
}});

console.log(JSON.stringify({{
  success: true,
  error: null,
  selected_call_shape: "single_object_current_contract",
  actual: result,
  attempts: [
    {{
      name: "single_object_current_contract",
      success: true,
      useful_output: true,
      error: null
    }}
  ],
}}, null, 2));
"""

    script_path.write_text(script, encoding="utf-8")
    return script_path


def run_cost_summary_controlled_test() -> ControlledTestResult:
    """Run the controlled Cost Summary test through Node."""
    script_path = create_cost_summary_test_script()

    code, stdout, stderr = run_command(
        build_node_command(script_path),
        PROJECT_ROOT,
    )

    if code != 0:
        return ControlledTestResult(
            test_name="Cost Summary controlled formula test",
            module_name="Cost Summary",
            function_name="calculateCostSummary",
            status="failed_validation",
            selected_call_shape=None,
            checks=[],
            raw_actual_output=None,
            attempted_call_shapes=[],
            error=stderr or stdout or "Node test runner failed.",
            notes="The Node adapter failed before returning a result.",
        )

    try:
        payload = json.loads(stdout)
    except json.JSONDecodeError as exc:
        return ControlledTestResult(
            test_name="Cost Summary controlled formula test",
            module_name="Cost Summary",
            function_name="calculateCostSummary",
            status="failed_validation",
            selected_call_shape=None,
            checks=[],
            raw_actual_output=None,
            attempted_call_shapes=[],
            error=f"Could not parse Node output as JSON: {exc}\nOutput:\n{stdout}",
            notes="The Node adapter returned invalid JSON.",
        )

    if not payload.get("success"):
        return ControlledTestResult(
            test_name="Cost Summary controlled formula test",
            module_name="Cost Summary",
            function_name="calculateCostSummary",
            status="failed_validation",
            selected_call_shape=payload.get("selected_call_shape"),
            checks=[],
            raw_actual_output=payload.get("actual"),
            attempted_call_shapes=payload.get("attempts", []),
            error=payload.get("error"),
            notes="No usable Cost Summary output was returned.",
        )

    actual = payload.get("actual") or {}

    expected_values = {
        "total_people_cost_annual": 59995,
        "total_productive_output": 1000,
        "total_staff_recovery_hours": 1000,
        "business_recovery_hours": 1000,
        "operating_recovery_hours": 1000,
        "total_recovery_hours": 1000,
        "total_asset_cost_annual": 12000,
        "total_asset_interest_annual": 0,
        "total_business_overheads": 23000,
        "total_business_cost_annual": 35000,
        "total_cost_burden": 94995,
        "required_revenue": 94995,
        "required_recovery_rate": 94.995,
    }

    checks = [
        make_check(variable_name, expected, actual.get(variable_name))
        for variable_name, expected in expected_values.items()
    ]

    all_passed = all(check.passed for check in checks)

    return ControlledTestResult(
        test_name="Cost Summary controlled formula test",
        module_name="Cost Summary",
        function_name="calculateCostSummary",
        status="validated" if all_passed else "failed_validation",
        selected_call_shape=payload.get("selected_call_shape"),
        checks=checks,
        raw_actual_output=actual,
        attempted_call_shapes=payload.get("attempts", []),
        error=None,
        notes=(
            "Controlled Cost Summary outputs matched expected values."
            if all_passed
            else "One or more Cost Summary outputs did not match expected values."
        ),
    )


# ============================================================
# Controlled Recovery Summary test
# ============================================================

def create_recovery_summary_test_script() -> Path:
    """Create a temporary Node .mjs script that calls calculateRecoverySummary."""
    TEMP_DIR.mkdir(parents=True, exist_ok=True)
    script_path = TEMP_DIR / "recovery_summary_controlled_test.mjs"

    recovery_summary_path = normalise_path_for_node(
        PROJECT_ROOT / "lib" / "calculations" / "recoverySummaryCalculations.js"
    )

    script = f"""
import {{ pathToFileURL }} from "url";

const modulePath = {json.dumps(recovery_summary_path)};
const moduleUrl = pathToFileURL(modulePath).href;

const importedModule = await import(moduleUrl);
const calculateRecoverySummary = importedModule.calculateRecoverySummary;

if (typeof calculateRecoverySummary !== "function") {{
  console.log(JSON.stringify({{
    success: false,
    error: "calculateRecoverySummary export was not found or is not a function.",
    selected_call_shape: null,
    actual: null,
    attempts: []
  }}, null, 2));
  process.exit(0);
}}

const input = {{
  business_summary_ready: true,
  business_type: "labour_based",
  is_labour_based: true,
  is_product_based: false,
  recovery_model: "hybrid",

  total_people_cost_annual: 60000,
  total_asset_cost_annual: 12000,
  total_business_overheads: 23000,
  total_cost_burden: 95000,

  total_productive_output: 1000,
  total_recovery_hours: 1000,
  required_recovery_rate: 95,

  productive_asset_cost: 12000,
  productive_asset_cost_annual: 12000,
  has_productive_asset_recovery_base: true,
  productive_asset_count: 1,
  asset_utilisation_hours_annual: 1000,

  total_revenue: 150000,
  total_direct_costs: 0,
  margin_pool: 150000,
  gross_margin_percent: 100,
  current_margin_per_driver: 100,
  actual_recovery_rate: 100,
  profit_or_deficit_per_recovery_hour: 5,
  required_recovery_per_driver: 95,
  recovery_gap_per_driver: 5,
  activity_driver_type: "hours",
  activity_driver_value: 1000,
  model_trust_state: "ready",
}};

const result = calculateRecoverySummary(input);

console.log(JSON.stringify({{
  success: true,
  error: null,
  selected_call_shape: "single_object_current_contract",
  actual: result,
  attempts: [
    {{
      name: "single_object_current_contract",
      success: true,
      useful_output: true,
      error: null
    }}
  ],
}}, null, 2));
"""

    script_path.write_text(script, encoding="utf-8")
    return script_path


def run_recovery_summary_controlled_test() -> ControlledTestResult:
    """Run the controlled Recovery Summary hours-based test through Node."""
    script_path = create_recovery_summary_test_script()

    code, stdout, stderr = run_command(
        build_node_command(script_path),
        PROJECT_ROOT,
    )

    if code != 0:
        return ControlledTestResult(
            test_name="Recovery Summary hours-based controlled test",
            module_name="Recovery Summary",
            function_name="calculateRecoverySummary",
            status="failed_validation",
            selected_call_shape=None,
            checks=[],
            raw_actual_output=None,
            attempted_call_shapes=[],
            error=stderr or stdout or "Node test runner failed.",
            notes="The Node adapter failed before returning a result.",
        )

    try:
        payload = json.loads(stdout)
    except json.JSONDecodeError as exc:
        return ControlledTestResult(
            test_name="Recovery Summary hours-based controlled test",
            module_name="Recovery Summary",
            function_name="calculateRecoverySummary",
            status="failed_validation",
            selected_call_shape=None,
            checks=[],
            raw_actual_output=None,
            attempted_call_shapes=[],
            error=f"Could not parse Node output as JSON: {exc}\nOutput:\n{stdout}",
            notes="The Node adapter returned invalid JSON.",
        )

    if not payload.get("success"):
        return ControlledTestResult(
            test_name="Recovery Summary hours-based controlled test",
            module_name="Recovery Summary",
            function_name="calculateRecoverySummary",
            status="failed_validation",
            selected_call_shape=payload.get("selected_call_shape"),
            checks=[],
            raw_actual_output=payload.get("actual"),
            attempted_call_shapes=payload.get("attempts", []),
            error=payload.get("error"),
            notes="No usable Recovery Summary output was returned.",
        )

    actual = payload.get("actual") or {}

    expected_values = {
        "business_summary_ready": True,
        "business_type": "labour_based",
        "recovery_mode": "hours_based",
        "active_recovery_model": "hybrid",

        "total_people_cost_annual": 60000,
        "total_asset_cost_annual": 12000,
        "total_business_overheads": 23000,
        "total_cost_burden": 95000,

        "productive_asset_cost": 12000,
        "productive_asset_cost_annual": 12000,
        "asset_utilisation_hours_annual": 1000,
        "required_asset_recovery_rate": 12,

        "required_revenue": 95000,
        "required_recovery_rate": 95,
        "total_recovery_hours": 1000,
        "recovery_hours_used": 1000,
        "total_productive_output": 1000,

        "labour_recovery_cost": 60000,
        "asset_recovery_cost": 12000,
        "material_recovery_cost": 0,
        "overhead_absorbed_cost": 23000,

        "required_labour_recovery_rate": 60,
        "required_labour_recovery_rate_per_recovery_hour": 60,
        "required_asset_recovery_per_recovery_hour": 12,
        "required_material_recovery_per_recovery_hour": 0,
        "overhead_absorbed_cost_per_recovery_hour": 23,
        "required_asset_recovery": 12000,
        "required_material_recovery": 0,

        "share_not_balanced": False,
        "no_productive_output": False,
        "no_recovery_hours": False,
        "asset_recovery_without_assets": False,
        "labour_recovery_without_labour": False,
    }

    checks = [
        make_check(variable_name, expected, actual.get(variable_name))
        for variable_name, expected in expected_values.items()
    ]

    warnings = actual.get("warnings", [])
    blocked_warning_keys = [
        "business_summary_not_ready",
        "upstream_model_not_ready",
        "no_productive_output",
        "missing_labour_cost",
        "missing_productive_asset_utilisation",
        "share_not_balanced",
    ]

    for warning_key in blocked_warning_keys:
        checks.append(
            CalculationCheckResult(
                variable_name=f"warnings_excludes_{warning_key}",
                expected=False,
                actual=warning_key in warnings if isinstance(warnings, list) else None,
                difference=None,
                passed=isinstance(warnings, list) and warning_key not in warnings,
                notes=(
                    "PASS"
                    if isinstance(warnings, list) and warning_key not in warnings
                    else f"Unexpected warning found: {warning_key}"
                ),
            )
        )

    all_passed = all(check.passed for check in checks)

    return ControlledTestResult(
        test_name="Recovery Summary hours-based controlled test",
        module_name="Recovery Summary",
        function_name="calculateRecoverySummary",
        status="validated" if all_passed else "failed_validation",
        selected_call_shape=payload.get("selected_call_shape"),
        checks=checks,
        raw_actual_output=actual,
        attempted_call_shapes=payload.get("attempts", []),
        error=None,
        notes=(
            "Controlled Recovery Summary hours-based outputs matched expected values."
            if all_passed
            else "One or more Recovery Summary outputs did not match expected values."
        ),
    )


# ============================================================
# Controlled Cost Allocation test
# ============================================================

def create_cost_allocation_test_script() -> Path:
    """Create a temporary Node .mjs script that calls calculate_cost_allocation."""
    TEMP_DIR.mkdir(parents=True, exist_ok=True)
    script_path = TEMP_DIR / "cost_allocation_controlled_test.mjs"

    cost_allocation_path = normalise_path_for_node(
        PROJECT_ROOT / "lib" / "calculations" / "costAllocationRules.js"
    )

    script = f"""
import {{ pathToFileURL }} from "url";

const modulePath = {json.dumps(cost_allocation_path)};
const moduleUrl = pathToFileURL(modulePath).href;

const importedModule = await import(moduleUrl);
const calculateCostAllocation = importedModule.calculate_cost_allocation;

if (typeof calculateCostAllocation !== "function") {{
  console.log(JSON.stringify({{
    success: false,
    error: "calculate_cost_allocation export was not found or is not a function.",
    selected_call_shape: null,
    actual: null,
    attempts: []
  }}, null, 2));
  process.exit(0);
}}

const input = {{
  recovery_summary_ready: true,
  active_recovery_model: "hybrid",
  recovery_model: "hybrid",

  recovery_plan_target_per_driver: 95,
  recovery_plan_split: {{
    labour_share_percent: 63.16,
    asset_share_percent: 12.63,
    material_share_percent: 0,
    overhead_absorbed_percent: 24.21,
    overhead_share_percent: 24.21,
  }},
  component_required_recovery: {{
    labour: {{
      share_percent: 63.16,
      recovery_cost: 60000,
      required_recovery_rate: 60,
    }},
    asset: {{
      share_percent: 12.63,
      recovery_cost: 12000,
      required_recovery: 12000,
    }},
    material: {{
      share_percent: 0,
      recovery_cost: 0,
      required_recovery: 0,
    }},
    overhead: {{
      share_percent: 24.21,
      recovery_cost: 23000,
    }},
  }},

  labour_share_percent: 63.16,
  asset_share_percent: 12.63,
  material_share_percent: 0,
  overhead_absorbed_percent: 24.21,
  overhead_share_percent: 24.21,

  total_people_cost_annual: 60000,
  total_asset_cost_annual: 12000,
  total_business_overheads: 23000,
  total_cost_burden: 95000,

  labour_recovery_cost: 60000,
  asset_recovery_cost: 12000,
  material_recovery_cost: 0,
  overhead_absorbed_cost: 23000,

  required_labour_recovery_rate: 60,
  required_asset_recovery: 12000,
  required_material_recovery: 0,
  recovery_hours_used: 1000,
  required_recovery_rate: 95,
  actual_recovery_rate: 100,
  profit_or_deficit_per_recovery_hour: 5,

  material_recovery_included: false,
  asset_recovery_included: true,
  has_productive_asset_recovery_base: true,

  business_type: "labour_based",
  activity_driver_type: "hours",
  activity_driver_value: 1000,
  margin_pool: 150000,
  net_position: 0,
  model_trust_state: "ready",

  active_staff: [
    {{
      staff_id: "staff_test_001",
      staff_name: "Test Operator",
      productive_hours: 1000,
      total_labour_cost_annual: 60000,
      productive_labour_cost_rate: 60,
    }},
  ],

  productive_labour_type_rows: [
    {{
      labour_type_id: "staff_test_001",
      labour_type_label: "Test Operator",
      total_productive_hours: 1000,
      total_labour_cost: 60000,
      weighted_recovery_rate: 60,
      source_staff_ids: ["staff_test_001"],
    }},
  ],

  active_assets: [
    {{
      asset_id: "asset_test_001",
      asset_name: "Test Excavator",
      asset_type: "productive",
      base_asset_cost_annual: 12000,
      total_asset_cost_annual: 12000,
      asset_recovery_cost_annual: 12000,
      utilisation_hours_annual: 1000,
      asset_recovery_hours_used: 1000,
    }},
  ],

  operational_groups: [
    {{
      group_id: "group_test_001",
      group_name: "Test Working Unit",
      required_staff_ids: ["staff_test_001"],
      required_asset_ids: ["asset_test_001"],
      is_active: true,
    }},
  ],

  asset_labour_links: [],
  asset_recovery_rows: [],
  operational_group_recovery_rows: [],
}};

const result = calculateCostAllocation(input);

console.log(JSON.stringify({{
  success: true,
  error: null,
  selected_call_shape: "single_object_current_contract",
  actual: result,
  attempts: [
    {{
      name: "single_object_current_contract",
      success: true,
      useful_output: true,
      error: null
    }}
  ],
}}, null, 2));
"""

    script_path.write_text(script, encoding="utf-8")
    return script_path


def run_cost_allocation_controlled_test() -> ControlledTestResult:
    """Run the controlled Cost Allocation valid-structure test through Node."""
    script_path = create_cost_allocation_test_script()

    code, stdout, stderr = run_command(
        build_node_command(script_path),
        PROJECT_ROOT,
    )

    if code != 0:
        return ControlledTestResult(
            test_name="Cost Allocation valid structure controlled test",
            module_name="Cost Allocation",
            function_name="calculate_cost_allocation",
            status="failed_validation",
            selected_call_shape=None,
            checks=[],
            raw_actual_output=None,
            attempted_call_shapes=[],
            error=stderr or stdout or "Node test runner failed.",
            notes="The Node adapter failed before returning a result.",
        )

    try:
        payload = json.loads(stdout)
    except json.JSONDecodeError as exc:
        return ControlledTestResult(
            test_name="Cost Allocation valid structure controlled test",
            module_name="Cost Allocation",
            function_name="calculate_cost_allocation",
            status="failed_validation",
            selected_call_shape=None,
            checks=[],
            raw_actual_output=None,
            attempted_call_shapes=[],
            error=f"Could not parse Node output as JSON: {exc}\nOutput:\n{stdout}",
            notes="The Node adapter returned invalid JSON.",
        )

    if not payload.get("success"):
        return ControlledTestResult(
            test_name="Cost Allocation valid structure controlled test",
            module_name="Cost Allocation",
            function_name="calculate_cost_allocation",
            status="failed_validation",
            selected_call_shape=payload.get("selected_call_shape"),
            checks=[],
            raw_actual_output=payload.get("actual"),
            attempted_call_shapes=payload.get("attempts", []),
            error=payload.get("error"),
            notes="No usable Cost Allocation output was returned.",
        )

    actual = payload.get("actual") or {}

    expected_values = {
        "active_recovery_model": "hybrid",
        "recovery_model": "hybrid",
        "recovery_plan_target_per_driver": 95,

        "labour_share_percent": 63.16,
        "asset_share_percent": 12.63,
        "material_share_percent": 0,
        "overhead_absorbed_percent": 24.21,
        "overhead_share_percent": 24.21,

        "labour_recovery_cost": 60000,
        "asset_recovery_cost": 12000,
        "material_recovery_cost": 0,
        "overhead_absorbed_cost": 23000,

        "required_labour_recovery_rate": 60,
        "required_asset_recovery": 12000,
        "required_material_recovery": 0,
        "recovery_hours_used": 1000,
        "required_recovery_rate": 95,
        "actual_recovery_rate": 100,
        "profit_or_deficit_per_recovery_hour": 5,

        "material_recovery_included": False,
        "asset_recovery_included": True,
        "has_productive_asset_recovery_base": True,
        "productive_asset_count": 1,
        "support_asset_count": 0,

        "productive_asset_base_cost": 12000,
        "support_asset_base_cost": 0,
        "productive_asset_allocated_overhead_cost": 0,
        "support_asset_allocated_overhead_cost": 0,
        "productive_asset_recovery_cost": 12000,
        "support_asset_recovery_cost": 0,
        "total_allocated_asset_overhead_cost": 0,
        "total_asset_recovery_cost": 12000,

        "total_grouped_labour_cost": 60000,
        "total_grouped_asset_cost": 12000,
        "total_grouped_overhead_cost": 23000,
        "total_grouped_operating_cost": 95000,
        "unassigned_labour_cost": 0,
        "unassigned_asset_cost": 0,
        "unassigned_overhead_cost": 0,
        "total_unassigned_cost": 0,
        "productive_asset_utilisation_hours_annual": 1000,
        "group_recovery_basis_label": "Operating hours",
        "group_required_recovery_rate": 95,

        "business_type": "labour_based",
        "activity_driver_type": "hours",
        "activity_driver_value": 1000,
        "margin_pool": 150000,
        "total_cost_burden": 95000,
        "net_position": 0,
        "model_trust_state": "ready",

        "linked_staff_count": 1,
        "linked_labour_driver_count": 1,
        "unlinked_staff_count": 0,
        "linked_asset_count": 1,
        "unlinked_asset_count": 0,

        "total_active_staff": 1,
        "total_active_assets": 1,
        "total_operational_groups": 1,
        "valid_operational_groups": 1,
        "invalid_operational_groups": 0,

        "structure_valid": True,
        "staff_coverage_percent": 100,
        "asset_coverage_percent": 100,
        "group_coverage_percent": 100,

        "external_delivery_enabled": False,
        "external_delivery_required": False,
        "internal_capacity_shortfall": False,
    }

    checks = [
        make_check(variable_name, expected, actual.get(variable_name))
        for variable_name, expected in expected_values.items()
    ]

    list_expectations = {
        "setup_warnings": [],
        "structural_warnings": [],
        "allocation_warnings": [],
        "duplicate_link_warnings": [],
        "orphan_warnings": [],
        "group_validation_warnings": [],
    }

    for variable_name, expected in list_expectations.items():
        actual_value = actual.get(variable_name)
        checks.append(
            CalculationCheckResult(
                variable_name=variable_name,
                expected=expected,
                actual=actual_value,
                difference=None,
                passed=actual_value == expected,
                notes="PASS" if actual_value == expected else "Expected empty warning list.",
            )
        )

    all_passed = all(check.passed for check in checks)

    return ControlledTestResult(
        test_name="Cost Allocation valid structure controlled test",
        module_name="Cost Allocation",
        function_name="calculate_cost_allocation",
        status="validated" if all_passed else "failed_validation",
        selected_call_shape=payload.get("selected_call_shape"),
        checks=checks,
        raw_actual_output=actual,
        attempted_call_shapes=payload.get("attempts", []),
        error=None,
        notes=(
            "Controlled Cost Allocation valid-structure outputs matched expected values."
            if all_passed
            else "One or more Cost Allocation outputs did not match expected values."
        ),
    )

# ============================================================
# Controlled Cost Allocation invalid-structure test
# ============================================================

def create_cost_allocation_invalid_structure_test_script() -> Path:
    """Create a temporary Node .mjs script that proves Cost Allocation rejects invalid structure."""
    TEMP_DIR.mkdir(parents=True, exist_ok=True)
    script_path = TEMP_DIR / "cost_allocation_invalid_structure_test.mjs"

    cost_allocation_path = normalise_path_for_node(
        PROJECT_ROOT / "lib" / "calculations" / "costAllocationRules.js"
    )

    script = f"""
import {{ pathToFileURL }} from "url";

const modulePath = {json.dumps(cost_allocation_path)};
const moduleUrl = pathToFileURL(modulePath).href;

const importedModule = await import(moduleUrl);
const calculateCostAllocation = importedModule.calculate_cost_allocation;

if (typeof calculateCostAllocation !== "function") {{
  console.log(JSON.stringify({{
    success: false,
    error: "calculate_cost_allocation export was not found or is not a function.",
    selected_call_shape: null,
    actual: null,
    attempts: []
  }}, null, 2));
  process.exit(0);
}}

const input = {{
  recovery_summary_ready: true,
  active_recovery_model: "hybrid",
  recovery_model: "hybrid",

  recovery_plan_target_per_driver: 95,
  recovery_plan_split: {{
    labour_share_percent: 63.16,
    asset_share_percent: 12.63,
    material_share_percent: 0,
    overhead_absorbed_percent: 24.21,
    overhead_share_percent: 24.21,
  }},

  component_required_recovery: {{
    labour: {{
      share_percent: 63.16,
      recovery_cost: 60000,
      required_recovery_rate: 60,
    }},
    asset: {{
      share_percent: 12.63,
      recovery_cost: 12000,
      required_recovery: 12000,
    }},
    material: {{
      share_percent: 0,
      recovery_cost: 0,
      required_recovery: 0,
    }},
    overhead: {{
      share_percent: 24.21,
      recovery_cost: 23000,
    }},
  }},

  labour_share_percent: 63.16,
  asset_share_percent: 12.63,
  material_share_percent: 0,
  overhead_absorbed_percent: 24.21,
  overhead_share_percent: 24.21,

  total_people_cost_annual: 60000,
  total_asset_cost_annual: 12000,
  total_business_overheads: 23000,
  total_cost_burden: 95000,

  labour_recovery_cost: 60000,
  asset_recovery_cost: 12000,
  material_recovery_cost: 0,
  overhead_absorbed_cost: 23000,

  required_labour_recovery_rate: 60,
  required_asset_recovery: 12000,
  required_material_recovery: 0,
  recovery_hours_used: 1000,
  required_recovery_rate: 95,
  actual_recovery_rate: 100,
  profit_or_deficit_per_recovery_hour: 5,

  material_recovery_included: false,
  asset_recovery_included: true,
  has_productive_asset_recovery_base: true,

  business_type: "labour_based",
  activity_driver_type: "hours",
  activity_driver_value: 1000,
  margin_pool: 150000,
  net_position: 0,
  model_trust_state: "ready",

  active_staff: [
    {{
      staff_id: "staff_test_001",
      staff_name: "Test Operator",
      productive_hours: 1000,
      total_labour_cost_annual: 60000,
      productive_labour_cost_rate: 60,
    }},
  ],

  productive_labour_type_rows: [
    {{
      labour_type_id: "staff_test_001",
      labour_type_label: "Test Operator",
      total_productive_hours: 1000,
      total_labour_cost: 60000,
      weighted_recovery_rate: 60,
      source_staff_ids: ["staff_test_001"],
    }},
  ],

  active_assets: [
    {{
      asset_id: "asset_test_001",
      asset_name: "Test Excavator",
      asset_type: "productive",
      base_asset_cost_annual: 12000,
      total_asset_cost_annual: 12000,
      asset_recovery_cost_annual: 12000,
      utilisation_hours_annual: 1000,
      asset_recovery_hours_used: 1000,
    }},
  ],

  operational_groups: [
    {{
      group_id: "group_invalid_001",
      group_name: "Broken Working Unit",
      required_staff_ids: ["missing_staff_999"],
      required_asset_ids: ["missing_asset_999"],
      is_active: true,
    }},
  ],

  asset_labour_links: [],
  asset_recovery_rows: [],
  operational_group_recovery_rows: [],
}};

const result = calculateCostAllocation(input);

console.log(JSON.stringify({{
  success: true,
  error: null,
  selected_call_shape: "single_object_current_contract",
  actual: result,
  attempts: [
    {{
      name: "single_object_current_contract",
      success: true,
      useful_output: true,
      error: null
    }}
  ],
}}, null, 2));
"""

    script_path.write_text(script, encoding="utf-8")
    return script_path


def run_cost_allocation_invalid_structure_controlled_test() -> ControlledTestResult:
    """Run the controlled Cost Allocation invalid-structure test through Node."""
    script_path = create_cost_allocation_invalid_structure_test_script()

    code, stdout, stderr = run_command(
        build_node_command(script_path),
        PROJECT_ROOT,
    )

    if code != 0:
        return ControlledTestResult(
            test_name="Cost Allocation invalid structure controlled test",
            module_name="Cost Allocation",
            function_name="calculate_cost_allocation",
            status="failed_validation",
            selected_call_shape=None,
            checks=[],
            raw_actual_output=None,
            attempted_call_shapes=[],
            error=stderr or stdout or "Node test runner failed.",
            notes="The Node adapter failed before returning a result.",
        )

    try:
        payload = json.loads(stdout)
    except json.JSONDecodeError as exc:
        return ControlledTestResult(
            test_name="Cost Allocation invalid structure controlled test",
            module_name="Cost Allocation",
            function_name="calculate_cost_allocation",
            status="failed_validation",
            selected_call_shape=None,
            checks=[],
            raw_actual_output=None,
            attempted_call_shapes=[],
            error=f"Could not parse Node output as JSON: {exc}\nOutput:\n{stdout}",
            notes="The Node adapter returned invalid JSON.",
        )

    if not payload.get("success"):
        return ControlledTestResult(
            test_name="Cost Allocation invalid structure controlled test",
            module_name="Cost Allocation",
            function_name="calculate_cost_allocation",
            status="failed_validation",
            selected_call_shape=payload.get("selected_call_shape"),
            checks=[],
            raw_actual_output=payload.get("actual"),
            attempted_call_shapes=payload.get("attempts", []),
            error=payload.get("error"),
            notes="No usable Cost Allocation output was returned.",
        )

    actual = payload.get("actual") or {}

    expected_values = {
        "structure_valid": False,

        # Staff/assets exist and are visible to Cost Allocation, but the working unit is invalid.
        # So staff/asset coverage remains 100, while group coverage fails.
        "linked_staff_count": 1,
        "unlinked_staff_count": 0,
        "linked_asset_count": 1,
        "unlinked_asset_count": 0,

        "total_active_staff": 1,
        "total_active_assets": 1,
        "total_operational_groups": 1,
        "valid_operational_groups": 0,
        "invalid_operational_groups": 1,

        "staff_coverage_percent": 100,
        "asset_coverage_percent": 100,
        "group_coverage_percent": 0,

        "total_grouped_labour_cost": 0,
        "total_grouped_asset_cost": 0,
        "total_grouped_overhead_cost": 0,
        "total_grouped_operating_cost": 0,

        "unassigned_labour_cost": 60000,
        "unassigned_asset_cost": 12000,
        "unassigned_overhead_cost": 23000,
        "total_unassigned_cost": 95000,

        "allocation_status": "not_supported",
        "allocation_dependency_type": "asset_structure",
    }

    checks = [
        make_check(variable_name, expected, actual.get(variable_name))
        for variable_name, expected in expected_values.items()
    ]
    

    group_validation_warnings = actual.get("group_validation_warnings", [])
    checks.append(
        CalculationCheckResult(
            variable_name="group_validation_warnings_not_empty",
            expected=True,
            actual=len(group_validation_warnings) > 0
            if isinstance(group_validation_warnings, list)
            else None,
            difference=None,
            passed=isinstance(group_validation_warnings, list)
            and len(group_validation_warnings) > 0,
            notes=(
                "PASS"
                if isinstance(group_validation_warnings, list)
                and len(group_validation_warnings) > 0
                else "Invalid group should produce group validation warnings."
            ),
        )
    )

    all_passed = all(check.passed for check in checks)

    return ControlledTestResult(
        test_name="Cost Allocation invalid structure controlled test",
        module_name="Cost Allocation",
        function_name="calculate_cost_allocation",
        status="validated" if all_passed else "failed_validation",
        selected_call_shape=payload.get("selected_call_shape"),
        checks=checks,
        raw_actual_output=actual,
        attempted_call_shapes=payload.get("attempts", []),
        error=None,
        notes=(
            "Controlled Cost Allocation invalid-structure outputs matched expected failure behaviour."
            if all_passed
            else "One or more Cost Allocation invalid-structure outputs did not match expected failure behaviour."
        ),
    )
# ============================================================
# Controlled Recovery Outcome test
# ============================================================

def create_recovery_outcome_test_script() -> Path:
    """Create a temporary Node .mjs script that calls calculateRecoveryOutcome."""
    TEMP_DIR.mkdir(parents=True, exist_ok=True)
    script_path = TEMP_DIR / "recovery_outcome_controlled_test.mjs"

    recovery_outcome_path = normalise_path_for_node(
        PROJECT_ROOT / "lib" / "calculations" / "recoveryOutcomeCalculations.js"
    )

    script = f"""
import {{ pathToFileURL }} from "url";

const modulePath = {json.dumps(recovery_outcome_path)};
const moduleUrl = pathToFileURL(modulePath).href;

const importedModule = await import(moduleUrl);
const calculateRecoveryOutcome = importedModule.calculateRecoveryOutcome;

if (typeof calculateRecoveryOutcome !== "function") {{
  console.log(JSON.stringify({{
    success: false,
    error: "calculateRecoveryOutcome export was not found or is not a function.",
    selected_call_shape: null,
    actual: null,
    attempts: []
  }}, null, 2));
  process.exit(0);
}}

const recovery_summary = {{
  business_summary_ready: true,
  recovery_summary_ready: true,
  recovery_summary_status: "ready",
  model_trust_state: "ready",

  business_type: "labour_based",
  recovery_model: "hybrid",
  active_recovery_model: "hybrid",

  activity_driver_type: "hours",
  activity_driver_label: "Selected recovery hours",
  activity_driver_value: 1000,

  recovery_plan_target_per_driver: 95,
  required_recovery_per_driver: 95,
  current_margin_per_driver: 100,
  recovery_gap_per_driver: 5,

  recovery_plan_split: {{
    labour_share_percent: 63.16,
    asset_share_percent: 12.63,
    overhead_share_percent: 24.21,
  }},

  component_required_recovery: {{
    labour: {{
      share_percent: 63.16,
      recovery_cost: 60000,
      required_recovery_rate: 60,
    }},
    asset: {{
      share_percent: 12.63,
      recovery_cost: 12000,
      required_recovery: 12000,
    }},
    overhead: {{
      share_percent: 24.21,
      recovery_cost: 23000,
    }},
  }},

  labour_share_percent: 63.16,
  asset_share_percent: 12.63,
  overhead_share_percent: 24.21,

  labour_recovery_cost: 60000,
  asset_recovery_cost: 12000,
  overhead_absorbed_cost: 23000,

  required_labour_recovery_rate: 60,
  required_asset_recovery: 12000,

  margin_pool: 150000,
  total_cost_burden: 95000,
  net_position: 55000,

  warnings: [],
  recovery_summary_warnings: [],
}};

const cost_allocation = {{
  allocation_status: "ready",
  allocation_dependency_type: "none",

  structure_valid: true,
  staff_coverage_percent: 100,
  asset_coverage_percent: 100,
  group_coverage_percent: 100,

  linked_staff_count: 1,
  unlinked_staff_count: 0,
  linked_asset_count: 1,
  unlinked_asset_count: 0,
  valid_operational_groups: 1,
  invalid_operational_groups: 0,

  external_delivery_enabled: false,
  external_delivery_required: false,
  internal_capacity_shortfall: false,

  allocation_warnings: [],
  duplicate_link_warnings: [],
  orphan_warnings: [],
  group_validation_warnings: [],
}};

const result = calculateRecoveryOutcome({{
  recovery_summary,
  cost_allocation,
}});

console.log(JSON.stringify({{
  success: true,
  error: null,
  selected_call_shape: "single_object_current_contract",
  actual: result,
  attempts: [
    {{
      name: "single_object_current_contract",
      success: true,
      useful_output: true,
      error: null
    }}
  ],
}}, null, 2));
"""

    script_path.write_text(script, encoding="utf-8")
    return script_path


def run_recovery_outcome_controlled_test() -> ControlledTestResult:
    """Run the controlled Recovery Outcome healthy-structure test through Node."""
    script_path = create_recovery_outcome_test_script()

    code, stdout, stderr = run_command(
        build_node_command(script_path),
        PROJECT_ROOT,
    )

    if code != 0:
        return ControlledTestResult(
            test_name="Recovery Outcome healthy controlled test",
            module_name="Recovery Outcome",
            function_name="calculateRecoveryOutcome",
            status="failed_validation",
            selected_call_shape=None,
            checks=[],
            raw_actual_output=None,
            attempted_call_shapes=[],
            error=stderr or stdout or "Node test runner failed.",
            notes="The Node adapter failed before returning a result.",
        )

    try:
        payload = json.loads(stdout)
    except json.JSONDecodeError as exc:
        return ControlledTestResult(
            test_name="Recovery Outcome healthy controlled test",
            module_name="Recovery Outcome",
            function_name="calculateRecoveryOutcome",
            status="failed_validation",
            selected_call_shape=None,
            checks=[],
            raw_actual_output=None,
            attempted_call_shapes=[],
            error=f"Could not parse Node output as JSON: {exc}\nOutput:\n{stdout}",
            notes="The Node adapter returned invalid JSON.",
        )

    if not payload.get("success"):
        return ControlledTestResult(
            test_name="Recovery Outcome healthy controlled test",
            module_name="Recovery Outcome",
            function_name="calculateRecoveryOutcome",
            status="failed_validation",
            selected_call_shape=payload.get("selected_call_shape"),
            checks=[],
            raw_actual_output=payload.get("actual"),
            attempted_call_shapes=payload.get("attempts", []),
            error=payload.get("error"),
            notes="No usable Recovery Outcome output was returned.",
        )

    actual = payload.get("actual") or {}

    expected_values = {
        "business_outcome_status": "viable",
        "outcome_status": "viable",
        "primary_constraint_key": "healthy",
        "primary_constraint_title": "Business model is supported",
        "recommended_action": "Continue to Business Modelling when you are ready to test scenarios.",

        "active_recovery_model": "hybrid",
        "recovery_model": "hybrid",
        "recovery_plan_target_per_driver": 95,

        "business_type": "labour_based",
        "activity_driver_type": "hours",
        "activity_driver_value": 1000,

        "required_recovery_per_driver": 95,
        "current_margin_per_driver": 100,
        "recovery_gap_per_driver": 5,

        "labour_share_percent": 63.2,
        "asset_share_percent": 12.6,
        "overhead_share_percent": 24.2,

        "labour_recovery_cost": 60000,
        "asset_recovery_cost": 12000,
        "overhead_absorbed_cost": 23000,

        "required_labour_recovery_rate": 60,
        "required_asset_recovery": 12000,

        "margin_pool": 150000,
        "total_cost_burden": 95000,
        "net_position": 55000,
        "model_trust_state": "ready",

        "allocation_status": "ready",
        "allocation_dependency_type": "none",
        "structure_valid": True,

        "staff_coverage_percent": 100,
        "asset_coverage_percent": 100,
        "group_coverage_percent": 100,

        "linked_staff_count": 1,
        "unlinked_staff_count": 0,
        "linked_asset_count": 1,
        "unlinked_asset_count": 0,
        "valid_operational_groups": 1,
        "invalid_operational_groups": 0,

        "external_delivery_enabled": False,
        "external_delivery_required": False,
        "internal_capacity_shortfall": 0,

        "dependency_level": "none",
        "business_model_health": "healthy",
    }

    checks = [
        make_check(variable_name, expected, actual.get(variable_name))
        for variable_name, expected in expected_values.items()
    ]

    list_expectations = {
        "allocation_warnings": [],
        "duplicate_link_warnings": [],
        "orphan_warnings": [],
        "group_validation_warnings": [],
        "decision_warnings": [],
    }

    for variable_name, expected in list_expectations.items():
        actual_value = actual.get(variable_name)
        checks.append(
            CalculationCheckResult(
                variable_name=variable_name,
                expected=expected,
                actual=actual_value,
                difference=None,
                passed=actual_value == expected,
                notes="PASS" if actual_value == expected else "Expected empty warning list.",
            )
        )

    all_passed = all(check.passed for check in checks)

    return ControlledTestResult(
        test_name="Recovery Outcome healthy controlled test",
        module_name="Recovery Outcome",
        function_name="calculateRecoveryOutcome",
        status="validated" if all_passed else "failed_validation",
        selected_call_shape=payload.get("selected_call_shape"),
        checks=checks,
        raw_actual_output=actual,
        attempted_call_shapes=payload.get("attempts", []),
        error=None,
        notes=(
            "Controlled Recovery Outcome healthy outputs matched expected values."
            if all_passed
            else "One or more Recovery Outcome outputs did not match expected values."
        ),
    )


# ============================================================
# Result builders
# ============================================================

def build_status(
    node_available: bool,
    module_results: list[ModuleDiscoveryResult],
    controlled_tests: list[ControlledTestResult],
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

    failed_tests = [
        item for item in controlled_tests if item.status == "failed_validation"
    ]
    if failed_tests:
        return "failed_validation"

    if any(not item.loadable for item in module_results):
        return "warning_unexplained_variance"

    return "validated"


def build_summary(
    node_available: bool,
    node_version: str | None,
    module_results: list[ModuleDiscoveryResult],
    controlled_tests: list[ControlledTestResult],
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
    total_controlled_tests = len(controlled_tests)
    passed_controlled_tests = sum(
        1 for item in controlled_tests if item.status == "validated"
    )
    failed_controlled_tests = sum(
        1 for item in controlled_tests if item.status == "failed_validation"
    )

    return {
        "node_available": node_available,
        "node_version": node_version,
        "total_modules_checked": total_modules,
        "existing_modules": existing_modules,
        "loadable_modules": loadable_modules,
        "critical_modules": critical_modules,
        "failed_critical_modules": failed_critical_modules,
        "total_controlled_tests": total_controlled_tests,
        "passed_controlled_tests": passed_controlled_tests,
        "failed_controlled_tests": failed_controlled_tests,
    }


def build_audit_result() -> CalculationAuditResult:
    """Build the full calculation audit result."""
    node_available, node_version_or_error = check_node()

    if not node_available:
        module_results: list[ModuleDiscoveryResult] = []
        controlled_tests: list[ControlledTestResult] = []
        status = "untrusted"
        summary = build_summary(False, None, module_results, controlled_tests)
        summary["node_error"] = node_version_or_error

        return CalculationAuditResult(
            node_available=False,
            node_version=None,
            module_results=module_results,
            controlled_tests=controlled_tests,
            status=status,
            summary=summary,
        )

    module_results = discover_module_exports()
    controlled_tests = [
    run_cost_summary_controlled_test(),
    run_recovery_summary_controlled_test(),
    run_cost_allocation_controlled_test(),
    run_cost_allocation_invalid_structure_controlled_test(),
    run_recovery_outcome_controlled_test(),
]

    status = build_status(node_available, module_results, controlled_tests)
    summary = build_summary(
        node_available,
        node_version_or_error,
        module_results,
        controlled_tests,
    )

    return CalculationAuditResult(
        node_available=True,
        node_version=node_version_or_error,
        module_results=module_results,
        controlled_tests=controlled_tests,
        status=status,
        summary=summary,
    )


# ============================================================
# Report writers
# ============================================================

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
        "controlled_tests": [asdict(item) for item in result.controlled_tests],
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

    lines.append("CONTROLLED TESTS")
    lines.append("-" * 80)

    if not result.controlled_tests:
        lines.append("No controlled tests were run.")

    for test in result.controlled_tests:
        lines.append("")
        lines.append(f"Test: {test.test_name}")
        lines.append(f"Module: {test.module_name}")
        lines.append(f"Function: {test.function_name}")
        lines.append(f"Status: {test.status}")
        lines.append(f"Selected call shape: {test.selected_call_shape or 'None'}")
        lines.append(f"Notes: {test.notes}")

        if test.error:
            lines.append("Error:")
            lines.append(test.error)

        if test.checks:
            lines.append("")
            lines.append("Checks:")
            for check in test.checks:
                status_label = "PASS" if check.passed else "FAIL"
                lines.append(
                    f"  {status_label} {check.variable_name}: "
                    f"expected={check.expected} actual={check.actual} "
                    f"difference={check.difference}"
                )

        if test.raw_actual_output is not None:
            lines.append("")
            lines.append("Raw actual output:")
            lines.append(json.dumps(test.raw_actual_output, indent=2))

        if test.attempted_call_shapes:
            lines.append("")
            lines.append("Attempted call shapes:")
            for attempt in test.attempted_call_shapes:
                lines.append(
                    f"  - {attempt.get('name')}: "
                    f"success={attempt.get('success')} "
                    f"useful_output={attempt.get('useful_output')}"
                )
                if attempt.get("error"):
                    lines.append(f"    error={attempt.get('error')}")

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
        "This runner discovers calculation exports and runs controlled tests "
        "against actual JS calculation functions."
    )
    lines.append("No production files were changed by this runner.")

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
    print("Controlled tests:")
    for test in result.controlled_tests:
        print(f"  {test.test_name}: {test.status}")

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