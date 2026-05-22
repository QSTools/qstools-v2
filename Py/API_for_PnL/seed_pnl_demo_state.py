# Py/API_for_PnL/seed_pnl_demo_state.py
#
# Purpose:
# Seed the existing QS Tools P&L page with demo P&L line items.
#
# This is a test harness for the future OCR/Xero/API import pathway.
#
# Important:
# - Does NOT change any JS variable names.
# - Does NOT change any React files.
# - Does NOT change any P&L calculations.
# - Writes only to the existing browser localStorage key:
#   qs_tools_profit_and_loss_state
#
# Existing P&L state shape:
# {
#   financial_year,
#   period_month,
#   pnl_lines[],
#   direct_cost_categories[]
# }

from playwright.sync_api import sync_playwright
import json
import time
import random

APP_URL = "http://localhost:3000/profit-and-loss"
STORAGE_KEY = "qs_tools_profit_and_loss_state"

IMPORTED_REVIEW_REQUIRED_CATEGORY_ID = "imported_review_required"


def make_pnl_line_id():
    return f"pnl_import_{int(time.time() * 1000)}_{random.randint(1000, 9999)}"


def create_pnl_line(
    line_name,
    amount,
    section="operating_expenses",
    category="unassigned",
    interest_treatment="not_reviewed",
    review_subcategory="",
    direct_cost_category_id="",
):
    return {
        "pnl_line_id": make_pnl_line_id(),
        "line_name": line_name,
        "amount": amount,
        "section": section,
        "category": category,
        "interest_treatment": interest_treatment,
        "review_subcategory": review_subcategory,
        "direct_cost_category_id": direct_cost_category_id,
    }


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

        # Import-specific custom category.
        # This mirrors the existing "Add a Cost of Sales category" behaviour.
        # Unknown imported COGS lines go here so they stay inside COGS
        # without requiring a React/UI change.
        {
            "category_id": IMPORTED_REVIEW_REQUIRED_CATEGORY_ID,
            "category_name": "Imported / Review required",
            "is_default": False,
            "is_active": True,
            "created_at": "",
            "updated_at": "",
        },
    ]


def create_imported_review_cogs_line(line_name, amount):
    return create_pnl_line(
        line_name,
        amount,
        section="cost_of_sales",
        category="cogs",
        review_subcategory="review_required",
        direct_cost_category_id=IMPORTED_REVIEW_REQUIRED_CATEGORY_ID,
    )


