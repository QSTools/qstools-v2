"""
QS Tools — Live Audit Snapshot Builder
v1.0

Purpose:
Build a reconciliation-ready audit snapshot for QS Tools.

This script creates:

reports/audit/live_snapshots/current_audit_snapshot.json

Current behaviour:
- uses a mock app-state input file if available
- creates a starter mock app-state file if missing
- normalises app-state values into the reconciliation snapshot contract
- does not change production app files

Later:
- the app can export real state into mock_app_state.json or another JSON file
- this builder can convert that export into current_audit_snapshot.json
"""

from __future__ import annotations

import argparse
import json
from dataclasses import asdict, dataclass
from datetime import date
from pathlib import Path
from typing import Any


# ============================================================
# Paths
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]
LIVE_SNAPSHOT_DIR = PROJECT_ROOT / "reports" / "audit" / "live_snapshots"

DEFAULT_APP_STATE_INPUT = LIVE_SNAPSHOT_DIR / "mock_app_state.json"
DEFAULT_SNAPSHOT_OUTPUT = LIVE_SNAPSHOT_DIR / "current_audit_snapshot.json"


# ============================================================
# Data models
# ============================================================

@dataclass
class SnapshotBuildResult:
    status: str
    input_path: str
    output_path: str
    snapshot_name: str
    pnl_baseline_cost: float
    qs_tools_calculated_cost: float
    gross_variance_preview: float
    notes: str


# ============================================================
# Helpers
# ============================================================

def round_money(value: Any) -> float:
    """Convert a value to a rounded money float."""
    try:
        return round(float(value), 2)
    except (TypeError, ValueError):
        return 0.0


def load_json(path: Path) -> dict[str, Any]:
    """Load JSON object from disk."""
    if not path.exists():
        raise FileNotFoundError(f"Input file not found: {path}")

    payload = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        raise ValueError("Input JSON root must be an object.")

    return payload


