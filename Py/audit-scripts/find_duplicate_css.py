"""
find_duplicate_css.py

Scans all .css files in the repo, extracts each rule block
(selector { ...declarations... }), and flags blocks whose
DECLARATION CONTENT is identical or near-identical across
different selectors/files - candidates for consolidation.

Usage (from repo root):
    python find_duplicate_css.py

Output:
    - Prints groups of matching/near-matching rule blocks
    - Writes full detail to duplicate_css_report.txt

Notes:
    - Matching is done on normalized declaration text (whitespace
      and ordering-insensitive), not on selector names, so it will
      catch e.g. two differently-named classes with identical rules.
    - This is a CANDIDATE finder, not an automatic merge. Every
      match still needs a human look before consolidating, since
      visually-identical rules can be intentionally separate.
"""

import os
import re
from collections import defaultdict

EXCLUDE_DIRS = {"node_modules", ".next", ".git", "dist", "build", "out"}

RULE_PATTERN = re.compile(r'([^{}]+)\{([^{}]*)\}', re.DOTALL)


def find_css_files(root):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
        for fname in filenames:
            if fname.endswith(".css"):
                yield os.path.join(dirpath, fname)


def normalize_declarations(decl_text):
    # Split into individual declarations, strip whitespace, sort them
    # so ordering differences don't prevent a match.
    parts = [p.strip() for p in decl_text.split(";") if p.strip()]
    parts = [re.sub(r'\s+', ' ', p) for p in parts]
    return tuple(sorted(parts))


def main():
    root = os.getcwd()
    # key: normalized declarations tuple -> list of (file, selector, raw_decl_line_count)
    groups = defaultdict(list)

    file_count = 0
    rule_count = 0

    for filepath in find_css_files(root):
        file_count += 1
        rel = os.path.relpath(filepath, root)
        try:
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
        except OSError:
            continue

        for match in RULE_PATTERN.finditer(content):
            selector = match.group(1).strip()
            decl_text = match.group(2)
            if not decl_text.strip():
                continue
            # skip @media / @keyframes wrapper lines picked up as "selectors"
            if selector.startswith("@"):
                continue

            norm = normalize_declarations(decl_text)
            if len(norm) < 2:
                # too small a rule to be a meaningful duplicate candidate
                continue

            rule_count += 1
            groups[norm].append((rel, selector, len(norm)))

    duplicate_groups = {k: v for k, v in groups.items() if len(v) > 1}

    print(f"Scanned {file_count} CSS file(s), {rule_count} rule block(s).")
    print(f"Duplicate/near-duplicate declaration groups found: {len(duplicate_groups)}")
    print()

    # Sort groups by how many declarations they share (bigger = more significant duplicate)
    sorted_groups = sorted(duplicate_groups.items(), key=lambda kv: -kv[0].__len__())

    for i, (norm, occurrences) in enumerate(sorted_groups[:25], start=1):
        print(f"Group {i} - {len(norm)} shared declarations, {len(occurrences)} occurrences:")
        for rel, selector, _ in occurrences:
            sel_display = selector.replace("\n", " ").strip()
            if len(sel_display) > 60:
                sel_display = sel_display[:57] + "..."
            print(f"    {rel}: {sel_display}")
        print()

    if len(sorted_groups) > 25:
        print(f"... and {len(sorted_groups) - 25} more groups (see full report file).")

    report_path = os.path.join(root, "duplicate_css_report.txt")
    with open(report_path, "w", encoding="utf-8") as out:
        out.write("DUPLICATE / NEAR-DUPLICATE CSS RULE REPORT\n")
        out.write(f"Scanned: {root}\n")
        out.write(f"CSS files: {file_count}, rule blocks: {rule_count}\n")
        out.write(f"Duplicate groups: {len(duplicate_groups)}\n")
        out.write("=" * 70 + "\n\n")
        for i, (norm, occurrences) in enumerate(sorted_groups, start=1):
            out.write(f"Group {i} - {len(norm)} shared declarations, {len(occurrences)} occurrences\n")
            out.write("  Shared declarations:\n")
            for decl in norm:
                out.write(f"    {decl};\n")
            out.write("  Found in:\n")
            for rel, selector, _ in occurrences:
                sel_display = selector.replace("\n", " ").strip()
                out.write(f"    {rel}: {sel_display}\n")
            out.write("\n")

    print(f"Full detail written to: {report_path}")
    print("Paste the console summary (or report file) back into chat for review.")


if __name__ == "__main__":
    main()
