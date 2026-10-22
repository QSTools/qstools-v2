"""
check_brief_currency.py   (V6.1 step 5b, read-only)

Answers: is each module brief at least as new as the code it describes?
Changes nothing. Needs git on the PATH (it only reads history).

For every row of the module table in docs\\fin_mirra_v6.1\\PROJECT_MAP.md:
  brief date  = the later of the brief's "LAST UPDATED:" header date and any
                dated "ADDENDUM <n> ... <date>" heading; if the brief has
                neither, the brief file's last commit date.
  code date   = last commit date of the module's key files (the backticked
                paths in the table's last column).
  STALE       = any key file has a commit AFTER the brief date. The commits
                are listed so you can tell a calculation change from a
                cosmetic one. STALE means "look", not "the brief is wrong".

Also reports: briefs not in PROJECT_MAP and map entries with no brief file,
the highest addendum number per brief (so new ones do not clash), the calc
map's last UPDATED date against its calculation files, key-file names it
could not resolve to a real path, and references to retired paths.

Limits: key files come from the map's short list, not each brief's full
Section 6. Date comparison is by calendar day (git's %cs, committer date).

Usage (from D:\\QSTools\\qstools-web):
    python Py\\audit-scripts\\check_brief_currency.py
    python Py\\audit-scripts\\check_brief_currency.py <repo_root>

Clipboard capture (conventions 2026-10-10):
    & { python Py\\audit-scripts\\check_brief_currency.py } *>&1 | Out-String -Width 250 | Set-Clipboard

Output is plain ASCII. Exit code is always 0 (report only).
"""

import re
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

PROJECT_MAP = Path("docs") / "fin_mirra_v6.1" / "PROJECT_MAP.md"
BRIEFS_DIR = Path("docs") / "fin_mirra_v6.1" / "Briefs"
CALC_MAP = Path("docs") / "fin_mirra_v6.1" / "Calculations" / "CALCULATION_MAP_v6_0.txt"
SKIP_DIRS = {"node_modules", ".next", ".git", "dist", "build", "out", "Archive", "__pycache__"}
CODE_EXT = {".js", ".jsx", ".mjs", ".ts", ".tsx"}
DATE = re.compile(r"\d{4}-\d{2}-\d{2}")
# Paths that were retired by the V6.1 reorganisation. A brief still using one is stale text.
RETIRED = [
    (r"fin_mirra_v6\.0 Briefs", "old brief folder"),
    (r"docs[\\/]+Audit[\\/]+v6_0", "old audit folder (now fin_mirra_v6.1\\Audit\\v6_0)"),
    (r"R2_HANDOVER_2026-10-18", "archived handover"),
    (r"V6_0_KICKOFF_AND_HANDOVER", "archived kickoff"),
    (r"CALCULATION_TRACE_VERIFICATION_LAYER", "archived trace brief (now CALCULATION_TRACE_BRIEF)"),
]


def read(path):
    return path.read_text(encoding="utf-8-sig", errors="replace")


def git(root, *args):
    """Run git, return stdout text or None when git is missing or fails."""
    try:
        r = subprocess.run(["git", *args], cwd=str(root), capture_output=True,
                           text=True, encoding="utf-8", errors="replace")
    except OSError:
        return None
    return r.stdout if r.returncode == 0 else None


def build_index(root):
    """All code files, by basename, so short names in the map can be resolved."""
    index = defaultdict(list)
    for p in root.rglob("*"):
        if p.suffix in CODE_EXT and not any(part in SKIP_DIRS for part in p.relative_to(root).parts):
            index[p.name].append(p.relative_to(root).as_posix())
    return index


def resolve(token, root, index, all_paths):
    """Turn one backticked token from the map into a list of repo paths."""
    t = token.strip().replace("\\", "/")
    if t.endswith("/*"):
        d = root / t[:-2]
        if d.is_dir():
            return [t[:-2]]
        return []
    if t.startswith("..."):
        suffix = t[3:]
        return [p for p in all_paths if p.endswith(suffix)]
    if "/" in t:
        return [t] if (root / t).exists() else []
    return index.get(t, [])


def parse_module_table(map_text):
    """Rows of section 2: (module, brief_name, [key-file tokens])."""
    m = re.search(r"^## 2\..*?$(.*?)^## 3\.", map_text, re.S | re.M)
    rows = []
    if not m:
        return rows
    for line in m.group(1).splitlines():
        if not line.startswith("|") or re.match(r"^\|\s*-", line) or re.match(r"^\|\s*Module\s*\|", line):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) < 5:
            continue
        brief = cells[2].strip("` ")
        tokens = re.findall(r"`([^`]+)`", cells[4])
        rows.append((cells[0], brief, tokens))
    return rows


def addenda(text):
    """(latest date, highest addendum number) from the brief.
    Dates come from the "LAST UPDATED:" header and from ADDENDUM heading lines
    that carry a date. Numbers come only from "ADDENDUM <n> ..." headings."""
    dates, numbers = [], []
    for line in text.splitlines():
        if re.match(r"^\s*LAST UPDATED\b", line, re.I):
            d = DATE.search(line)
            if d:
                dates.append(d.group(0))
        m = re.match(r"^\s*(?:=+\s*)?ADDENDUM\s+(\d{1,3})?\b", line, re.I)
        if m and DATE.search(line):
            dates.append(DATE.search(line).group(0))
            if m.group(1):
                numbers.append(int(m.group(1)))
    return (max(dates) if dates else None), (max(numbers) if numbers else None)


