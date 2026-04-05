from __future__ import annotations

import argparse
import csv
import re
from collections import Counter, defaultdict
from pathlib import Path
from typing import Iterable

ALLOWED_SUFFIXES = {".js", ".jsx", ".ts", ".tsx", ".css", ".scss", ".mdx"}
SKIP_DIRS = {".git", "node_modules", ".next", "dist", "build", "coverage"}

# Captures common Tailwind colour utility patterns, including state variants.
TAILWIND_COLOR_PATTERN = re.compile(
    r"""
    (?:
        (?:hover:|focus:|active:|disabled:|placeholder:|dark:|sm:|md:|lg:|xl:|2xl:)*
        (?:bg|text|border|ring|outline|decoration|shadow|caret|accent|fill|stroke)
        -
        [a-z]+
        -
        \d{2,3}
    )
    """,
    re.VERBOSE,
)

# Also capture arbitrary value classes already using CSS vars, so you can see progress.
CSS_VAR_PATTERN = re.compile(
    r"""
    (?:
        (?:hover:|focus:|active:|disabled:|placeholder:|dark:|sm:|md:|lg:|xl:|2xl:)*
        (?:bg|text|border|ring|outline|shadow)
        -\[\s*var\(--[^)\]]+\)\s*\]
    )
    """,
    re.VERBOSE,
)


def iter_files(root: Path) -> Iterable[Path]:
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix not in ALLOWED_SUFFIXES:
            continue
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        yield path


def read_text_safe(path: Path) -> str | None:
    for encoding in ("utf-8", "utf-8-sig", "cp1252"):
        try:
            return path.read_text(encoding=encoding)
        except UnicodeDecodeError:
            continue
        except Exception:
            return None
    return None


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Audit Tailwind colour usage across a project and export CSV logs."
    )
    parser.add_argument(
        "root",
        nargs="?",
        default=".",
        help="Project root to scan. Defaults to current folder.",
    )
    parser.add_argument(
        "--csv",
        default="theme_audit_report.csv",
        help="CSV output file path. Defaults to theme_audit_report.csv",
    )
    parser.add_argument(
        "--include-css-vars",
        action="store_true",
        help="Include classes already using var(--token) in the report.",
    )
    args = parser.parse_args()

    root = Path(args.root).resolve()
    if not root.exists():
        raise SystemExit(f"Folder does not exist: {root}")

    overall_tailwind = Counter()
    overall_css_vars = Counter()
    file_tailwind = defaultdict(Counter)
    file_css_vars = defaultdict(Counter)

    for file_path in iter_files(root):
        text = read_text_safe(file_path)
        if text is None:
            continue

        tailwind_matches = TAILWIND_COLOR_PATTERN.findall(text)
        css_var_matches = CSS_VAR_PATTERN.findall(text)

        if tailwind_matches:
            file_tailwind[str(file_path)].update(tailwind_matches)
            overall_tailwind.update(tailwind_matches)

        if args.include_css_vars and css_var_matches:
            file_css_vars[str(file_path)].update(css_var_matches)
            overall_css_vars.update(css_var_matches)

    print("\n" + "=" * 80)
    print("TAILWIND HARD-CODED COLOUR AUDIT")
    print("=" * 80)

    if overall_tailwind:
        print("\nHardcoded Tailwind colour classes:")
        for cls, count in overall_tailwind.most_common():
            print(f"{cls:<45} {count}")
    else:
        print("\nNo hardcoded Tailwind colour classes found.")

    if args.include_css_vars:
        print("\n" + "-" * 80)
        print("CSS VARIABLE TOKEN CLASSES")
        print("-" * 80)
        if overall_css_vars:
            for cls, count in overall_css_vars.most_common():
                print(f"{cls:<45} {count}")
        else:
            print("No CSS variable token classes found.")

    total_tailwind_occurrences = sum(overall_tailwind.values())
    total_tailwind_unique = len(overall_tailwind)
    files_with_tailwind = len(file_tailwind)

    print("\n" + "-" * 80)
    print(f"Files scanned:                    {sum(1 for _ in iter_files(root))}")
    print(f"Files with hardcoded colours:     {files_with_tailwind}")
    print(f"Unique hardcoded colour classes:  {total_tailwind_unique}")
    print(f"Total hardcoded occurrences:      {total_tailwind_occurrences}")

    if args.include_css_vars:
        print(f"Files with token classes:         {len(file_css_vars)}")
        print(f"Unique token classes:             {len(overall_css_vars)}")
        print(f"Total token occurrences:          {sum(overall_css_vars.values())}")

    csv_path = Path(args.csv).resolve()
    with csv_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["type", "file", "class", "count"])

        for file_name, counts in sorted(file_tailwind.items()):
            for cls, count in counts.most_common():
                writer.writerow(["hardcoded_tailwind", file_name, cls, count])

        if args.include_css_vars:
            for file_name, counts in sorted(file_css_vars.items()):
                for cls, count in counts.most_common():
                    writer.writerow(["css_var_token", file_name, cls, count])

    print(f"\nCSV report written to: {csv_path}")


if __name__ == "__main__":
    main()