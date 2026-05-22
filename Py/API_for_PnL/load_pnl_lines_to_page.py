# Py/API_for_PnL/load_pnl_lines_to_page.py
#
# Purpose:
# Load extracted P&L line items into the existing QS Tools P&L page.
#
# This is the reusable bridge script for:
# - demo JSON imports
# - future OCR PDF extraction
# - future Xero API line imports
# - future CSV imports
#
# Important:
# - Does NOT change any JS variable names.
# - Does NOT change any React files.
# - Does NOT change any P&L calculations.
# - Writes only to the existing browser localStorage key:
#   qs_tools_profit_and_loss_state
#
# Input JSON shape:
# {
#   "financial_year": 2026,
#   "period_month": "",
#   "line_items": [
#     {
#       "line_name": "Sales",
#       "amount": 1250000
#     },
#     {
#       "line_name": "Concrete Testing",
#       "amount": 8500,
#       "section": "cost_of_sales"
#     }
#   ]
# }

from pathlib import Path
from playwright.sync_api import sync_playwright
import argparse
import json
import time
import random

APP_URL = "http://localhost:3000/profit-and-loss"
STORAGE_KEY = "qs_tools_profit_and_loss_state"

IMPORTED_REVIEW_REQUIRED_CATEGORY_ID = "imported_review_required"


def make_pnl_line_id():
    return f"pnl_import_{int(time.time() * 1000)}_{random.randint(1000, 9999)}"


def get_default_direct_cost_categories():
    return [
        {
            "category_id": "materials",
            "category_name": "Materials",
            "is_default": True,
            "is_active": True,
            "created_at": "",
            "updated_at": "",
        },
        {
            "category_id": "subcontract_labour",
            "category_name": "Subcontract labour",
            "is_default": True,
            "is_active": True,
            "created_at": "",
            "updated_at": "",
        },
        {
            "category_id": "hired_equipment_plant",
            "category_name": "Hired equipment / plant",
            "is_default": True,
            "is_active": True,
            "created_at": "",
            "updated_at": "",
        },
        {
            "category_id": "freight_cartage",
            "category_name": "Freight / cartage",
            "is_default": True,
            "is_active": True,
            "created_at": "",
            "updated_at": "",
        },
        {
            "category_id": "waste_tipping",
            "category_name": "Waste / tipping",
            "is_default": True,
            "is_active": True,
            "created_at": "",
            "updated_at": "",
        },
        {
            "category_id": "direct_consumables",
            "category_name": "Direct consumables",
            "is_default": True,
            "is_active": True,
            "created_at": "",
            "updated_at": "",
        },
        {
            "category_id": "other_direct_costs",
            "category_name": "Other direct costs",
            "is_default": True,
            "is_active": True,
            "created_at": "",
            "updated_at": "",
        },
        {
            "category_id": "review_required",
            "category_name": "Review required",
            "is_default": True,
            "is_active": True,
            "created_at": "",
            "updated_at": "",
        },
        {
            "category_id": IMPORTED_REVIEW_REQUIRED_CATEGORY_ID,
            "category_name": "Imported / Review required",
            "is_default": False,
            "is_active": True,
            "created_at": "",
            "updated_at": "",
        },
    ]


def clean_amount(value):
    if value is None:
        return 0

    if isinstance(value, (int, float)):
        return value

    text = str(value).strip()

    if not text:
        return 0

    is_negative = False

    if text.startswith("(") and text.endswith(")"):
        is_negative = True
        text = text[1:-1]

    text = (
        text.replace("$", "")
        .replace(",", "")
        .replace(" ", "")
        .replace("−", "-")
    )

    try:
        amount = float(text)
    except ValueError:
        amount = 0

    if is_negative:
        amount = -abs(amount)

    return amount


