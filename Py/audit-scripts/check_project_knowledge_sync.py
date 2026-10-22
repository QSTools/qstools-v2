"""
check_project_knowledge_sync.py   (V6.1 step 5c, read-only)

Answers: does Claude's project knowledge match the repo? Project knowledge
does not auto-sync (conventions rule 13), and a script cannot read it, so
this works from a LIST of the project's docs that Claude writes first:

    .tmp\\project_docs.tsv      one line per project doc:  path<TAB>uploaded_at
                               (ISO time from the project's doc list, UTC)

Claude regenerates that file at the start of a sync check (from the project
doc list) and you run this script. Without the list it prints only the
manifest of the core set.

For every project doc it finds the repo file of the same name (live
folders first, Archive last) and reports:
    OK         repo file not changed since the upload
    STALE      repo file changed after the upload (re-upload it)
    ARCHIVED   only an Archive copy exists (remove from the project)
    NOT IN REPO  no file of that name anywhere (check by hand)
Then it lists core-set files that are in the repo but not in the project.

Limits: "changed" is the working-copy modified time (UTC), so it also notices
uncommitted edits, but a git checkout or copy can make a file look newer than
its content really is; for each STALE line the uncommitted flag and sha256
help you decide, and Claude can diff the two copies. A file counts as newer
when it is more than 120 seconds after the upload. Names are matched by
file name only (the project's "claude/" prefix is dropped).

Usage (from D:\\QSTools\\qstools-web):
    python Py\\audit-scripts\\check_project_knowledge_sync.py
    python Py\\audit-scripts\\check_project_knowledge_sync.py --list <file>   (default .tmp\\project_docs.tsv)
    python Py\\audit-scripts\\check_project_knowledge_sync.py <repo_root>

Clipboard capture (conventions 2026-10-10):
    & { python Py\\audit-scripts\\check_project_knowledge_sync.py } *>&1 | Out-String -Width 250 | Set-Clipboard

Output is plain ASCII. Exit code is always 0 (report only).
"""

import hashlib
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

DEFAULT_LIST = Path(".tmp") / "project_docs.tsv"
SKIP_DIRS = {"node_modules", ".next", ".git", "dist", "build", "out", "__pycache__"}
GRACE_SECONDS = 120
# What project knowledge should hold once step 7 is done: conventions, the map,
# every module brief, the calc map and the variable tracker.
CORE_SET = [
    "Working_Conventions_PowerShell_Patching_CSS_and_Numeric_Verification.txt",
    "PROJECT_MAP.md",
    "CALCULATION_MAP_v6_0.txt",
    "VARIABLE_TRACKER_v6_0.txt",
]
CORE_DIRS = [Path("docs") / "fin_mirra_v6.1" / "Briefs"]


