"""
headless_regression.py - the seed regression run headless on the owner's machine (V6.1cd, G3, DEV_TOOLING A5).

WHAT IT DOES: for each seed in public\\__stress_tmp it opens a FRESH headless browser context (own storage, so seeds cannot
  overwrite each other and the owner's Chrome and the pane are never touched), writes the seed keys into localStorage on the
  production server's origin, opens /calculation-trace, downloads the trace JSON the same way the button does, and checks it
  with compare_full.py --summary (the same pass rule and tolerances as before). It prints ONE line when all pass.
  On a failure it also writes .tmp\\regression_failures.txt (failing seeds only, FAIL / MISSING rows only) - read that file only
  then. Always writes .tmp\\regression_timing.tsv (seconds per seed, for the G2 parallel decision).
READ-ONLY on the repo: writes only under .tmp\\. Nothing in app, lib, hooks, seeds or expected files is touched.

BEFORE YOU RUN (conventions rule 14: never build while dev runs):
  1. Stop npm run dev.  2. npm run build   3. generate the seeds into public\\__stress_tmp BEFORE the build if they are stale
  4. npm run start -- -p 3005   (leave it running in its own window)   5. then, in another window:
  python Py\\stress_test\\headless_regression.py
ONE-TIME SETUP (outside the repo, no package.json change; Edge is already on Windows so no browser download):
  pip install playwright

USAGE: python Py\\stress_test\\headless_regression.py [--port 3005] [--seeds a,b] [--parallel N] [--channel msedge]
  --seeds     comma list of seed ids (default: every seed_*.json in public\\__stress_tmp that has an expected file)
  --parallel  seeds at once (default 1 = serial, so the first timing numbers are clean; each seed has its own context)
  --channel   msedge (default) | chrome | chromium (chromium needs: python -m playwright install chromium)
ASSUMPTIONS (same as pane_runner.console.js, which was live-proven): every seed value is written as JSON.stringify(value);
  asset interest is dated to the day the page runs, so seeds must be generated with --as-of = today (NZ date).
"""
import argparse
import glob
import json
import os
import socket
import subprocess
import sys
import tempfile
import time
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
SEED_DIR = os.path.join(ROOT, "public", "__stress_tmp")
OUT_DIR = os.path.join(ROOT, ".tmp")
COMPARE = os.path.join(HERE, "compare_full.py")
BLANK = "/__headless_blank"
MAX_ROWS = 40


def list_seeds(only):
    ids = []
    for p in sorted(glob.glob(os.path.join(SEED_DIR, "seed_*.json"))):
        sid = os.path.basename(p)[len("seed_"):-len(".json")]
        if os.path.exists(os.path.join(SEED_DIR, f"expected_{sid}_layer2.json")):
            ids.append(sid)
    return [s for s in ids if not only or s in only]


def port_open(port):
    s = socket.socket()
    s.settimeout(1.5)
    try:
        s.connect(("127.0.0.1", port))
        return True
    except OSError:
        return False
    finally:
        s.close()


def grab_snapshot(page, need_ids, save_path):
    """Click 'Download trace JSON' and read the file. Retry until every expected node id is present (page may still be computing)."""
    page.wait_for_selector("button:has-text('Download trace JSON')", timeout=180000)
    last = "no download"
    for attempt in range(8):
        page.wait_for_timeout(1500 if attempt else 2500)
        with page.expect_download(timeout=60000) as dl:
            page.locator("button", has_text="Download trace JSON").first.click()
        dl.value.save_as(save_path)
        snap = json.load(open(save_path, encoding="utf-8"))
        have = {n["node_id"] for n in snap.get("nodes", [])}
        missing = need_ids - have
        if not missing:
            return True, ""
        last = f"{len(missing)} expected nodes not in the trace yet"
    return False, last


