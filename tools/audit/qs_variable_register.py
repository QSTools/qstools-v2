"""
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
