"""
precommit_check.py   (V6.1bj, DEV_TOOLING_BRIEF T4)

ONE command that runs the checks before a commit and prints ONE line per step and a single PASS or FAIL, with detail
only for steps that failed. It CHANGES NO SOURCE. It runs: git status summary, a server check, npm run build, the unit
tests (Py\\model_storage_tests\\*.test.mjs), and the audit scripts. The build only writes .next (its normal output).

STEPS (line label: what makes it PASS / WARN / FAIL)
  git        info only: counts of modified, staged and untracked files
  servers    FAIL if anything listens on :3000, :3004 or :3005 (conventions rule 14: a build while a dev or production
             server runs corrupts .next). The build is then SKIPPED and the result is FAIL with the reason.
  build      npm run build, exit code decides (not red text: warnings arrive on stderr)
  tests      every Py\\model_storage_tests\\*.test.mjs run with node; FAIL on a non-zero exit or "N of M passed" with N < M
  trace      check_trace_coverage.py section B (wiring problems) must be empty
  briefs     check_brief_currency.py: WARN for STALE briefs or calc map (it means "look", never a failure)
  knowledge  check_project_knowledge_sync.py: WARN when project knowledge differs from the repo (normal mid-session)
  graph      check_graph_fresh.py: FAIL when STALE or MISSING (fix: add --refresh-graph, or run build_repo_graph.py)
  calcdrift  check_calc_map_drift.py when it exists (T3), else SKIP

Run (from D:\\QSTools\\qstools-web, stop npm run dev first):
    python Py\\audit-scripts\\precommit_check.py
    python Py\\audit-scripts\\precommit_check.py --no-build          (skip the build, e.g. while a server is up)
    python Py\\audit-scripts\\precommit_check.py --changed           (only tests whose text names a changed file)
    python Py\\audit-scripts\\precommit_check.py --refresh-graph     (rebuild the repo graph first, then check it)
    python Py\\audit-scripts\\precommit_check.py --serial            (run the tests one at a time)
Clipboard capture:
    & { python Py\\audit-scripts\\precommit_check.py } *>&1 | Out-String -Width 250 | Set-Clipboard
Exit code: 0 = PASS (warnings allowed), 1 = FAIL. Output is plain ASCII.
Limits: --changed picks tests by file NAME found in the test text (a heuristic); the default runs all of them.
  A step whose script is missing is SKIP, not PASS. PRECOMMIT_ROOT points at another repo root (testing only).
"""

import concurrent.futures
import datetime
import glob
import os
import re
import socket
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.environ.get("PRECOMMIT_ROOT") or os.path.abspath(os.path.join(HERE, "..", ".."))
PORTS = (3000, 3004, 3005)
TESTS_GLOB = os.path.join("Py", "model_storage_tests", "*.test.mjs")
DETAIL_LINES = 25
results = []     # (label, status, text, detail_lines)


def asc(s):
    return str(s).encode("ascii", "replace").decode("ascii")


def run(cmd, timeout, shell=False):
    t0 = time.time()
    try:
        p = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace",
                           timeout=timeout, shell=shell)
        return p.returncode, (p.stdout or "") + (p.stderr or ""), time.time() - t0
    except subprocess.TimeoutExpired:
        return 124, "TIMED OUT after %d s" % timeout, time.time() - t0
    except OSError as e:
        return 127, "could not start: %s" % e, time.time() - t0


def add(label, status, text, detail=None):
    results.append((label, status, text, detail or []))


def tail(out, n=DETAIL_LINES):
    lines = [l.rstrip() for l in out.splitlines() if l.strip()]
    return lines[-n:]


# ------------------------------------------------------------------ steps ---
def step_git():
    rc, out, _ = run(["git", "status", "--porcelain"], 60)
    if rc != 0:
        return add("git", "WARN", "git status failed", tail(out, 5)), []
    mod = stg = unt = 0
    names = []
    for l in out.splitlines():
        if len(l) < 4:
            continue
        x, y, f = l[0], l[1], l[3:].strip().strip('"').replace("\\", "/")
        if l.startswith("??"):
            unt += 1
        else:
            if x not in " ?":
                stg += 1
            if y not in " ?":
                mod += 1
        names.append(f)
    add("git", "INFO", "%d modified, %d staged, %d untracked" % (mod, stg, unt))
    return None, names