def run_seed(sid, args):
    from playwright.sync_api import sync_playwright
    t0 = time.time()
    seed = json.load(open(os.path.join(SEED_DIR, f"seed_{sid}.json"), encoding="utf-8"))
    exp_path = os.path.join(SEED_DIR, f"expected_{sid}_layer2.json")
    need = set(json.load(open(exp_path, encoding="utf-8"))["nodes"].keys())
    base = f"http://localhost:{args.port}"
    tmp = tempfile.mkdtemp(prefix="mirra_reg_")
    snap_path = os.path.join(tmp, f"snapshot_{sid}.json")
    res = {"seed": sid, "ok": False, "line": "", "detail": "", "secs": 0.0}
    try:
        with sync_playwright() as pw:
            kw = {} if args.channel == "chromium" else {"channel": args.channel}
            browser = pw.chromium.launch(headless=True, **kw)
            ctx = browser.new_context(accept_downloads=True)
            page = ctx.new_page()
            page.route(base + BLANK, lambda r: r.fulfill(status=200, content_type="text/html", body="<html><body>blank</body></html>"))
            page.goto(base + BLANK)
            entries = [[k, json.dumps(v, separators=(",", ":"))] for k, v in seed["keys"].items()]
            page.evaluate("es => { localStorage.clear(); for (const [k, v] of es) localStorage.setItem(k, v); }", entries)
            t_seed = time.time()
            page.goto(base + "/calculation-trace", wait_until="load", timeout=180000)
            ok, why = grab_snapshot(page, need, snap_path)
            browser.close()
        res["t_load"] = round(time.time() - t_seed, 1)
        if not ok:
            res["line"] = f"FAIL {sid}: no complete trace ({why})"
            res["detail"] = res["line"]
        else:
            p = subprocess.run([sys.executable, COMPARE, "--summary", exp_path, snap_path], capture_output=True, text=True)
            out = p.stdout.strip().splitlines()
            res["line"] = out[0] if out else f"FAIL {sid}: compare printed nothing {p.stderr.strip()[:200]}"
            res["ok"] = p.returncode == 0
            if not res["ok"]:
                res["detail"] = "\n".join(out[:MAX_ROWS + 3]) + (f"\n  ... {len(out) - MAX_ROWS - 3} more rows" if len(out) > MAX_ROWS + 3 else "")
    except Exception as e:  # keep one bad seed from hiding the others
        res["line"] = f"FAIL {sid}: runner error {type(e).__name__}: {str(e)[:160]}"
        res["detail"] = res["line"]
    res["secs"] = round(time.time() - t0, 1)
    return res


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=3005)
    ap.add_argument("--seeds", default="")
    ap.add_argument("--parallel", type=int, default=1)
    ap.add_argument("--channel", default="msedge")
    args = ap.parse_args()
    try:
        import playwright  # noqa: F401
    except ImportError:
        print("STOP: playwright is not installed. One time: pip install playwright   (Edge is used, no browser download)")
        return 2
    if not port_open(args.port):
        print(f"STOP: nothing is listening on :{args.port}. Stop dev, npm run build, then npm run start -- -p {args.port}")
        return 2
    ids = list_seeds([s for s in args.seeds.split(",") if s])
    if not ids:
        print(f"STOP: no seed_*.json with an expected file in {SEED_DIR}")
        return 2
    t_all = time.time()
    with ThreadPoolExecutor(max_workers=max(1, args.parallel)) as ex:
        results = list(ex.map(lambda s: run_seed(s, args), ids))
    total = round(time.time() - t_all)
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(os.path.join(OUT_DIR, "regression_timing.tsv"), "w", encoding="utf-8") as f:
        f.write("seed\tsecs_total\tsecs_load_and_trace\tresult\n")
        for r in results:
            f.write(f'{r["seed"]}\t{r["secs"]}\t{r.get("t_load", "")}\t{"PASS" if r["ok"] else "FAIL"}\n')
    bad = [r for r in results if not r["ok"]]
    slow = max(results, key=lambda r: r["secs"])
    fail_path = os.path.join(OUT_DIR, "regression_failures.txt")
    if bad:
        with open(fail_path, "w", encoding="utf-8") as f:
            for r in bad:
                f.write(r["detail"] + "\n\n")
        line = f'FAIL {len(bad)} of {len(results)} seeds ({", ".join(r["seed"] for r in bad)}); details in .tmp\\regression_failures.txt; {total} s'
    else:
        if os.path.exists(fail_path):
            os.remove(fail_path)
        done = [r["line"].split(": ", 1)[1] for r in results]
        checks = sum(int(d.split(" of ")[1].split(" ")[0]) for d in done)
        line = f'PASS {len(results)} of {len(results)} seeds, {checks:,} checks, {total} s (slowest {slow["seed"]} {slow["secs"]} s)'
    print(line)
    if sys.platform == "win32":
        try:
            subprocess.run("clip", input=line, text=True, shell=True, timeout=5)
        except Exception:
            pass
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