def infer_section_and_category(line_name):
    name = str(line_name or "").lower()

    # Income
    if any(word in name for word in ["sales", "revenue", "turnover"]):
        return "trading_income", "revenue", "", ""

    if "other income" in name or "interest income" in name or "rebate" in name:
        return "other_income", "unassigned", "", "review_required"

    # Known COGS / direct costs
    if any(word in name for word in ["material", "materials"]):
        return "cost_of_sales", "cogs", "materials", ""

    if any(word in name for word in ["subcontract", "subcontractor"]):
        return "cost_of_sales", "cogs", "subcontract_labour", ""

    if any(word in name for word in ["equipment hire", "plant hire", "hire"]):
        return "cost_of_sales", "cogs", "hired_equipment_plant", ""

    if any(word in name for word in ["freight", "cartage", "delivery"]):
        return "cost_of_sales", "cogs", "freight_cartage", ""

    if any(word in name for word in ["waste", "tipping", "dump"]):
        return "cost_of_sales", "cogs", "waste_tipping", ""

    if any(word in name for word in ["consumable", "consumables"]):
        return "cost_of_sales", "cogs", "direct_consumables", ""

    # Likely COGS / direct job costs that need review.
    if any(
        word in name
        for word in [
            "testing",
            "site works",
            "traffic",
            "temporary",
            "direct cost",
            "job cost",
            "contract cost",
            "project cost",
            "site cost",
        ]
    ):
        return (
            "cost_of_sales",
            "cogs",
            IMPORTED_REVIEW_REQUIRED_CATEGORY_ID,
            "review_required",
        )

    # Labour operating expenses
    if any(word in name for word in ["wages", "salary", "salaries", "payroll"]):
        return "operating_expenses", "labour", "", "salary_wages"

    if "kiwisaver" in name:
        return "operating_expenses", "labour", "", "employer_kiwisaver"

    if "acc levy" in name or name == "acc":
        return "operating_expenses", "labour", "", "employer_acc"

    # Asset operating expenses
    if any(
        word in name
        for word in [
            "vehicle",
            "fuel",
            "registration",
            "licence",
            "license",
            "repairs",
            "maintenance",
            "interest",
            "finance",
            "plant",
            "machinery",
        ]
    ):
        return "operating_expenses", "assets", "", ""

    # General overheads
    if any(
        word in name
        for word in [
            "accounting",
            "legal",
            "insurance",
            "software",
            "subscription",
            "subscriptions",
            "rent",
            "office",
            "telephone",
            "internet",
            "advertising",
            "marketing",
            "bank fees",
            "administration",
            "admin",
            "cleaning",
            "stationery",
            "storage",
            "power",
            "electricity",
        ]
    ):
        return "operating_expenses", "general_overheads", "", ""

    # Unknown fallback.
    # Unknown operating expenses should not be forced into general_overheads.
    return "operating_expenses", "unassigned", "", "review_required"


def normalize_line_item(item):
    line_name = (
        item.get("line_name")
        or item.get("name")
        or item.get("description")
        or ""
    )

    (
        inferred_section,
        inferred_category,
        inferred_direct_cost_category_id,
        inferred_review_subcategory,
    ) = infer_section_and_category(line_name)

    section = item.get("section") or inferred_section
    category = item.get("category") or inferred_category

    direct_cost_category_id = (
        item.get("direct_cost_category_id")
        or inferred_direct_cost_category_id
        or ""
    )

    review_subcategory = (
        item.get("review_subcategory")
        or inferred_review_subcategory
        or ""
    )

    # If caller explicitly says a line is Cost of Sales but does not provide
    # a known direct-cost category, keep it in COGS and place it in the
    # imported review bucket.
    if section == "cost_of_sales":
        category = "cogs"

        if not direct_cost_category_id:
            direct_cost_category_id = IMPORTED_REVIEW_REQUIRED_CATEGORY_ID
            review_subcategory = "review_required"

    # Unknown revenue/other income should be preserved and flagged for review.
    if section in ["trading_income", "other_income"] and category == "unassigned":
        review_subcategory = review_subcategory or "review_required"

    # Unknown operating expenses should remain unassigned and be reviewable.
    if section == "operating_expenses" and category == "unassigned":
        review_subcategory = review_subcategory or "review_required"

    return {
        "pnl_line_id": item.get("pnl_line_id") or make_pnl_line_id(),
        "line_name": line_name,
        "amount": clean_amount(item.get("amount", item.get("value", 0))),
        "section": section,
        "category": category,
        "interest_treatment": item.get("interest_treatment") or "not_reviewed",
        "review_subcategory": review_subcategory,
        "direct_cost_category_id": direct_cost_category_id,
    }