def write_json(path: Path, payload: dict[str, Any]) -> None:
    """Write JSON object to disk."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def get_nested(payload: dict[str, Any], *keys: str, default: Any = 0) -> Any:
    """Safely read a nested dictionary value."""
    current: Any = payload

    for key in keys:
        if not isinstance(current, dict):
            return default
        current = current.get(key, default)

    return current


# ============================================================
# Starter mock app-state
# ============================================================

def build_default_mock_app_state() -> dict[str, Any]:
    """
    Build a starter app-state export.

    This is not production app state.
    It is a simple file that proves the builder contract.
    """
    return {
        "snapshot_name": "Current QS Tools Audit Snapshot",
        "snapshot_source": "mock_app_state",
        "snapshot_date": date.today().isoformat(),

        "pnl": {
            "pnl_baseline_cost": 95000,
            "pnl_labour_cost": 60000,
            "pnl_asset_cost": 12000,
            "pnl_general_overheads": 23000,
            "pnl_depreciation": 0,
            "pnl_interest": 0
        },

        "cost_summary": {
            "total_people_cost_annual": 60000,
            "total_asset_cost_annual": 12000,
            "total_business_overheads": 23000,
            "total_cost_burden": 95000
        },

        "explained_variance": {
            "labour_model_variance": 0,
            "asset_model_variance": 0,
            "asset_finance_variance": 0,
            "depreciation_exclusion_variance": 0,
            "employee_overhead_mapping_variance": 0,
            "general_overhead_mapping_variance": 0,
            "cost_of_sales_mapping_variance": 0,
            "timing_variance": 0,
            "rounding_variance": 0,
            "unmapped_variance": 0
        },

        "notes": "Starter mock app-state export. Replace with real QS Tools exported state later."
    }


def ensure_mock_app_state(path: Path) -> None:
    """Create starter mock app-state file if it does not exist."""
    if path.exists():
        return

    write_json(path, build_default_mock_app_state())


# ============================================================
# Snapshot builder
# ============================================================

def build_reconciliation_snapshot(app_state: dict[str, Any]) -> dict[str, Any]:
    """Convert app-state JSON into reconciliation snapshot contract."""
    snapshot_name = str(
        app_state.get("snapshot_name")
        or "Current QS Tools Audit Snapshot"
    )

    snapshot_source = str(
        app_state.get("snapshot_source")
        or "app_state_export"
    )

    snapshot_date = str(
        app_state.get("snapshot_date")
        or date.today().isoformat()
    )

    pnl_baseline_cost = round_money(
        get_nested(app_state, "pnl", "pnl_baseline_cost")
    )

    pnl_labour_cost = round_money(
        get_nested(app_state, "pnl", "pnl_labour_cost")
    )

    pnl_asset_cost = round_money(
        get_nested(app_state, "pnl", "pnl_asset_cost")
    )

    pnl_general_overheads = round_money(
        get_nested(app_state, "pnl", "pnl_general_overheads")
    )

    pnl_depreciation = round_money(
        get_nested(app_state, "pnl", "pnl_depreciation")
    )

    pnl_interest = round_money(
        get_nested(app_state, "pnl", "pnl_interest")
    )

    total_people_cost_annual = round_money(
        get_nested(app_state, "cost_summary", "total_people_cost_annual")
    )

    total_asset_cost_annual = round_money(
        get_nested(app_state, "cost_summary", "total_asset_cost_annual")
    )

    total_business_overheads = round_money(
        get_nested(app_state, "cost_summary", "total_business_overheads")
    )

    total_cost_burden = round_money(
        get_nested(app_state, "cost_summary", "total_cost_burden")
    )

    if total_cost_burden == 0:
        total_cost_burden = round_money(
            total_people_cost_annual
            + total_asset_cost_annual
            + total_business_overheads
        )

    explained_variance = app_state.get("explained_variance", {})
    if not isinstance(explained_variance, dict):
        explained_variance = {}

    normalised_explained_variance = {
        "labour_model_variance": round_money(
            explained_variance.get("labour_model_variance", 0)
        ),
        "asset_model_variance": round_money(
            explained_variance.get("asset_model_variance", 0)
        ),
        "asset_finance_variance": round_money(
            explained_variance.get("asset_finance_variance", 0)
        ),
        "depreciation_exclusion_variance": round_money(
            explained_variance.get("depreciation_exclusion_variance", 0)
        ),
        "employee_overhead_mapping_variance": round_money(
            explained_variance.get("employee_overhead_mapping_variance", 0)
        ),
        "general_overhead_mapping_variance": round_money(
            explained_variance.get("general_overhead_mapping_variance", 0)
        ),
        "cost_of_sales_mapping_variance": round_money(
            explained_variance.get("cost_of_sales_mapping_variance", 0)
        ),
        "timing_variance": round_money(
            explained_variance.get("timing_variance", 0)
        ),
        "rounding_variance": round_money(
            explained_variance.get("rounding_variance", 0)
        ),
        "unmapped_variance": round_money(
            explained_variance.get("unmapped_variance", 0)
        ),
    }

    notes = str(
        app_state.get("notes")
        or "Built from QS Tools app-state export."
    )

    return {
        "snapshot_name": snapshot_name,
        "snapshot_source": snapshot_source,
        "snapshot_date": snapshot_date,

        "pnl": {
            "pnl_baseline_cost": pnl_baseline_cost,
            "pnl_labour_cost": pnl_labour_cost,
            "pnl_asset_cost": pnl_asset_cost,
            "pnl_general_overheads": pnl_general_overheads,
            "pnl_depreciation": pnl_depreciation,
            "pnl_interest": pnl_interest
        },

        "qs_tools": {
            "qs_tools_calculated_cost": total_cost_burden,
            "total_people_cost_annual": total_people_cost_annual,
            "total_asset_cost_annual": total_asset_cost_annual,
            "total_business_overheads": total_business_overheads,
            "total_cost_burden": total_cost_burden
        },

        "explained_variance": normalised_explained_variance,

        "notes": notes
    }


def build_snapshot(input_path: Path, output_path: Path) -> SnapshotBuildResult:
    """Build and write the reconciliation-ready snapshot."""
    app_state = load_json(input_path)
    snapshot = build_reconciliation_snapshot(app_state)

    write_json(output_path, snapshot)

    pnl_baseline_cost = round_money(
        get_nested(snapshot, "pnl", "pnl_baseline_cost")
    )
    qs_tools_calculated_cost = round_money(
        get_nested(snapshot, "qs_tools", "qs_tools_calculated_cost")
    )

    return SnapshotBuildResult(
        status="validated",
        input_path=str(input_path),
        output_path=str(output_path),
        snapshot_name=str(snapshot.get("snapshot_name")),
        pnl_baseline_cost=pnl_baseline_cost,
        qs_tools_calculated_cost=qs_tools_calculated_cost,
        gross_variance_preview=round_money(
            qs_tools_calculated_cost - pnl_baseline_cost
        ),
        notes="Live reconciliation snapshot built successfully.",
    )


# ============================================================
# CLI
# ============================================================

def parse_args() -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description="Build QS Tools live audit snapshot."
    )
    parser.add_argument(
        "--input",
        type=str,
        default=str(DEFAULT_APP_STATE_INPUT),
        help="Path to app-state JSON input.",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=str(DEFAULT_SNAPSHOT_OUTPUT),
        help="Path to reconciliation snapshot output.",
    )
    return parser.parse_args()


def resolve_path(path_text: str) -> Path:
    """Resolve relative paths from project root."""
    path = Path(path_text)
    if path.is_absolute():
        return path
    return PROJECT_ROOT / path


def main() -> None:
    args = parse_args()

    input_path = resolve_path(args.input)
    output_path = resolve_path(args.output)

    if input_path == DEFAULT_APP_STATE_INPUT:
        ensure_mock_app_state(input_path)

    result = build_snapshot(input_path=input_path, output_path=output_path)

    print("QS Tools Live Audit Snapshot Builder")
    print("-" * 60)
    print(f"Status: {result.status}")
    print(f"Input: {result.input_path}")
    print(f"Output: {result.output_path}")
    print(f"Snapshot: {result.snapshot_name}")
    print(f"P&L baseline cost: {result.pnl_baseline_cost}")
    print(f"QS Tools calculated cost: {result.qs_tools_calculated_cost}")
    print(f"Gross variance preview: {result.gross_variance_preview}")


if __name__ == "__main__":
    main()