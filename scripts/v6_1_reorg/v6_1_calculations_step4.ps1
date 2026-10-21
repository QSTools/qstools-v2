# v6_1_calculations_step4.ps1
#
# WHAT: Step 4 of the V6.1 docs reorganisation (the calculations step).
#       1. docs\Audit\v6_0\CALCULATION_MAP_v6_0.txt -> docs\fin_mirra_v6.1\Calculations\
#       2. docs\Audit\v6_0\calc_map\               -> docs\fin_mirra_v6.1\Calculations\calc_map\
#       3. everything else in docs\Audit\v6_0\     -> docs\fin_mirra_v6.1\Audit\v6_0\
#          (evidence: smoke_test, P2.x, P3, P4, A11, json dumps, cm1 dump)
#       4. Repoints every hard-coded path in the SAME run (all via Apply-Patch):
#          - Py\audit-scripts\extract_calc_map.py  (docstring + OUT line)
#          - Py\stress_test\README.txt             (5 command paths)
#          - .gitignore                            (calc_map + cm1 dump lines)
#       5. Re-runs extract_calc_map.py to prove the new paths work.
# WHY:  The calc map and its generator must keep working after the move.
# SAFE: DRY RUN by default - checks only, changes nothing. Add -Apply to run.
#       Refuses to start unless docs\ has no uncommitted changes (commit phase 2
#       first, so this step is its own commit) and all destinations are free.
#       Archive, never delete: nothing is deleted; docs\Audit is removed only if
#       it ends up empty.
# NOTE: Does not run npm build. Stop npm run dev anyway if it is running.
#
# Run from the repo root (D:\QSTools\qstools-web):
#   .\scripts\v6_1_reorg\v6_1_calculations_step4.ps1          <- dry run
#   .\scripts\v6_1_reorg\v6_1_calculations_step4.ps1 -Apply   <- real run
# Output goes to the clipboard - paste it straight back.

param([switch]$Apply)