def listening(port):
    try:
        with socket.create_connection(("localhost", port), timeout=0.6):
            return True
    except OSError:
        return False


def step_servers():
    up = [p for p in PORTS if listening(p)]
    if up:
        add("servers", "FAIL", "something is listening on %s: stop it (Ctrl+C) before building" % ", ".join(":%d" % p for p in up))
        return False
    add("servers", "PASS", "nothing on " + " ".join(":%d" % p for p in PORTS))
    return True


def step_build(servers_ok, skip):
    if skip:
        return add("build", "SKIP", "--no-build given")
    if not servers_ok:
        return add("build", "SKIP", "refused: a server is running (conventions rule 14)")
    rc, out, secs = run("npm run build", 1500, shell=True)
    if rc == 0:
        add("build", "PASS", "npm run build exit 0 (%d s)" % secs)
    else:
        add("build", "FAIL", "npm run build exit %d (%d s)" % (rc, secs), tail(out))


def one_test(path):
    rc, out, _ = run(["node", path], 300)
    # The tests print their summary in different ways: "N of M passed", "SUMMARY PASS n / FAIL m", or only PASS:/FAIL: lines.
    m1 = list(re.finditer(r"(\d+) of (\d+) passed", out))
    m2 = list(re.finditer(r"SUMMARY PASS (\d+) / FAIL (\d+)", out))
    fail_lines = [l.strip() for l in out.splitlines() if l.startswith("FAIL")]
    if m1:
        p, t = int(m1[-1].group(1)), int(m1[-1].group(2))
    elif m2:
        p = int(m2[-1].group(1))
        t = p + int(m2[-1].group(2))
    else:
        p = sum(1 for l in out.splitlines() if l.startswith("PASS"))
        t = p + len(fail_lines)
    ok = rc == 0 and p == t and t > 0 and not fail_lines
    return os.path.basename(path), ok, p, t, fail_lines[:5], (tail(out, 6) if not fail_lines and not ok else [])


def step_tests(changed_names, only_changed, serial):
    files = sorted(glob.glob(os.path.join(ROOT, TESTS_GLOB)))
    if not files:
        return add("tests", "SKIP", "no test files under Py\\model_storage_tests")
    if only_changed:
        base = set(os.path.basename(n) for n in changed_names if n.endswith((".js", ".jsx", ".mjs", ".ts", ".tsx")))
        pick = []
        for f in files:
            txt = open(f, encoding="utf-8", errors="replace").read()
            if os.path.basename(f) in base or any(b in txt for b in base):
                pick.append(f)
        files = pick
        if not files:
            return add("tests", "PASS", "--changed: no test names a changed file (0 run)")
    if serial:
        res = [one_test(f) for f in files]
    else:
        with concurrent.futures.ThreadPoolExecutor(4) as ex:
            res = list(ex.map(one_test, files))
    bad = [r for r in res if not r[1]]
    checks = sum(r[3] for r in res)
    if not bad:
        return add("tests", "PASS", "%d files, %d checks, all passed" % (len(res), checks))
    detail = []
    for name, ok, p, t, fails, extra in bad:
        detail.append("%s: %d of %d passed" % (name, p, t))
        detail += ["    " + f for f in fails] + ["    " + e for e in extra]
    add("tests", "FAIL", "%d of %d test files failed" % (len(bad), len(res)), detail)


def script(name):
    p = os.path.join(HERE, name)
    return p if os.path.isfile(p) else None


def audit(name, timeout=300):
    p = script(name)
    if not p:
        return None, None
    rc, out, _ = run([sys.executable, p], timeout)
    return rc, out


def step_trace():
    rc, out = audit("check_trace_coverage.py")
    if out is None:
        return add("trace", "SKIP", "check_trace_coverage.py not found")
    m = re.search(r"B\. WIRING PROBLEMS\n(.*?)\nC\. CALC MAP", out, re.S)
    if not m:
        return add("trace", "WARN", "could not read section B of the report", tail(out, 5))
    probs = [l.strip() for l in m.group(1).splitlines()
             if l.strip() and not l.strip().startswith("note:") and l.strip() != "none found"]
    uncovered = len(re.findall(r"^  s\d+: ", out, re.M))
    # "<unresolved:id>" means the script could not read an id built from a template: a limit of that script (its own header says
    # so), not a fault. Everything else in section B is a real wiring problem.
    soft = [p for p in probs if "<unresolved:id>" in p]
    real = [p for p in probs if "<unresolved:id>" not in p]
    if real:
        return add("trace", "FAIL", "%d wiring problem(s)" % len(real), real[:DETAIL_LINES])
    if soft:
        files = sorted(set(re.findall(r"in (\S+\.js):", " ".join(soft))))
        return add("trace", "WARN", "%d line(s) from template ids the script cannot read (%s); the trace page integrity is the real check" % (
            len(soft), ", ".join(os.path.basename(f) for f in files) or "see report"))
    add("trace", "PASS", "no wiring problems; %d calc map section(s) list files with no node" % uncovered)


