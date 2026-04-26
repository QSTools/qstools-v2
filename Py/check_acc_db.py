import sqlite3

db_path = r"D:\QSTools\qstools-web\data\acc_rates.db"

conn = sqlite3.connect(db_path)
cur = conn.cursor()

print("\n--- TABLES ---")
cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
print(cur.fetchall())

print("\n--- CU COUNT ---")
cur.execute("SELECT COUNT(*) FROM acc_cu_rates;")
print(cur.fetchone())

print("\n--- BIC COUNT ---")
cur.execute("SELECT COUNT(*) FROM acc_bic_lookup;")
print(cur.fetchone())

print("\n--- SAMPLE CU ---")
cur.execute("SELECT * FROM acc_cu_rates LIMIT 5;")
for row in cur.fetchall():
    print(row)

print("\n--- SAMPLE BIC ---")
cur.execute("SELECT * FROM acc_bic_lookup LIMIT 5;")
for row in cur.fetchall():
    print(row)

conn.close()