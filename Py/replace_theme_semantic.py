from __future__ import annotations

import argparse
from collections import Counter
from pathlib import Path
from typing import Dict, Iterable

REPLACEMENTS: Dict[str, str] = {
    # Success
    "text-emerald-300": "text-[var(--success)]",
    "text-emerald-400": "text-[var(--success)]",
    "bg-emerald-950": "bg-[var(--success-soft)]",
    "bg-emerald-900": "bg-[var(--success-soft)]",
    "border-emerald-700": "border-[var(--success)]",
    "border-emerald-800": "border-[var(--success)]",

    # Warning
    "text-amber-100": "text-[var(--warning)]",
    "text-amber-200": "text-[var(--warning)]",
    "text-amber-300": "text-[var(--warning)]",
    "text-amber-400": "text-[var(--warning)]",
    "bg-amber-950": "bg-[var(--warning-soft)]",
    "bg-amber-900": "bg-[var(--warning-soft)]",
    "border-amber-700": "border-[var(--warning)]",
    "border-amber-800": "border-[var(--warning)]",
    "border-amber-900": "border-[var(--warning)]",

    # Danger
    "text-rose-200": "text-[var(--danger)]",
    "text-rose-300": "text-[var(--danger)]",
    "text-rose-400": "text-[var(--danger)]",
    "bg-rose-950": "bg-[var(--danger-soft)]",
    "bg-rose-900": "bg-[var(--danger-soft)]",
    "border-rose-700": "border-[var(--danger)]",
    "border-rose-800": "border-[var(--danger)]",

    "text-red-200": "text-[var(--danger)]",
    "text-red-300": "text-[var(--danger)]",
    "bg-red-950": "bg-[var(--danger-soft)]",
    "border-red-800": "border-[var(--danger)]",
    "border-red-900": "border-[var(--danger)]",

    # Info
    "text-sky-100": "text-[var(--info)]",
    "text-sky-300": "text-[var(--info)]",
    "bg-sky-950": "bg-[var(--info-soft)]",
    "border-sky-800": "border-[var(--info)]",
    "border-sky-900": "border-[var(--info)]",

    "text-blue-100": "text-[var(--info)]",
    "bg-blue-950": "bg-[var(--info-soft)]",
    "border-blue-900": "border-[var(--info)]",
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
        description="Replace semantic Tailwind color classes with CSS var semantic tokens."
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