import sqlite3
from pathlib import Path


DB_PATH = r"D:\QSTools\qstools-web\data\acc_rates.db"
OUTPUT_FILE = r"D:\QSTools\qstools-web\Py\acc_rate_summary.txt"


def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    lines = []

    lines.append("=== UNIQUE ACC RATE SUMMARY ===\n")

    cur.execute("""
        SELECT total_acc_rate, COUNT(*) 
        FROM acc_cu_rates
        GROUP BY total_acc_rate
        ORDER BY total_acc_rate
    """)

    rate_rows = cur.fetchall()

    for rate, count in rate_rows:
        lines.append(f"{rate:.3f} | {count} CU rows")

    lines.append("\n=== TOTAL COUNTS ===\n")

    cur.execute("SELECT COUNT(*) FROM acc_cu_rates")
    lines.append(f"Total CU rows: {cur.fetchone()[0]}")

    cur.execute("SELECT COUNT(*) FROM acc_bic_lookup")
    lines.append(f"Total BIC rows: {cur.fetchone()[0]}")

    lines.append("\n=== SAMPLE PER RATE (FIRST 5 ONLY) ===\n")

    for rate, count in rate_rows:
        lines.append(f"\n--- RATE {rate:.3f} ({count} CU rows) ---")

        cur.execute("""
            SELECT acc_cu_code, acc_cu_description
            FROM acc_cu_rates
            WHERE total_acc_rate = ?
            LIMIT 5
        """, (rate,))

        for row in cur.fetchall():
            lines.append(f"{row[0]} | {row[1]}")

    conn.close()

    Path(OUTPUT_FILE).write_text("\n".join(lines), encoding="utf-8")

    print(f"Summary written to: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()