def last_commit_date(root, paths):
    out = git(root, "log", "-1", "--format=%cs", "--", *paths)
    return out.strip() if out and out.strip() else None


def commits_after(root, date, paths, limit=4):
    """Commits on these paths dated after the given day."""
    out = git(root, "log", "--format=%cs %h %s", "--after=" + date + " 23:59:59", "--", *paths)
    lines = [l for l in (out or "").splitlines() if l.strip()]
    return len(lines), lines[:limit]


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    root = Path(args[0]).resolve() if args else Path.cwd()
    map_path = root / PROJECT_MAP
    if not map_path.is_file():
        print("NOT FOUND: " + str(map_path) + "  (run from the repo root or pass it)")
        return 0
    have_git = git(root, "rev-parse", "--is-inside-work-tree") is not None
    print("BRIEF CURRENCY REPORT   root: " + str(root))
    if not have_git:
        print("WARNING: git not available here; dates and staleness cannot be checked, only the structural checks run.")

    index = build_index(root)
    all_paths = [p for lst in index.values() for p in lst]
    rows = parse_module_table(read(map_path))
    print("Modules in PROJECT_MAP table: %d\n" % len(rows))

    print("A. BRIEF vs CODE")
    print("%-34s %-11s %-11s %-4s %-11s %s" % ("brief", "brief date", "from", "add#", "code date", "status"))
    detail, unresolved, all_key_files = [], [], []
    for module, brief, tokens in rows:
        bpath = root / BRIEFS_DIR / (brief + ".txt")
        if not bpath.is_file():
            print("%-34s %s" % (brief[:34], "BRIEF FILE MISSING in " + BRIEFS_DIR.as_posix()))
            continue
        text = read(bpath)
        bdate, bnum = addenda(text)
        source = "in file"
        if not bdate and have_git:
            bdate = last_commit_date(root, [(BRIEFS_DIR / (brief + ".txt")).as_posix()])
            source = "file commit"
        files = []
        for tok in tokens:
            found = resolve(tok, root, index, all_paths)
            if not found:
                unresolved.append((brief, tok))
            files.extend(found)
        files = sorted(set(files))
        all_key_files.extend(files)
        cdate = last_commit_date(root, files) if (have_git and files) else None
        if not have_git or not bdate:
            status = "no date"
        elif not cdate:
            status = "no code history"
        else:
            n, lines = commits_after(root, bdate, files)
            if n:
                status = "STALE (%d commit%s after brief)" % (n, "" if n == 1 else "s")
                detail.append((brief, bdate, lines))
            else:
                status = "ok"
        print("%-34s %-11s %-11s %-4s %-11s %s" % (brief[:34], bdate or "-", source if bdate else "-",
                                                   bnum if bnum is not None else "-", cdate or "-", status))

    if detail:
        print("\nStale detail (newest first; check whether each touched a calculation, then update the brief):")
        for brief, bdate, lines in detail:
            print("  %s (brief dated %s):" % (brief, bdate))
            for l in lines:
                print("      " + l)

    if unresolved:
        print("\nKey-file names in PROJECT_MAP that did not resolve to a real path (fix the map entry):")
        for brief, tok in unresolved:
            print("  %s: %s" % (brief, tok))

    print("\nB. MAP vs FOLDER")
    in_map = {b for _, b, _ in rows}
    on_disk = {p.stem for p in (root / BRIEFS_DIR).glob("*.txt")}
    for b in sorted(on_disk - in_map):
        print("  brief not in PROJECT_MAP module table: " + b)
    for b in sorted(in_map - on_disk):
        print("  PROJECT_MAP names a brief that is not on disk: " + b)
    if on_disk == in_map:
        print("  every brief in Briefs\\ is in the map table and vice versa")

    print("\nC. CALCULATION MAP")
    cm = root / CALC_MAP
    if cm.is_file():
        updates = DATE.findall("\n".join(l for l in read(cm).splitlines() if re.match(r"^\s*UPDATED\b", l)))
        cm_date = max(updates) if updates else None
        calc_files = sorted({f for f in all_key_files if f.startswith("lib/") or f.startswith("hooks/")})
        print("  last UPDATED header date: %s   (%d key code files checked)" % (cm_date or "-", len(calc_files)))
        if have_git and cm_date and calc_files:
            n, lines = commits_after(root, cm_date, calc_files)
            if n:
                print("  STALE-CHECK: %d commit%s on key code files after that date (a calculation change needs the map re-run):" % (n, "" if n == 1 else "s"))
                for l in lines:
                    print("      " + l)
            else:
                print("  ok: no key-file commits after the map's last update")
    else:
        print("  NOT FOUND: " + str(cm))

    print("\nD. RETIRED PATHS STILL REFERENCED (candidates for step 6)")
    targets = sorted((root / BRIEFS_DIR).glob("*.txt")) + [map_path, root / CALC_MAP]
    hits = 0
    for p in targets:
        if not p.is_file():
            continue
        text = read(p)
        for pattern, label in RETIRED:
            count = len(re.findall(pattern, text))
            if count:
                hits += 1
                print("  %-44s %2dx  %s" % (p.name[:44], count, label))
    if not hits:
        print("  none")
    return 0


if __name__ == "__main__":
    sys.exit(main())
