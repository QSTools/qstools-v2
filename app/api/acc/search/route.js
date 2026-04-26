import path from "path";
import Database from "better-sqlite3";

export const dynamic = "force-dynamic";

const DB_PATH = path.join(process.cwd(), "data", "acc_rates.db");

function clean_query(value) {
  return String(value || "").trim();
}

function get_database() {
  return new Database(DB_PATH, { readonly: true });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = clean_query(searchParams.get("q"));

  if (query.length < 2) {
    return Response.json({ results: [] });
  }

  const db = get_database();

  try {
    const search_value = `%${query}%`;

    const rows = db
      .prepare(
        `
        SELECT
          b.bic_code,
          b.bic_description,
          b.acc_cu_code,
          c.acc_cu_description,
          c.levy_risk_group,
          c.employer_work_levy_rate,
          c.working_safer_levy_rate,
          c.total_acc_rate
        FROM acc_bic_lookup b
        INNER JOIN acc_cu_rates c
          ON c.acc_cu_code = b.acc_cu_code
        WHERE
          b.bic_description LIKE ?
          OR b.bic_code LIKE ?
          OR c.acc_cu_description LIKE ?
          OR c.acc_cu_code LIKE ?
        ORDER BY
          CASE
            WHEN b.bic_description LIKE ? THEN 0
            WHEN c.acc_cu_description LIKE ? THEN 1
            ELSE 2
          END,
          b.bic_description ASC
        LIMIT 30
        `
      )
      .all(
        search_value,
        search_value,
        search_value,
        search_value,
        `${query}%`,
        `${query}%`
      );

    return Response.json({ results: rows });
  } catch (error) {
    return Response.json(
      {
        results: [],
        error: "ACC search failed",
      },
      { status: 500 }
    );
  } finally {
    db.close();
  }
}