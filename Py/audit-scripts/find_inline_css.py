"""
find_inline_css.py

Scans the repo for inline style={{ ... }} / style="..." usage in
.js / .jsx / .ts / .tsx files, so they can be moved into the CSS files.

Usage (from repo root):
    python find_inline_css.py

Output:
    - Prints a summary count per file
    - Writes a full detail report to inline_css_report.txt in the
      current directory (file, line number, matched snippet)

Excludes node_modules, .next, .git, dist, build by default.
"""

import os
import re

EXCLUDE_DIRS = {"node_modules", ".next", ".git", "dist", "build", "out"}
EXTENSIONS = {".js", ".jsx", ".ts", ".tsx"}

# Matches style={{ ... }} (JSX inline object) and style="..." (plain HTML-ish string)
STYLE_PATTERN = re.compile(r'style\s*=\s*(\{\{.*?\}\}|"[^"]*"|\'[^\']*\')')


def find_files(root):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
        for fname in filenames:
            ext = os.path.splitext(fname)[1]
            if ext in EXTENSIONS:
                yield os.path.join(dirpath, fname)


def scan_file(path):
    hits = []
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            for lineno, line in enumerate(f, start=1):
                for match in STYLE_PATTERN.finditer(line):
                    snippet = match.group(0)
                    if len(snippet) > 120:
                        snippet = snippet[:117] + "..."
                    hits.append((lineno, snippet.strip()))
    except OSError:
        pass
    return hits


def main():
    root = os.getcwd()
    all_results = {}
    total_hits = 0

    for filepath in find_files(root):
        hits = scan_file(filepath)
        if hits:
            rel = os.path.relpath(filepath, root)
            all_results[rel] = hits
            total_hits += len(hits)

    # Summary to console
    print(f"Scanned repo at: {root}")
    print(f"Files with inline style usage: {len(all_results)}")
    print(f"Total inline style occurrences: {total_hits}")
    print()
    for rel, hits in sorted(all_results.items(), key=lambda kv: -len(kv[1])):
        print(f"  {len(hits):>3}  {rel}")

    # Detail report to file
    report_path = os.path.join(root, "inline_css_report.txt")
    with open(report_path, "w", encoding="utf-8") as out:
        out.write("INLINE CSS REPORT\n")
        out.write(f"Scanned: {root}\n")
        out.write(f"Files with hits: {len(all_results)}\n")
        out.write(f"Total occurrences: {total_hits}\n")
        out.write("=" * 70 + "\n\n")
        for rel, hits in sorted(all_results.items()):
            out.write(f"{rel}  ({len(hits)} hit(s))\n")
            for lineno, snippet in hits:
                out.write(f"    line {lineno}: {snippet}\n")
            out.write("\n")

    print()
    print(f"Full detail written to: {report_path}")
    print("Paste the console summary (or the report file) back into chat for review.")


if __name__ == "__main__":
    main()
