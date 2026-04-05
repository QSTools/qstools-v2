from __future__ import annotations

import argparse
from collections import Counter
from pathlib import Path
from typing import Dict, Iterable

REPLACEMENTS: Dict[str, str] = {
    # Neutral theme replacements
    "bg-neutral-950": "bg-[var(--bg-input)]",
    "bg-neutral-900": "bg-[var(--bg-card)]",
    "bg-neutral-800": "bg-[var(--bg-card-muted)]",

    "border-neutral-800": "border-[var(--border-primary)]",
    "border-neutral-700": "border-[var(--border-strong)]",

    "text-neutral-100": "text-[var(--text-primary)]",
    "text-neutral-200": "text-[var(--text-primary)]",
    "text-neutral-300": "text-[var(--text-secondary)]",
    "text-neutral-400": "text-[var(--text-muted)]",
    "text-neutral-500": "text-[var(--text-muted)]",

    # Hardcoded base colors blocking themes
    "text-white": "text-[var(--text-primary)]",
    "bg-black": "bg-[var(--bg-card-muted)]",
}

ALLOWED_SUFFIXES = {".js", ".jsx", ".ts", ".tsx", ".css", ".scss", ".mdx"}
SKIP_DIRS = {".git", "node_modules", ".next", "dist", "build", "coverage"}


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


def find_matches(text: str) -> Counter:
    found = Counter()
    for old in REPLACEMENTS:
        count = text.count(old)
        if count:
            found[old] = count
    return found


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Replace Cost Summary hardcoded theme classes with CSS var tokens."
    )
    parser.add_argument("root", help="Folder to scan")
    parser.add_argument("--write", action="store_true", help="Write changes")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    if not root.exists():
        raise SystemExit(f"Folder does not exist: {root}")

    total_files = 0
    total_changes = 0

    for file_path in iter_files(root):
        text = read_text_safe(file_path)
        if text is None:
            continue

        found = find_matches(text)
        if not found:
            continue

        updated = text
        for old in sorted(REPLACEMENTS, key=len, reverse=True):
            updated = updated.replace(old, REPLACEMENTS[old])

        print(f"\n{'WRITE' if args.write else 'DRY'}  {file_path}")
        for old, count in found.most_common():
            print(f"  {old:<25} -> {REPLACEMENTS[old]}   ({count})")

        if args.write:
            file_path.write_text(updated, encoding="utf-8")

        total_files += 1
        total_changes += sum(found.values())

    print("\n" + "=" * 72)
    print(f"Mode: {'WRITE' if args.write else 'DRY RUN'}")
    print(f"Files changed: {total_files}")
    print(f"Total replacements: {total_changes}")


if __name__ == "__main__":
    main()