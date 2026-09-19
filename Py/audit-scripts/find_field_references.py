"""
find_field_references.py

Given one or more field/variable names (e.g. minimum_recoverable_rate,
group_overhead_share), finds every file and line that references them
across the repo. Useful for tracing whether a field added in one place
(a hook's return object) actually reaches every place it should
(a selector, then a component) - the #1 recurring bug class in this
project.

Usage (from repo root):
    python find_field_references.py minimum_recoverable_rate group_overhead_share

    (space-separated, one or more names; quote any name with special
    characters, though plain snake_case names won't need it)

Output:
    - Prints per-name file lists with line numbers to the console
    - Writes full detail to field_references_report.txt
"""

import os
import re
import sys

EXCLUDE_DIRS = {"node_modules", ".next", ".git", "dist", "build", "out"}
EXTENSIONS = {".js", ".jsx", ".ts", ".tsx", ".json"}


def find_files(root):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
        for fname in filenames:
            ext = os.path.splitext(fname)[1]
            if ext in EXTENSIONS:
                yield os.path.join(dirpath, fname)


def main():
    names = sys.argv[1:]
    if not names:
        print("Usage: python find_field_references.py <field_name> [more_field_names...]")
        sys.exit(1)

    root = os.getcwd()
    patterns = {name: re.compile(r'\b' + re.escape(name) + r'\b') for name in names}

    # results[name] = list of (relpath, lineno, line_text)
    results = {name: [] for name in names}

    files_scanned = 0
    for filepath in find_files(root):
        files_scanned += 1
        rel = os.path.relpath(filepath, root)
        try:
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                for lineno, line in enumerate(f, start=1):
                    for name, pattern in patterns.items():
                        if pattern.search(line):
                            results[name].append((rel, lineno, line.strip()))
        except OSError:
            continue

    print(f"Scanned {files_scanned} file(s) under {root}")
    print()
    for name in names:
        hits = results[name]
        files_hit = sorted(set(r for r, _, _ in hits))
        print(f"'{name}' - {len(hits)} occurrence(s) across {len(files_hit)} file(s):")
        for f in files_hit:
            print(f"    {f}")
        print()

    report_path = os.path.join(root, "field_references_report.txt")
    with open(report_path, "w", encoding="utf-8") as out:
        out.write("FIELD REFERENCE REPORT\n")
        out.write(f"Scanned: {root}\n")
        out.write(f"Names searched: {', '.join(names)}\n")
        out.write("=" * 70 + "\n\n")
        for name in names:
            hits = results[name]
            out.write(f"'{name}' - {len(hits)} occurrence(s)\n")
            out.write("-" * 50 + "\n")
            for rel, lineno, line_text in hits:
                if len(line_text) > 140:
                    line_text = line_text[:137] + "..."
                out.write(f"  {rel}:{lineno}: {line_text}\n")
            out.write("\n")

    print(f"Full detail written to: {report_path}")
    print("Paste the console summary (or report file) back into chat for review.")


if __name__ == "__main__":
    main()
