"""
check_project_knowledge_sync.py   (V6.1d step 8, read-only, content-hash version)

Answers: does Claude's project knowledge match the repo? Project knowledge does
not auto-sync (conventions rule 13) and a script cannot read it, so Claude keeps
a LEDGER of what it last uploaded:

    .tmp\\project_sync_ledger.tsv   one line per project doc:
                                   repo_path<TAB>sha256<TAB>synced_at<TAB>project_path
                                   (sha256 of the exact bytes uploaded)

Claude rewrites the ledger every time it uploads. This script hashes the repo
file now and compares. Dates are NOT used (a replaced project doc keeps its
original created_at, so dates give false answers).

Verdicts per ledger line:
    OK           repo file is byte-identical to what was uploaded
    CHANGED      repo file differs from the upload (re-upload it); uncommitted flag shown
    MISSING      repo file no longer exists at that path (moved or archived: fix the ledger / remove from project)
Then lists core-set files that are in the repo but not in the ledger (add them).

Limit: a git checkout can change line endings in the working copy, which shows as
CHANGED even though the text is the same. If every file shows CHANGED right after a
checkout, tell Claude; it will re-stage and re-upload.

Usage (from D:\\QSTools\\qstools-web):
    python Py\\audit-scripts\\check_project_knowledge_sync.py
    python Py\\audit-scripts\\check_project_knowledge_sync.py --ledger <file>   (default .tmp\\project_sync_ledger.tsv)
    python Py\\audit-scripts\\check_project_knowledge_sync.py <repo_root>

Clipboard capture:
    & { python Py\\audit-scripts\\check_project_knowledge_sync.py } *>&1 | Out-String -Width 250 | Set-Clipboard

Output is plain ASCII. Exit code is always 0 (report only).
"""

import hashlib
import subprocess
import sys
from pathlib import Path

DEFAULT_LEDGER = Path(".tmp") / "project_sync_ledger.tsv"
# What project knowledge should hold: conventions, the map, the calc map, the variable
# tracker, and every module brief (all .txt in the Briefs folder).
CORE_FILES = [
    "Working_Conventions_PowerShell_Patching_CSS_and_Numeric_Verification.txt",
    "docs/fin_mirra_v6.1/PROJECT_MAP.md",
    "docs/fin_mirra_v6.1/Calculations/CALCULATION_MAP_v6_0.txt",
    "docs/fin_mirra_v6.1/Calculations/VARIABLE_TRACKER_v6_0.txt",
]
CORE_DIRS = ["docs/fin_mirra_v6.1/Briefs"]


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def uncommitted(root, rel):
    try:
        r = subprocess.run(["git", "status", "--porcelain", "--", rel], cwd=str(root),
                           capture_output=True, text=True, encoding="utf-8", errors="replace")
    except OSError:
        return "?"
    return "yes" if r.stdout.strip() else "no"


def read_ledger(path):
    rows = []
    for line in path.read_text(encoding="utf-8-sig", errors="replace").splitlines():
        if not line.strip() or line.startswith("#"):
            continue
        parts = line.split("\t")
        if len(parts) >= 4:
            rows.append((parts[0].strip().replace("\\", "/"), parts[1].strip().lower(), parts[2].strip(), parts[3].strip()))
    return rows


def core_list(root):
    out = [c for c in CORE_FILES if (root / c).is_file()]
    for d in CORE_DIRS:
        if (root / d).is_dir():
            out.extend(sorted(x.relative_to(root).as_posix() for x in (root / d).glob("*.txt")))
    return out


def main():
    argv = sys.argv[1:]
    ledger_path = None
    if "--ledger" in argv:
        i = argv.index("--ledger")
        ledger_path = Path(argv[i + 1])
        del argv[i:i + 2]
    positional = [a for a in argv if not a.startswith("--")]
    root = Path(positional[0]).resolve() if positional else Path.cwd()
    if not (root / "docs").is_dir():
        print("NOT FOUND: docs folder under " + str(root) + "  (run from the repo root or pass it)")
        return 0
    ledger_path = ledger_path or (root / DEFAULT_LEDGER)

    print("PROJECT KNOWLEDGE SYNC REPORT (content hash)   root: " + str(root))
    if not ledger_path.is_file():
        print("\nNo ledger at " + str(ledger_path) + ". Ask Claude to write it (it is written at upload time).")
        return 0

    rows = read_ledger(ledger_path)
    print("\nA. LEDGER vs REPO   (%d project docs, ledger: %s)" % (len(rows), ledger_path))
    print("%-9s %-20s %-11s %s" % ("verdict", "synced (UTC)", "uncommitted", "project doc  [repo file]"))
    ok = changed = missing = 0
    todo = []
    for rel, want, synced, ppath in rows:
        f = root / rel
        if not f.is_file():
            print("%-9s %-20s %-11s %s  [%s]" % ("MISSING", synced, "-", ppath, rel))
            missing += 1
            todo.append("fix or remove: " + ppath)
            continue
        if sha256(f) == want:
            print("%-9s %-20s %-11s %s" % ("OK", synced, "-", ppath))
            ok += 1
        else:
            print("%-9s %-20s %-11s %s  [%s; now %s, uploaded %s]" % (
                "CHANGED", synced, uncommitted(root, rel), ppath, rel, sha256(f)[:12], want[:12]))
            changed += 1
            todo.append("re-upload: " + ppath)

    in_ledger = {r[0] for r in rows}
    not_in = [c for c in core_list(root) if c not in in_ledger]
    print("\nB. CORE SET FILES NOT IN THE LEDGER (add to project knowledge)")
    if not_in:
        for rel in not_in:
            print("  " + rel)
    else:
        print("  none")

    print("\nC. SUMMARY   OK: %d   CHANGED: %d   MISSING: %d   to add: %d" % (ok, changed, missing, len(not_in)))
    for t in todo:
        print("  " + t)
    if ok == len(rows) and not not_in:
        print("  Project knowledge matches the repo.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
