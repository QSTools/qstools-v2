from pathlib import Path


# ============================================================
# QS Tools — Audit Layer Structure Builder
# v1.0
#
# Purpose:
# Creates the initial folder and file structure for:
# - variable register
# - variable flow tracing
# - calculation test runner
# - P&L reconciliation audit
#
# Safe to run multiple times.
# Existing files are NOT overwritten.
# ============================================================


PROJECT_ROOT = Path.cwd()


FOLDERS = [
    "tools/audit",
    "docs/audit",
    "reports/audit",
    "reports/audit/variable_trace_reports",
    "reports/audit/calculation_test_reports",
    "reports/audit/reconciliation_reports",
]


FILES = {
    "tools/audit/__init__.py": """# QS Tools Audit Package
""",

    "tools/audit/qs_variable_register.py": '''"""
QS Tools — Variable Register
v1.0

Purpose:
Holds the registered calculation and contract variables used by the audit tools.

Each variable record will include:
- variable_name
- owning_module
- owning_file
- variable_type
- calculation_source
- downstream_consumers
- must_balance_to_pnl
- test_required
- notes
"""


VARIABLE_REGISTER = []


def get_variable_register():
    """Return the full variable register."""
    return VARIABLE_REGISTER


def get_variable_names():
    """Return only registered variable names."""
    return [item.get("variable_name") for item in VARIABLE_REGISTER]


if __name__ == "__main__":
    print("QS Tools Variable Register")
    print(f"Registered variables: {len(VARIABLE_REGISTER)}")
''',

    "tools/audit/qs_variable_trace.py": '''"""
QS Tools — Variable Flow Trace
v1.0

Purpose:
Trace where a selected variable appears across the QS Tools codebase.

Future command:
python tools/audit/qs_variable_trace.py total_cost_burden
"""


def main():
    print("QS Tools Variable Trace")
    print("Not implemented yet.")


if __name__ == "__main__":
    main()
''',

    "tools/audit/qs_calc_test_runner.py": '''"""
QS Tools — Calculation Test Runner
v1.0

Purpose:
Run controlled calculation tests against the actual QS Tools calculation files.

Important:
This Python script should act as a runner only.
It should not become a duplicate calculation engine.
"""


def main():
    print("QS Tools Calculation Test Runner")
    print("Not implemented yet.")


if __name__ == "__main__":
    main()
''',

    "tools/audit/qs_reconciliation_audit.py": '''"""
QS Tools — P&L Reconciliation Audit
v1.0

Purpose:
Compare P&L baseline values against QS Tools calculated outputs.

Key principle:
Gross variance is not automatically an error.
Only unexplained variance is treated as a calculation or mapping risk.
"""


def main():
    print("QS Tools P&L Reconciliation Audit")
    print("Not implemented yet.")


if __name__ == "__main__":
    main()
''',

    "docs/audit/QS_Tools_Variable_Register_v1.0.txt": """# QS Tools — Variable Register v1.0

STATUS: INITIAL PLACEHOLDER

PURPOSE

This file is the master register of QS Tools variables.

Each variable should record:

- variable_name
- owning_module
- owning_file
- variable_type
- calculation_source
- downstream_consumers
- must_balance_to_pnl
- test_required
- notes

INITIAL MODULES TO REGISTER

1. Labour
2. Employee Overheads
3. Assets
4. General Overheads
5. P&L / Revenue / COGS
6. Cost Summary
7. Recovery Summary
8. Cost Allocation
9. Recovery Outcome
10. Budget / Business Outcome later

CORE PRINCIPLE

QS Tools must not trust itself by default.

Every major output must be:

- calculated
- traced
- validated
- reconciled
- explained
""",

    "docs/audit/QS_Tools_Audit_Layer_Build_Brief_v1.0.txt": """# QS Tools — Audit & Reconciliation Layer Build Brief v1.0

STATUS: INITIAL PLACEHOLDER

PURPOSE

Create a QS Tools audit and reconciliation layer that proves calculation integrity, variable flow, and final reconciliation back to source truth.

The audit layer must confirm that each major result is:

- calculated
- validated
- reconciled
- explained

KEY PRINCIPLE

Gross variance is not automatically an error.

Only unexplained variance is treated as possible calculation, mapping, or contract error.

AUDIT LAYER PARTS

1. Variable Register
2. Variable Flow Trace
3. Calculation Test Runner
4. P&L Reconciliation Audit

EXPECTED STRUCTURE

tools/audit/
  __init__.py
  qs_variable_register.py
  qs_variable_trace.py
  qs_calc_test_runner.py
  qs_reconciliation_audit.py

docs/audit/
  QS_Tools_Variable_Register_v1.0.txt
  QS_Tools_Audit_Layer_Build_Brief_v1.0.txt

reports/audit/
  README.txt
  variable_trace_reports/
  calculation_test_reports/
  reconciliation_reports/
""",

    "reports/audit/README.txt": """# QS Tools Audit Reports

This folder stores generated audit reports.

Subfolders:

- variable_trace_reports
- calculation_test_reports
- reconciliation_reports
""",

    "reports/audit/variable_trace_reports/.gitkeep": "",
    "reports/audit/calculation_test_reports/.gitkeep": "",
    "reports/audit/reconciliation_reports/.gitkeep": "",
}


def create_folders():
    print("Creating folders...")
    for folder in FOLDERS:
        path = PROJECT_ROOT / folder
        path.mkdir(parents=True, exist_ok=True)
        print(f"  OK folder: {folder}")


def create_files():
    print("\nCreating files...")
    for relative_path, content in FILES.items():
        path = PROJECT_ROOT / relative_path

        if path.exists():
            print(f"  SKIP existing file: {relative_path}")
            continue

        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        print(f"  OK file: {relative_path}")


def main():
    print("QS Tools — Audit Layer Structure Builder")
    print(f"Project root: {PROJECT_ROOT}")
    print("-" * 60)

    create_folders()
    create_files()

    print("-" * 60)
    print("Audit layer structure created.")
    print("Safe to run again. Existing files were not overwritten.")


if __name__ == "__main__":
    main()