def build_demo_pnl_state():
    return {
        "financial_year": 2026,
        "period_month": "",

        # Import rule:
        # - Known revenue goes to revenue.
        # - Unknown revenue is preserved as unassigned/review_required.
        # - Known COGS goes to cogs with direct_cost_category_id.
        # - Unknown COGS goes to a custom direct cost category:
        #   imported_review_required.
        # - Unknown operating expenses are preserved as unassigned/review_required.
        "pnl_lines": [
            # ----------------------------
            # Trading income
            # ----------------------------
            create_pnl_line(
                "Sales",
                1250000,
                section="trading_income",
                category="revenue",
            ),
            create_pnl_line(
                "Rebate Income",
                3200,
                section="trading_income",
                category="unassigned",
                review_subcategory="review_required",
            ),

            # ----------------------------
            # Other income
            # ----------------------------
            create_pnl_line(
                "Other Income",
                2600,
                section="other_income",
                category="unassigned",
                review_subcategory="review_required",
            ),

            # ----------------------------
            # Cost of sales / direct costs
            # ----------------------------
            create_pnl_line(
                "Materials",
                420000,
                section="cost_of_sales",
                category="cogs",
                direct_cost_category_id="materials",
            ),
            create_pnl_line(
                "Subcontract Labour",
                110000,
                section="cost_of_sales",
                category="cogs",
                direct_cost_category_id="subcontract_labour",
            ),
            create_pnl_line(
                "Equipment Hire",
                25000,
                section="cost_of_sales",
                category="cogs",
                direct_cost_category_id="hired_equipment_plant",
            ),
            create_pnl_line(
                "Freight / Cartage",
                15000,
                section="cost_of_sales",
                category="cogs",
                direct_cost_category_id="freight_cartage",
            ),
            create_pnl_line(
                "Waste Disposal",
                8000,
                section="cost_of_sales",
                category="cogs",
                direct_cost_category_id="waste_tipping",
            ),

            # Unknown imported COGS/direct-cost lines.
            # These stay inside Cost of Sales but are grouped into the
            # custom imported_review_required direct-cost category.
            create_imported_review_cogs_line("Concrete Testing", 8500),
            create_imported_review_cogs_line("Temporary Site Works", 12500),
            create_imported_review_cogs_line("Traffic Management", 18500),

            # ----------------------------
            # Labour-related operating expenses
            # ----------------------------
            create_pnl_line(
                "Salary & Wages",
                360000,
                section="operating_expenses",
                category="labour",
                review_subcategory="salary_wages",
            ),
            create_pnl_line(
                "KiwiSaver Employer Contributions",
                10800,
                section="operating_expenses",
                category="labour",
                review_subcategory="employer_kiwisaver",
            ),
            create_pnl_line(
                "ACC Levy",
                9000,
                section="operating_expenses",
                category="labour",
                review_subcategory="employer_acc",
            ),

            # Unknown labour-adjacent operating expense.
            create_pnl_line(
                "Staff Certifications",
                4200,
                section="operating_expenses",
                category="unassigned",
                review_subcategory="review_required",
            ),

            # ----------------------------
            # Asset-related operating expenses
            # ----------------------------
            create_pnl_line(
                "Motor Vehicle Expenses",
                36000,
                section="operating_expenses",
                category="assets",
            ),
            create_pnl_line(
                "Fuel",
                22000,
                section="operating_expenses",
                category="assets",
            ),
            create_pnl_line(
                "Repairs & Maintenance",
                18000,
                section="operating_expenses",
                category="assets",
            ),
            create_pnl_line(
                "Interest Expense",
                19000,
                section="operating_expenses",
                category="assets",
                interest_treatment="not_reviewed",
            ),

            # Unknown asset-adjacent operating expense.
            create_pnl_line(
                "Small Plant Replacements",
                7500,
                section="operating_expenses",
                category="unassigned",
                review_subcategory="review_required",
            ),

            # ----------------------------
            # General overhead operating expenses
            # ----------------------------
            create_pnl_line(
                "Accounting Fees",
                10000,
                section="operating_expenses",
                category="general_overheads",
                review_subcategory="finance_admin",
            ),
            create_pnl_line(
                "Legal Expenses",
                6000,
                section="operating_expenses",
                category="general_overheads",
                review_subcategory="insurance_compliance",
            ),
            create_pnl_line(
                "Insurance",
                18000,
                section="operating_expenses",
                category="general_overheads",
                review_subcategory="insurance_compliance",
            ),
            create_pnl_line(
                "Software Subscriptions",
                12000,
                section="operating_expenses",
                category="general_overheads",
            ),
            create_pnl_line(
                "Office Rent",
                42000,
                section="operating_expenses",
                category="general_overheads",
            ),
            create_pnl_line(
                "Telephone & Internet",
                6000,
                section="operating_expenses",
                category="general_overheads",
            ),
            create_pnl_line(
                "Administration Fees",
                35000,
                section="operating_expenses",
                category="general_overheads",
            ),
            create_pnl_line(
                "Advertising",
                12000,
                section="operating_expenses",
                category="general_overheads",
                review_subcategory="sales_growth",
            ),

            # Unknown operating expenses.
            create_pnl_line(
                "Mystery Business Expense",
                9800,
                section="operating_expenses",
                category="unassigned",
                review_subcategory="review_required",
            ),
            create_pnl_line(
                "Consultant Review Fee",
                6700,
                section="operating_expenses",
                category="unassigned",
                review_subcategory="review_required",
            ),
        ],

        "direct_cost_categories": get_default_direct_cost_categories(),
    }


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

    print("\nDemo P&L state prepared")
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


def main():
    state = build_demo_pnl_state()
    print_summary(state)

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

        print("\nExpected key results")
        print("-" * 40)
        print("Cost of Sales should include all known and imported review COGS.")
        print("Imported / Review required should appear as a Cost of Sales category.")
        print("Imported / Review required total should be 39500.")

        input("\nPress Enter to close browser...")
        browser.close()


if __name__ == "__main__":
    main()