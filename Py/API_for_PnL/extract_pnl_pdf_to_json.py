# Py/API_for_PnL/extract_pnl_pdf_to_json.py
#
# Purpose:
# Extract line items from a text-based P&L PDF and output JSON that can be
# loaded by load_pnl_lines_to_page.py or later used by the web import panel.
#
# This is Stage 1 only:
# - text-based PDF extraction
# - no OCR yet
# - no web upload route yet
#
# Output:
# Py/API_for_PnL/extracted_pnl_lines.json

from pathlib import Path
import argparse
import json
import re
import sys

try:
    from pypdf import PdfReader
except ImportError:
    print("Missing dependency: pypdf")
    print("Install it with:")
    print("pip install pypdf")
    sys.exit(1)


DEFAULT_OUTPUT_PATH = Path("Py/API_for_PnL/extracted_pnl_lines.json")


SECTION_ALIASES = {
    "trading_income": [
        "trading income",
        "income",
        "revenue",
        "sales",
        "turnover",
    ],
    "cost_of_sales": [
        "cost of sales",
        "cost of goods sold",
        "cogs",
        "direct costs",
        "cost of revenue",
    ],
    "other_income": [
        "other income",
        "non operating income",
        "non-operating income",
    ],
    "operating_expenses": [
        "operating expenses",
        "expenses",
        "overheads",
        "administration expenses",
        "admin expenses",
    ],
}


SKIP_LINE_KEYWORDS = [
    "profit and loss",
    "statement of profit",
    "page ",
    "date",
    "period",
    "for the year",
    "for year",
    "year ended",
    "month ended",

    # Totals / calculated rows must not import as P&L lines.
    "total trading income",
    "total income",
    "total other income",
    "gross profit",
    "net profit",
    "total expenses",
    "total operating expenses",
    "total cost of sales",
    "total cost of goods sold",
    "total cogs",
]


def extract_text_from_pdf(pdf_path):
    reader = PdfReader(str(pdf_path))
    chunks = []

    for page_index, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        chunks.append(f"\n--- PAGE {page_index} ---\n{text}")

    return "\n".join(chunks)


def normalise_spaces(value):
    return re.sub(r"\s+", " ", str(value or "")).strip()


def clean_amount(value):
    if value is None:
        return None

    text = str(value).strip()

    if not text:
        return None

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
        return None

    if is_negative:
        amount = -abs(amount)

    return amount


def detect_section(line, current_section):
    clean = normalise_spaces(line).lower().strip(":").strip()

    for section, aliases in SECTION_ALIASES.items():
        for alias in aliases:
            if clean == alias or clean.startswith(f"{alias} "):
                return section

    return current_section


def should_skip_line(line):
    clean = normalise_spaces(line).lower()

    if not clean:
        return True

    if clean.startswith("--- page"):
        return True

    if len(clean) <= 2:
        return True

    for keyword in SKIP_LINE_KEYWORDS:
        if keyword in clean:
            return True

    return False


def parse_line_item(line, current_section):
    """
    Extract:
    line name + final amount from a line.

    Examples:
    Sales                         1,250,000
    Materials                       420,000
    Accounting Fees                  10,000
    Repairs & Maintenance           (18,000)
    """

    raw = normalise_spaces(line)

    if should_skip_line(raw):
        return None

    # Match final number on line, allowing commas, decimals, negatives, brackets.
    match = re.search(
        r"(.+?)\s+(\(?-?\$?\d[\d,]*(?:\.\d{1,2})?\)?)\s*$",
        raw,
    )

    if not match:
        return None

    line_name = normalise_spaces(match.group(1))
    amount = clean_amount(match.group(2))

    if not line_name or amount is None:
        return None

    # Avoid section header rows that happen to contain no useful account name.
    if line_name.lower() in [
        "total",
        "subtotal",
        "balance",
    ]:
        return None

    item = {
        "line_name": line_name,
        "amount": amount,
    }

    if current_section:
        item["section"] = current_section

    return item


def parse_pnl_text(text):
    lines = text.splitlines()
    current_section = ""
    line_items = []
    unmatched_lines = []

    for raw_line in lines:
        line = normalise_spaces(raw_line)

        if not line:
            continue

        detected_section = detect_section(line, current_section)

        if detected_section != current_section:
            current_section = detected_section
            continue

        item = parse_line_item(line, current_section)

        if item:
            line_items.append(item)
        else:
            if not should_skip_line(line):
                unmatched_lines.append(line)

    return line_items, unmatched_lines


def write_output(output_path, pdf_path, line_items, unmatched_lines):
    payload = {
        "source_type": "pdf_text",
        "source_file": str(pdf_path),
        "financial_year": 2026,
        "period_month": "",
        "line_items": line_items,
        "unmatched_lines": unmatched_lines,
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(payload, indent=2),
        encoding="utf-8",
    )

    return payload


def print_summary(payload, output_path):
    print("\nP&L PDF extraction complete")
    print("=" * 40)
    print(f"Source: {payload['source_file']}")
    print(f"Output: {output_path}")
    print(f"Line items: {len(payload['line_items'])}")
    print(f"Unmatched lines: {len(payload['unmatched_lines'])}")

    print("\nExtracted line items")
    print("-" * 40)

    for item in payload["line_items"]:
        section = item.get("section", "")
        print(f"{section} | {item['line_name']} | {item['amount']}")

    if payload["unmatched_lines"]:
        print("\nUnmatched sample")
        print("-" * 40)
        for line in payload["unmatched_lines"][:20]:
            print(line)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("pdf_path", help="Path to the P&L PDF file.")
    parser.add_argument(
        "--output",
        default=str(DEFAULT_OUTPUT_PATH),
        help="Output JSON path.",
    )

    args = parser.parse_args()

    pdf_path = Path(args.pdf_path)
    output_path = Path(args.output)

    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF file not found: {pdf_path}")

    text = extract_text_from_pdf(pdf_path)

    if not text.strip():
        raise ValueError(
            "No embedded PDF text found. This may be a scanned PDF and will need OCR fallback later."
        )

    line_items, unmatched_lines = parse_pnl_text(text)

    payload = write_output(
        output_path=output_path,
        pdf_path=pdf_path,
        line_items=line_items,
        unmatched_lines=unmatched_lines,
    )

    print_summary(payload, output_path)


if __name__ == "__main__":
    main()