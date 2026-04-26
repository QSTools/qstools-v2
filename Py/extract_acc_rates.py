import re
import sqlite3
from pathlib import Path

import pandas as pd


INPUT_FILE = r"D:\QSTools\qstools-web\docs\sources\Source Files V3.0\V3.5 Updated Build\ACC Levy-Guidebook-2026-2027.xlsx"
OUTPUT_DB = r"D:\QSTools\qstools-web\data\acc_rates.db"
WORKING_SAFER_RATE = 0.08


def clean(value):
    if pd.isna(value):
        return ""
    return str(value).strip()


def to_rate(value):
    text = clean(value).replace("$", "").replace(",", "")
    try:
        return round(float(text), 5)
    except ValueError:
        return 0


def find_header_row(df):
    for idx, row in df.iterrows():
        row_text = " ".join(clean(v).lower() for v in row.values)

        if "acc" in row_text and "cu" in row_text and "bic" in row_text:
            return idx

    return None


def clean_cu_description(description):
    description = clean(description)

    # Remove trailing extracted LRG/rate noise, e.g. "Coal mining      81 1"
    description = re.sub(r"\s+\d+\s+\d+$", "", description).strip()
    description = re.sub(r"\s+", " ", description).strip()

    return description


def extract_records(excel_path):
    sheets = pd.read_excel(excel_path, sheet_name=None, header=None)

    cu_rates = {}
    bic_rows = {}

    for sheet_name, raw_df in sheets.items():
        header_row = find_header_row(raw_df)

        if header_row is None:
            continue

        df = raw_df.iloc[header_row + 1:].copy()
        df = df.dropna(how="all")

        current_cu = ""
        current_cu_description = ""
        current_lrg = ""
        current_emp_rate = 0

        for _, row in df.iterrows():
            values = [clean(v) for v in row.values]
            joined = " ".join(values)

            cu_match = re.search(r"\b(\d{5})\b", joined)
            bic_match = re.search(r"\b([A-Z]\d{6})\b", joined)
            dollar_values = re.findall(r"\$?\d+\.\d+", joined)

            if cu_match and dollar_values:
                current_cu = cu_match.group(1)
                current_emp_rate = to_rate(dollar_values[0])

                nums = re.findall(r"\b\d{1,4}\b", joined)
                current_lrg = nums[1] if len(nums) > 1 else ""

                text_after_cu = joined.split(current_cu, 1)[-1]
                current_cu_description = re.split(
                    r"\b[A-Z]\d{6}\b",
                    text_after_cu,
                )[0]

                current_cu_description = re.sub(
                    r"\$?\d+\.\d+.*",
                    "",
                    current_cu_description,
                ).strip()

                current_cu_description = clean_cu_description(current_cu_description)

                cu_rates[current_cu] = {
                    "acc_cu_code": current_cu,
                    "acc_cu_description": current_cu_description,
                    "levy_risk_group": current_lrg,
                    "employer_work_levy_rate": current_emp_rate,
                    "working_safer_levy_rate": WORKING_SAFER_RATE,
                    "total_acc_rate": round(current_emp_rate + WORKING_SAFER_RATE, 5),
                }

            if bic_match and current_cu:
                bic_code = bic_match.group(1)

                bic_description = joined.split(bic_code, 1)[-1]
                bic_description = re.sub(r"\$?\d+\.\d+.*", "", bic_description).strip()
                bic_description = re.sub(r"\s+", " ", bic_description).strip()

                key = (bic_code, bic_description, current_cu)

                bic_rows[key] = {
                    "bic_code": bic_code,
                    "bic_description": bic_description,
                    "acc_cu_code": current_cu,
                }

    # Backfill blank CU descriptions from first linked BIC row.
    # This keeps the CU table usable even where the spreadsheet layout
    # separates CU headings from the BIC rows.
    for cu_code, cu in cu_rates.items():
        if not cu["acc_cu_description"]:
            for row in bic_rows.values():
                if row["acc_cu_code"] == cu_code:
                    cu["acc_cu_description"] = row["bic_description"]
                    break

    return list(cu_rates.values()), list(bic_rows.values())


def create_database(cu_rates, bic_rows, db_path):
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    cur.execute("DROP TABLE IF EXISTS acc_bic_lookup")
    cur.execute("DROP TABLE IF EXISTS acc_cu_rates")

    cur.execute(
        """
        CREATE TABLE acc_cu_rates (
            acc_cu_code TEXT PRIMARY KEY,
            acc_cu_description TEXT,
            levy_risk_group TEXT,
            employer_work_levy_rate REAL,
            working_safer_levy_rate REAL,
            total_acc_rate REAL
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE acc_bic_lookup (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bic_code TEXT,
            bic_description TEXT,
            acc_cu_code TEXT,
            FOREIGN KEY (acc_cu_code) REFERENCES acc_cu_rates(acc_cu_code)
        )
        """
    )

    cur.executemany(
        """
        INSERT INTO acc_cu_rates (
            acc_cu_code,
            acc_cu_description,
            levy_risk_group,
            employer_work_levy_rate,
            working_safer_levy_rate,
            total_acc_rate
        )
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        [
            (
                row["acc_cu_code"],
                row["acc_cu_description"],
                row["levy_risk_group"],
                row["employer_work_levy_rate"],
                row["working_safer_levy_rate"],
                row["total_acc_rate"],
            )
            for row in cu_rates
        ],
    )

    cur.executemany(
        """
        INSERT INTO acc_bic_lookup (
            bic_code,
            bic_description,
            acc_cu_code
        )
        VALUES (?, ?, ?)
        """,
        [
            (
                row["bic_code"],
                row["bic_description"],
                row["acc_cu_code"],
            )
            for row in bic_rows
        ],
    )

    cur.execute("CREATE INDEX idx_acc_bic_description ON acc_bic_lookup(bic_description)")
    cur.execute("CREATE INDEX idx_acc_bic_code ON acc_bic_lookup(bic_code)")
    cur.execute("CREATE INDEX idx_acc_bic_cu ON acc_bic_lookup(acc_cu_code)")
    cur.execute("CREATE INDEX idx_acc_cu_description ON acc_cu_rates(acc_cu_description)")

    conn.commit()
    conn.close()


if __name__ == "__main__":
    cu_rates, bic_rows = extract_records(INPUT_FILE)
    create_database(cu_rates, bic_rows, OUTPUT_DB)

    print(f"Created database: {OUTPUT_DB}")
    print(f"ACC CU rate rows: {len(cu_rates)}")
    print(f"BIC lookup rows: {len(bic_rows)}")