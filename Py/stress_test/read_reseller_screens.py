"""
read_reseller_screens.py - V6.1ch piece 0: load the reseller seed into a FRESH headless browser on the production server
(default :3005) and save what each screen says as plain text, plus the calculation trace JSON. No pane, no tokens.
READ-ONLY on the repo: writes only under --out (default .tmp\\reseller_piece0\\screens).

  python Py\\stress_test\\read_reseller_screens.py [--port 3005] [--seed .tmp\\reseller_piece0\\seed_reseller_piece0.json]

Same seed-writing method as headless_regression.py (every value JSON.stringify'd into localStorage on the server's origin,
a fresh context so your Chrome and the pane are untouched). Needs the production server already running (npm run start -- -p 3005).
"""
import argparse, json, os, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
BLANK = "/__headless_blank"
ROUTES = ["p-and-l", "revenue-cogs", "opening-hours", "labour", "assets", "general-overheads", "cost-allocation",
          "cost-summary", "business-summary", "recovery-summary", "business-outcome", "rate-builder",
          "module-reconciliation", "model-readiness"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=3005)
    ap.add_argument("--seed", default=os.path.join(ROOT, ".tmp", "reseller_piece0", "seed_reseller_piece0.json"))
    ap.add_argument("--out", default=os.path.join(ROOT, ".tmp", "reseller_piece0", "screens"))
    ap.add_argument("--channel", default="msedge")
    ap.add_argument("--settle", type=float, default=3.0, help="seconds to let each page finish calculating")
    a = ap.parse_args()
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("STOP: pip install playwright (one time)"); return 2
    seed = json.load(open(a.seed, encoding="utf-8"))
    os.makedirs(a.out, exist_ok=True)
    base = f"http://localhost:{a.port}"
    entries = [[k, json.dumps(v, separators=(",", ":"))] for k, v in seed["keys"].items()]
    t0, done, failed = time.time(), [], []
    with sync_playwright() as pw:
        kw = {} if a.channel == "chromium" else {"channel": a.channel}
        br = pw.chromium.launch(headless=True, **kw)
        ctx = br.new_context(accept_downloads=True, viewport={"width": 1600, "height": 1200})
        page = ctx.new_page()
        page.route(base + BLANK, lambda r: r.fulfill(status=200, content_type="text/html", body="<html><body>blank</body></html>"))
        page.goto(base + BLANK)
        page.evaluate("es => { localStorage.clear(); for (const [k, v] of es) localStorage.setItem(k, v); }", entries)
        for r in ROUTES:
            try:
                page.goto(f"{base}/{r}", wait_until="load", timeout=120000)
                page.wait_for_timeout(int(a.settle * 1000))
                txt = page.inner_text("body")
                open(os.path.join(a.out, f"{r}.txt"), "w", encoding="utf-8").write(txt)
                done.append(r)
            except Exception as e:
                failed.append(f"{r}: {type(e).__name__}")
        try:
            page.goto(f"{base}/calculation-trace", wait_until="load", timeout=180000)
            page.wait_for_selector("button:has-text('Download trace JSON')", timeout=120000)
            page.wait_for_timeout(3000)
            with page.expect_download(timeout=60000) as dl:
                page.locator("button", has_text="Download trace JSON").first.click()
            dl.value.save_as(os.path.join(a.out, "trace.json"))
            done.append("trace.json")
        except Exception as e:
            failed.append(f"trace: {type(e).__name__}")
        br.close()
    line = f"READ {len(done)} screens saved to {a.out}" + (f"; FAILED {', '.join(failed)}" if failed else "") + f"; {round(time.time() - t0)} s"
    print(line)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