& {
    $root = (Get-Location).Path
    if (-not (Test-Path (Join-Path $root "package.json"))) {
        Write-Host "STOP: run this from the repo root (D:\QSTools\qstools-web). Nothing was changed."
        return
    }
    $auditOld = Join-Path $root "docs\Audit\v6_0"
    $calcDir  = Join-Path $root "docs\fin_mirra_v6.1\Calculations"
    $auditNew = Join-Path $root "docs\fin_mirra_v6.1\Audit\v6_0"
    $mapSrc   = Join-Path $auditOld "CALCULATION_MAP_v6_0.txt"
    $mapDst   = Join-Path $calcDir  "CALCULATION_MAP_v6_0.txt"
    $cmSrc    = Join-Path $auditOld "calc_map"
    $cmDst    = Join-Path $calcDir  "calc_map"

    if ($Apply) { Write-Host "=== APPLY MODE: files WILL be moved and patched ===" } else { Write-Host "=== DRY RUN: nothing will be changed ===" }

    $ok = $true

    # 1. docs must be clean (phase 2 committed)
    $dirty = @(git status --porcelain -- docs)
    if ($dirty.Count -gt 0) {
        Write-Host ("PREFLIGHT FAIL: docs\ has {0} uncommitted changes - commit phase 2 first:" -f $dirty.Count)
        $dirty | Select-Object -First 5 | ForEach-Object { Write-Host ("  " + $_) }
        $ok = $false
    } else { Write-Host "PREFLIGHT ok: docs\ is clean (phase 2 committed)" }

    # 2. sources and destinations
    foreach ($p in @($auditOld, $mapSrc, $cmSrc)) {
        if (-not (Test-Path -LiteralPath $p)) { Write-Host "PREFLIGHT FAIL: source missing: $p"; $ok = $false }
    }
    foreach ($p in @($mapDst, $cmDst, $auditNew)) {
        if (Test-Path -LiteralPath $p) { Write-Host "PREFLIGHT FAIL: destination exists: $p"; $ok = $false }
    }
    foreach ($p in @($calcDir, (Split-Path $auditNew))) {
        if (-not (Test-Path -LiteralPath $p)) { Write-Host "PREFLIGHT FAIL: destination parent missing: $p"; $ok = $false }
    }

    # 3. file counts before
    $nAll  = @(Get-ChildItem -LiteralPath $auditOld -Recurse -File -Force -ErrorAction SilentlyContinue).Count
    $nCm   = @(Get-ChildItem -LiteralPath $cmSrc    -Recurse -File -Force -ErrorAction SilentlyContinue).Count
    $nRest = $nAll - $nCm - 1
    Write-Host ("PREFLIGHT counts: Audit\v6_0 = {0} files  (calc map 1, calc_map\ {1}, evidence {2})" -f $nAll, $nCm, $nRest)

    # 4. patches - must each be found exactly once
    . (Join-Path $root "Apply-Patch.ps1")
    $patches = @(
        @{ Path = "Py\audit-scripts\extract_calc_map.py"; OldText = 'docs\\Audit\\v6_0\\calc_map\\'; NewText = 'docs\\fin_mirra_v6.1\\Calculations\\calc_map\\' },
        @{ Path = "Py\audit-scripts\extract_calc_map.py"; OldText = '"docs", "Audit", "v6_0", "calc_map"'; NewText = '"docs", "fin_mirra_v6.1", "Calculations", "calc_map"' },
        @{ Path = "Py\stress_test\README.txt"; OldText = 'generate_business.py Py\stress_test\recipes\scenario_a.json --as-of 2026-10-17 --out "docs\Audit\v6_0'; NewText = 'generate_business.py Py\stress_test\recipes\scenario_a.json --as-of 2026-10-17 --out "docs\fin_mirra_v6.1\Audit\v6_0' },
        @{ Path = "Py\stress_test\README.txt"; OldText = 'run_layer2.py Py\stress_test\recipes\scenario_a.json --as-of 2026-10-17 --out "docs\Audit\v6_0'; NewText = 'run_layer2.py Py\stress_test\recipes\scenario_a.json --as-of 2026-10-17 --out "docs\fin_mirra_v6.1\Audit\v6_0' },
        @{ Path = "Py\stress_test\README.txt"; OldText = 'compare_full.py "docs\Audit\v6_0'; NewText = 'compare_full.py "docs\fin_mirra_v6.1\Audit\v6_0' },
        @{ Path = "Py\stress_test\README.txt"; OldText = 'layer2.json" "docs\Audit\v6_0'; NewText = 'layer2.json" "docs\fin_mirra_v6.1\Audit\v6_0' },
        @{ Path = "Py\stress_test\README.txt"; OldText = 'scenario_b.json --as-of <today> --out "docs\Audit\v6_0'; NewText = 'scenario_b.json --as-of <today> --out "docs\fin_mirra_v6.1\Audit\v6_0' },
        @{ Path = ".gitignore"; OldText = 'docs/Audit/v6_0/calc_map/'; NewText = 'docs/fin_mirra_v6.1/Calculations/calc_map/' },
        @{ Path = ".gitignore"; OldText = 'docs/Audit/v6_0/cm1_readonly_dump_*.txt'; NewText = 'docs/fin_mirra_v6.1/Audit/v6_0/cm1_readonly_dump_*.txt' }
    )
    if (-not (Test-PatchPreflight -Patches $patches)) { $ok = $false }

    if (-not $ok) { Write-Host "STOPPED at preflight - nothing was changed."; return }
    if (-not $Apply) {
        Write-Host ("DRY RUN OK: would move {0} files in 3 moves and apply {1} patches, then re-run extract_calc_map.py. Re-run with -Apply." -f $nAll, $patches.Count)
        return
    }

    # Moves (stop at first failure)
    try {
        Move-Item -LiteralPath $mapSrc -Destination $mapDst -ErrorAction Stop; Write-Host "MOVED: CALCULATION_MAP_v6_0.txt -> fin_mirra_v6.1\Calculations\"
        Move-Item -LiteralPath $cmSrc  -Destination $cmDst  -ErrorAction Stop; Write-Host "MOVED: calc_map\ -> fin_mirra_v6.1\Calculations\calc_map\"
        Move-Item -LiteralPath $auditOld -Destination $auditNew -ErrorAction Stop; Write-Host "MOVED: Audit\v6_0 (evidence) -> fin_mirra_v6.1\Audit\v6_0\"
    } catch {
        Write-Host "MOVE FAILED: $($_.Exception.Message)"
        Write-Host "STOPPED. Close editors / Explorer windows open in docs\ and send me this output. No patches were applied."
        return
    }

    $allPass = $true
    $c1 = Test-Path -LiteralPath $mapDst
    $c2 = @(Get-ChildItem -LiteralPath $cmDst    -Recurse -File -Force -ErrorAction SilentlyContinue).Count
    $c3 = @(Get-ChildItem -LiteralPath $auditNew -Recurse -File -Force -ErrorAction SilentlyContinue).Count
    if ($c1 -and $c2 -eq $nCm -and $c3 -eq $nRest -and -not (Test-Path -LiteralPath $auditOld)) {
        Write-Host ("PASS: moves - map present, calc_map {0}/{1}, evidence {2}/{3}, old folder gone" -f $c2, $nCm, $c3, $nRest)
    } else {
        Write-Host ("FAIL: moves - map={0} calc_map {1}/{2} evidence {3}/{4} oldGone={5}" -f $c1, $c2, $nCm, $c3, $nRest, (-not (Test-Path -LiteralPath $auditOld))); $allPass = $false
    }

    # docs\Audit: remove only if empty
    $auditParent = Join-Path $root "docs\Audit"
    if ((Test-Path -LiteralPath $auditParent) -and @(Get-ChildItem -LiteralPath $auditParent -Force).Count -eq 0) {
        Remove-Item -LiteralPath $auditParent; Write-Host "REMOVED empty folder: docs\Audit"
    } elseif (Test-Path -LiteralPath $auditParent) { Write-Host "NOTE: docs\Audit still has content - left alone" }

    # Patches
    if (-not (Invoke-PatchBatch -Patches $patches)) { $allPass = $false }

    # Prove the generator still works
    Write-Host "--- Re-running extract_calc_map.py"
    $py = & python Py\audit-scripts\extract_calc_map.py 2>&1
    $pyExit = $LASTEXITCODE
    $py | Select-Object -Last 8 | ForEach-Object { Write-Host ("  " + $_) }
    $nCmAfter = @(Get-ChildItem -LiteralPath $cmDst -Recurse -File -Force -ErrorAction SilentlyContinue).Count
    $reborn = Test-Path -LiteralPath (Join-Path $root "docs\Audit")
    if ($pyExit -eq 0 -and $nCmAfter -gt 0 -and -not $reborn) {
        Write-Host ("PASS: extract_calc_map.py exit 0, wrote {0} files to Calculations\calc_map, old docs\Audit not recreated" -f $nCmAfter)
    } else {
        Write-Host ("FAIL: extract_calc_map.py exit={0}, files in new calc_map={1}, docs\Audit recreated={2}" -f $pyExit, $nCmAfter, $reborn); $allPass = $false
    }

    Write-Host "--- git status summary:"
    $st = @(git status --porcelain)
    Write-Host ("  {0} changed paths (moves show as delete + new until staged)" -f $st.Count)

    if ($allPass) { Write-Host "STEP 4 COMPLETE - all checks passed. Do not commit yet; send me this output." }
    else { Write-Host "STEP 4 HAD FAILURES - do not commit; send me this output." }
} *>&1 | Out-String -Width 250 | Set-Clipboard
Write-Host "Copied to clipboard" -ForegroundColor Green