def step_briefs():
    rc, out = audit("check_brief_currency.py")
    if out is None:
        return add("briefs", "SKIP", "check_brief_currency.py not found")
    if "A. BRIEF vs CODE" not in out:
        return add("briefs", "WARN", "could not read the report", tail(out, 3))
    a = out.split("A. BRIEF vs CODE")[-1].split("Stale detail")[0].split("B. MAP vs FOLDER")[0]
    stale = len(re.findall(r"\bSTALE\b", a))
    cm = "STALE-CHECK" in out
    if stale or cm:
        return add("briefs", "WARN", "%d brief(s) older than their code%s (run the report to look)" % (
            stale, "; calc map older than its code" if cm else ""))
    add("briefs", "PASS", "briefs and calc map are current")


def step_knowledge():
    rc, out = audit("check_project_knowledge_sync.py")
    if out is None:
        return add("knowledge", "SKIP", "check_project_knowledge_sync.py not found")
    m = re.search(r"OK: (\d+)\s+CHANGED: (\d+)\s+MISSING: (\d+)\s+to add: (\d+)", out)
    if not m:
        return add("knowledge", "WARN", "no ledger or unreadable report", tail(out, 3))
    ok, ch, mi, ad = map(int, m.groups())
    if ch or mi or ad:
        return add("knowledge", "WARN", "%d changed, %d missing, %d to add (re-upload at session end)" % (ch, mi, ad))
    add("knowledge", "PASS", "project knowledge matches the repo (%d docs)" % ok)


def step_graph(refresh):
    if refresh:
        b = script("build_repo_graph.py")
        if b:
            run([sys.executable, b], 300)
    p = script("check_graph_fresh.py")
    if not p:
        return add("graph", "SKIP", "check_graph_fresh.py not found")
    rc, out, _ = run([sys.executable, p], 300)
    first = (out.strip().splitlines() or ["(no output)"])[0]
    if rc == 0:
        add("graph", "PASS", first.replace("OK repo graph is fresh: ", "fresh, "))
    else:
        add("graph", "FAIL", "repo graph is not fresh (add --refresh-graph)", tail(out, 8))


def step_calcdrift():
    p = script("check_calc_map_drift.py")
    if not p:
        return add("calcdrift", "SKIP", "check_calc_map_drift.py not built yet (T3)")
    rc, out, _ = run([sys.executable, p], 300)
    first = (out.strip().splitlines() or ["(no output)"])[0]
    add("calcdrift", "PASS" if rc == 0 else "WARN", first[:100], [] if rc == 0 else tail(out, 10))


def main():
    argv = sys.argv[1:]
    print("PRECOMMIT CHECK  %s  %s" % (ROOT, datetime.datetime.now().strftime("%Y-%m-%d %H:%M")))
    _, names = step_git()
    names = names or []
    servers_ok = step_servers()
    step_build(servers_ok, "--no-build" in argv)
    step_tests(names, "--changed" in argv, "--serial" in argv)
    step_trace()
    step_briefs()
    step_knowledge()
    step_graph("--refresh-graph" in argv)
    step_calcdrift()
    for label, status, text, _ in results:
        print(asc("%-9s: %-4s %s" % (label, status, text)))
    fails = [r for r in results if r[1] == "FAIL"]
    warns = [r for r in results if r[1] == "WARN"]
    for label, status, text, detail in results:
        if status == "FAIL" and detail:
            print(asc("\n-- %s detail --" % label))
            for l in detail[:DETAIL_LINES]:
                print(asc(l))
    print("\nRESULT: %s%s" % ("FAIL (%s)" % ", ".join(r[0] for r in fails) if fails else "PASS",
                              "" if not warns else "  [%d warning(s): %s]" % (len(warns), ", ".join(r[0] for r in warns))))
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
