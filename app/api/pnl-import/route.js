import { NextResponse } from "next/server";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import { spawn } from "child_process";

export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

function make_safe_file_name(name = "pnl.pdf") {
  return String(name)
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120);
}

function get_python_executable() {
  if (process.env.PYTHON_PATH) {
    return process.env.PYTHON_PATH;
  }

  return path.join(process.cwd(), ".venv", "Scripts", "python.exe");
}

function run_python_extractor({ pdf_path, output_path }) {
  return new Promise((resolve, reject) => {
    const root = process.cwd();

    const python_executable = get_python_executable();

    const script_path = path.join(
      root,
      "Py",
      "API_for_PnL",
      "extract_pnl_pdf_to_json.py",
    );

    const child = spawn(
      python_executable,
      [script_path, pdf_path, "--output", output_path],
      {
        cwd: root,
        shell: false,
      },
    );

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("error", (error) => {
      reject(
        new Error(
          [
            "Failed to start Python extractor.",
            `Python executable: ${python_executable}`,
            `Script path: ${script_path}`,
            error?.message ? `Error: ${error.message}` : "",
          ]
            .filter(Boolean)
            .join("\n"),
        ),
      );
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(
          new Error(
            [
              `Python extractor failed with exit code ${code}.`,
              `Python executable: ${python_executable}`,
              `Script path: ${script_path}`,
              stderr ? `STDERR:\n${stderr}` : "",
              stdout ? `STDOUT:\n${stdout}` : "",
            ]
              .filter(Boolean)
              .join("\n"),
          ),
        );
        return;
      }

      resolve({ stdout, stderr });
    });
  });
}

export async function POST(request) {
  const temp_paths = [];

  try {
    const form_data = await request.formData();
    const file = form_data.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json(
        {
          ok: false,
          error: "No PDF file was provided.",
        },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          ok: false,
          error: "PDF is too large. Use a file smaller than 15MB.",
        },
        { status: 400 },
      );
    }

    const file_name = make_safe_file_name(file.name || "pnl.pdf");

    if (!file_name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        {
          ok: false,
          error: "Only PDF files are supported at this stage.",
        },
        { status: 400 },
      );
    }

    const root = process.cwd();
    const temp_dir = path.join(root, ".tmp", "pnl-import");
    await mkdir(temp_dir, { recursive: true });

    const import_id = `${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 10)}`;

    const pdf_path = path.join(temp_dir, `${import_id}_${file_name}`);
    const output_path = path.join(temp_dir, `${import_id}_extracted.json`);

    temp_paths.push(pdf_path, output_path);

    const array_buffer = await file.arrayBuffer();
    await writeFile(pdf_path, Buffer.from(array_buffer));

    await run_python_extractor({
      pdf_path,
      output_path,
    });

    const extracted_raw = await readFile(output_path, "utf-8");
    const extracted = JSON.parse(extracted_raw);

    return NextResponse.json({
      ok: true,
      source_file: file.name || file_name,
      source_type: extracted.source_type || "pdf_text",
      financial_year: extracted.financial_year || "",
      period_month: extracted.period_month || "",
      line_items: extracted.line_items || [],
      unmatched_lines: extracted.unmatched_lines || [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "P&L PDF import failed.",
      },
      { status: 500 },
    );
  } finally {
    await Promise.all(
      temp_paths.map(async (file_path) => {
        try {
          await unlink(file_path);
        } catch {
          // Ignore temp cleanup failures.
        }
      }),
    );
  }
}