def sha12(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()[:12]


def utc(ts):
    return datetime.fromtimestamp(ts, tz=timezone.utc)


def parse_time(text):
    t = text.strip().replace("Z", "+00:00")
    d = datetime.fromisoformat(t)
    return d if d.tzinfo else d.replace(tzinfo=timezone.utc)


def build_index(root):
    """basename -> list of repo-relative posix paths (live and Archive)."""
    index = {}
    for p in (root / "docs").rglob("*"):
        if p.is_file() and not any(part in SKIP_DIRS for part in p.relative_to(root).parts):
            index.setdefault(p.name, []).append(p.relative_to(root).as_posix())
    for p in root.glob("*"):
        if p.is_file():
            index.setdefault(p.name, []).append(p.relative_to(root).as_posix())
    return index


def pick(paths):
    """Prefer a live copy over an Archive copy. Returns (path, is_archive_only)."""
    live = [p for p in paths if "/Archive/" not in p]
    if live:
        return sorted(live)[0], False
    return (sorted(paths)[0] if paths else None), bool(paths)


def uncommitted(root, rel):
    try:
        r = subprocess.run(["git", "status", "--porcelain", "--", rel], cwd=str(root),
                           capture_output=True, text=True, encoding="utf-8", errors="replace")
    except OSError:
        return "?"
    return "yes" if r.stdout.strip() else "no"


def read_list(path):
    rows = []
    for line in path.read_text(encoding="utf-8-sig", errors="replace").splitlines():
        if not line.strip() or line.startswith("#"):
            continue
        parts = line.split("\t")
        if len(parts) >= 2:
            rows.append((parts[0].strip(), parse_time(parts[1])))
    return rows


def main():
    argv = sys.argv[1:]
    list_path = None
    if "--list" in argv:
        i = argv.index("--list")
        list_path = Path(argv[i + 1])
        del argv[i:i + 2]
    positional = [a for a in argv if not a.startswith("--")]
    root = Path(positional[0]).resolve() if positional else Path.cwd()
    if not (root / "docs").is_dir():
        print("NOT FOUND: docs folder under " + str(root) + "  (run from the repo root or pass it)")
        return 0
    list_path = list_path or (root / DEFAULT_LIST)
    index = build_index(root)

    print("PROJECT KNOWLEDGE SYNC REPORT   root: " + str(root))

    # core set manifest
    core = []
    for name in CORE_SET:
        p, archived = pick(index.get(name, []))
        if p and not archived:
            core.append(p)
    for d in CORE_DIRS:
        if (root / d).is_dir():
            core.extend(sorted(x.relative_to(root).as_posix() for x in (root / d).glob("*.txt")))
    print("\nA. CORE SET MANIFEST (what project knowledge should hold)")
    print("%8s  %-16s %-12s %-11s %s" % ("bytes", "changed (UTC)", "sha256", "uncommitted", "repo file"))
    for rel in core:
        f = root / rel
        print("%8d  %-16s %-12s %-11s %s" % (f.stat().st_size,
                                             utc(f.stat().st_mtime).strftime("%Y-%m-%d %H:%M"),
                                             sha12(f), uncommitted(root, rel), rel))

    if not list_path.is_file():
        print("\nNo project list at " + str(list_path) + ". Ask Claude to write it, then rerun for the comparison.")
        return 0

    rows = read_list(list_path)
    print("\nB. PROJECT DOCS vs REPO   (%d project docs, list: %s)" % (len(rows), list_path))
    print("%-12s %-16s %-16s %s" % ("verdict", "uploaded (UTC)", "repo changed", "project doc  [repo file / note]"))
    matched_names = set()
    to_upload, to_remove, to_check = [], [], []
    for ppath, uploaded in rows:
        name = ppath.split("/")[-1]
        matched_names.add(name)
        rel, archived_only = pick(index.get(name, []))
        up = uploaded.strftime("%Y-%m-%d %H:%M")
        if not rel:
            print("%-12s %-16s %-16s %s" % ("NOT IN REPO", up, "-", ppath))
            to_check.append(ppath)
        elif archived_only:
            print("%-12s %-16s %-16s %s  [%s]" % ("ARCHIVED", up, "-", ppath, rel))
            to_remove.append(ppath)
        else:
            f = root / rel
            changed = utc(f.stat().st_mtime)
            newer = (changed - uploaded).total_seconds() > GRACE_SECONDS
            unc = uncommitted(root, rel)
            note = "  [%s; uncommitted: %s; sha %s]" % (rel, unc, sha12(f)) if newer else ""
            print("%-12s %-16s %-16s %s%s" % ("STALE" if newer else "OK", up,
                                              changed.strftime("%Y-%m-%d %H:%M"), ppath, note))
            if newer:
                to_upload.append((ppath, rel))

    missing = [rel for rel in core if rel.split("/")[-1] not in matched_names]
    print("\nC. CORE SET FILES NOT IN PROJECT KNOWLEDGE")
    if missing:
        for rel in missing:
            print("  " + rel)
    else:
        print("  none")

    print("\nD. ACTIONS")
    print("  re-upload (repo newer): %d" % len(to_upload))
    for ppath, rel in to_upload:
        print("     %s  <-  %s" % (ppath, rel))
    print("  remove (archived in repo): %d" % len(to_remove))
    for ppath in to_remove:
        print("     " + ppath)
    print("  check by hand (not in repo): %d" % len(to_check))
    for ppath in to_check:
        print("     " + ppath)
    print("  add (core set, not in project): %d" % len(missing))
    return 0


if __name__ == "__main__":
    sys.exit(main())