def load_import_file(path):
    input_path = Path(path)

    if not input_path.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")

    # utf-8-sig allows JSON files created by PowerShell/Excel/export tools
    # that include a UTF-8 BOM.
    data = json.loads(input_path.read_text(encoding="utf-8-sig"))

    raw_lines = data.get("line_items") or data.get("pnl_lines") or []

    if not isinstance(raw_lines, list):
        raise ValueError("Input JSON must contain line_items or pnl_lines as a list.")

    state = {
        "financial_year": data.get("financial_year") or 2026,
        "period_month": data.get("period_month") or "",
        "pnl_lines": [normalize_line_item(item) for item in raw_lines],
        "direct_cost_categories": get_default_direct_cost_categories(),
    }

    return state


def calculate_basic_summary(state):
    total_trading_income = 0
    total_other_income = 0
    total_cost_of_sales = 0
    total_operating_expenses = 0
    total_unassigned = 0
    total_imported_review_required_cogs = 0

    for line in state["pnl_lines"]:
        amount = float(line.get("amount") or 0)
        section = line.get("section")
        category = line.get("category")
        direct_cost_category_id = line.get("direct_cost_category_id")

        if section == "trading_income":
            total_trading_income += amount
        elif section == "other_income":
            total_other_income += amount
        elif section == "cost_of_sales":
            total_cost_of_sales += amount
        elif section == "operating_expenses":
            total_operating_expenses += amount

        if category == "unassigned":
            total_unassigned += amount

        if (
            section == "cost_of_sales"
            and category == "cogs"
            and direct_cost_category_id == IMPORTED_REVIEW_REQUIRED_CATEGORY_ID
        ):
            total_imported_review_required_cogs += amount

    gross_profit = total_trading_income - total_cost_of_sales
    net_profit = gross_profit + total_other_income - total_operating_expenses

    return {
        "total_trading_income": total_trading_income,
        "total_other_income": total_other_income,
        "total_cost_of_sales": total_cost_of_sales,
        "gross_profit": gross_profit,
        "total_operating_expenses": total_operating_expenses,
        "net_profit": net_profit,
        "total_unassigned": total_unassigned,
        "total_imported_review_required_cogs": total_imported_review_required_cogs,
    }


def print_summary(state):
    summary = calculate_basic_summary(state)

    print("\nPrepared P&L state")
    print("=" * 40)
    print(f"financial_year: {state['financial_year']}")
    print(f"period_month: {state['period_month'] or 'annual'}")
    print(f"pnl_lines: {len(state['pnl_lines'])}")

    print("\nDirect cost categories")
    print("-" * 40)
    for category in state["direct_cost_categories"]:
        print(
            f"{category['category_id']} | "
            f"{category['category_name']} | "
            f"default={category['is_default']} | "
            f"active={category['is_active']}"
        )

    print("\nLines")
    print("-" * 40)
    for line in state["pnl_lines"]:
        print(
            f"{line['section']} | {line['category']} | "
            f"{line['line_name']} | {line['amount']} | "
            f"review={line['review_subcategory'] or '-'} | "
            f"direct_cost={line['direct_cost_category_id'] or '-'}"
        )

    print("\nBasic script-side check")
    print("-" * 40)
    for key, value in summary.items():
        print(f"{key}: {value}")


def write_to_browser(state):
    state_json = json.dumps(state)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)

        # New isolated context so old localStorage/profile state cannot interfere.
        context = browser.new_context()

        # Seed localStorage before React loads and hydrates.
        context.add_init_script(
            f"""
            window.localStorage.clear();
            window.localStorage.setItem({json.dumps(STORAGE_KEY)}, {json.dumps(state_json)});
            """
        )

        page = context.new_page()
        page.goto(APP_URL, wait_until="networkidle")

        stored_state = page.evaluate(
            """(key) => JSON.parse(localStorage.getItem(key))""",
            STORAGE_KEY,
        )

        stored_summary = calculate_basic_summary(stored_state)

        print("\nBrowser localStorage verification")
        print("=" * 40)
        print(f"Storage key: {STORAGE_KEY}")
        print(f"Stored line count: {len(stored_state.get('pnl_lines', []))}")
        for key, value in stored_summary.items():
            print(f"{key}: {value}")

        input("\nPress Enter to close browser...")
        browser.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "input_json",
        help="Path to JSON file containing line_items or pnl_lines.",
    )

    args = parser.parse_args()

    state = load_import_file(args.input_json)
    print_summary(state)
    write_to_browser(state)


if __name__ == "__main__":
    main()