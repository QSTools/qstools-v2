"""
check_has_loaded_guard.py

Convention rule: any hook with localStorage gets a has_loaded guard
before its save effect, applied from the start (otherwise a save effect
can fire on initial mount with empty/default state and overwrite real
saved data).

This is a heuristic, regex-based scan, NOT a real JS parser - review its
output rather than trusting it blindly. It flags useEffect blocks that
write to localStorage (setItem) and checks whether a has_loaded /
hasLoaded style guard appears anywhere earlier in the same file. It
cannot fully confirm the guard is wired into the RIGHT effect - just
that one exists somewhere upstream in the file.

Usage (from repo root):
    python check_has_loaded_guard.py

Scans all .js/.jsx/.ts/.tsx files for localStorage usage and reports:
    - Files that write to localStorage inside a useEffect
    - Whether a has_loaded-style guard variable/check appears in the file
    - A flag for files with a save effect but NO guard reference at all
      (the highest-confidence real gap)
"""

import os
import re

EXCLUDE_DIRS = {"node_modules", ".next", ".git", "dist", "build", "out"}
EXTENSIONS = {".js", ".jsx", ".ts", ".tsx"}

GUARD_PATTERN = re.compile(r'has_?[Ll]oaded', re.IGNORECASE)
SETITEM_PATTERN = re.compile(r'localStorage\.setItem')
USE_EFFECT_START = re.compile(r'useEffect\s*\(\s*(\(\)|\(?\s*async)?')


def find_files(root):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
        for fname in filenames:
            ext = os.path.splitext(fname)[1]
            if ext in EXTENSIONS:
                yield os.path.join(dirpath, fname)


def find_use_effect_blocks(text):
    """Returns list of (start_index, end_index) for each useEffect(...) call,
    balanced on parens."""
    blocks = []
    for match in re.finditer(r'useEffect\s*\(', text):
        start = match.end() - 1
        depth = 0
        i = start
        while i < len(text):
            if text[i] == '(':
                depth += 1
            elif text[i] == ')':
                depth -= 1
                if depth == 0:
                    blocks.append((match.start(), i))
                    break
            i += 1
    return blocks


def main():
    root = os.getcwd()
    flagged_no_guard = []
    flagged_has_guard = []
    files_scanned = 0

    for filepath in find_files(root):
        files_scanned += 1
        try:
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()
        except OSError:
            continue

        if "localStorage" not in text:
            continue

        effect_blocks = find_use_effect_blocks(text)
        save_effects_lines = []

        for start, end in effect_blocks:
            block_text = text[start:end]
            if SETITEM_PATTERN.search(block_text):
                lineno = text[:start].count("\n") + 1
                save_effects_lines.append(lineno)

        if not save_effects_lines:
            continue  # localStorage used, but not a setItem-in-useEffect pattern

        has_guard_anywhere = bool(GUARD_PATTERN.search(text))
        rel = os.path.relpath(filepath, root)

        if has_guard_anywhere:
            flagged_has_guard.append((rel, save_effects_lines))
        else:
            flagged_no_guard.append((rel, save_effects_lines))

    print(f"Scanned {files_scanned} file(s) under {root}")
    print()

    print(f"NO has_loaded-style guard found in file at all ({len(flagged_no_guard)}) "
          f"- HIGH CONFIDENCE gap, review these first:")
    for rel, lines in flagged_no_guard:
        print(f"    {rel}  (save effect at line(s): {', '.join(map(str, lines))})")
    print()

    print(f"Guard reference found SOMEWHERE in file ({len(flagged_has_guard)}) "
          f"- lower priority, but confirm the guard actually gates THIS save "
          f"effect, not just that the word appears in the file:")
    for rel, lines in flagged_has_guard:
        print(f"    {rel}  (save effect at line(s): {', '.join(map(str, lines))})")
    print()

    print("Review each flagged file manually - this script cannot confirm "
          "the guard is correctly placed, only that one exists (or doesn't) "
          "somewhere in the file.")


if __name__ == "__main__":
    main()
