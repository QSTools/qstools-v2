# v6_1_archive_phase2.ps1
#
# WHAT: Phase 2 of the V6.1 docs reorganisation. Sorts every file in
#       docs\fin_mirra_v6.0 Briefs\ into one of three places:
#         Archive      -> docs\Archive\fin_mirra_v6.0 Briefs\   (module briefs now collated + superseded sources)
#         Future_Build -> docs\fin_mirra_v6.1\Future_Build\     (briefs for work not yet built)
#         Calculations -> docs\fin_mirra_v6.1\Calculations\     (mechanism / tracker docs, not briefs)
#       Files in neither list are HELD and stay where they are.
# WHY:  The 12 V6.1 briefs replace the v6.0 module briefs. Rule: archive, never delete.
# SAFE: DRY RUN by default - changes nothing. Add -Apply to move. Refuses to start
#       if any listed source is missing or any destination file already exists.
#       After moving it re-counts and prints PASS/FAIL per file.
# HELD (not moved, on purpose):
#       AI_STRATEGY_CUBAN / AI_WORKFLOW_POCOCK  - owner decision (reference vs archive)
#       CALCULATION_TRACE_VERIFICATION_LAYER    - supporting brief not written yet
#       R2_HANDOVER                             - archive after the V6.1 handover replaces it
#       V6_0_KICKOFF_AND_HANDOVER               - archive after PROJECT_MAP replaces it
#
# Run from the repo root (D:\QSTools\qstools-web):
#   .\scripts\v6_1_reorg\v6_1_archive_phase2.ps1          <- dry run
#   .\scripts\v6_1_reorg\v6_1_archive_phase2.ps1 -Apply   <- real move
# Output goes to the clipboard - paste it straight back.

param([switch]$Apply)

& {
    $root = (Get-Location).Path
    if (-not (Test-Path (Join-Path $root "package.json"))) {
        Write-Host "STOP: run this from the repo root (D:\QSTools\qstools-web). Nothing was changed."
        return
    }
    $src  = Join-Path $root "docs\fin_mirra_v6.0 Briefs"
    $dest = @{
        Archive      = Join-Path $root "docs\Archive\fin_mirra_v6.0 Briefs"
        Future_Build = Join-Path $root "docs\fin_mirra_v6.1\Future_Build"
        Calculations = Join-Path $root "docs\fin_mirra_v6.1\Calculations"
    }

    $plan = [ordered]@{
        Future_Build = @(
            "AI_ASSISTED_SETUP_AND_RESULTS_EXPLAINER_FUTURE_BUILD_BRIEF_2026-10-01.txt",
            "BUSINESS_MODELLING_REDESIGN_SCRATCH_OVERLAY_FUTURE_BUILD_BRIEF_2026-10-16.txt",
            "DRY_HIRE_UNATTENDED_ASSETS_FUTURE_BUILD_BRIEF_2026-10-18.txt",
            "ESCT_TREATMENT_FIX_FUTURE_BUILD_BRIEF_2026-10-17.txt",
            "GO_TO_MARKET_XERO_LISTING_AND_UNIT_ECONOMICS_FUTURE_BUILD_BRIEF_2026-10-16.txt",
            "HOURS_BASED_BUSINESS_TYPES_TEST_AND_MARKET_COVERAGE_BRIEF_2026-10-18.txt",
            "LAUNCH_BUILD_ORDER_AND_THIRD_MOAT_FUTURE_BUILD_BRIEF_2026-10-14.txt",
            "POST_LAUNCH_VISION_AND_POSITIONING_FUTURE_BUILD_BRIEF_2026-10-16.txt",
            "REGRESSION_HEALTH_CHECK_SUITE_FUTURE_BUILD_BRIEF_2026-10-16.txt",
            "STRESS_TEST_DATABASE_AND_AGENT_DESIGN_FUTURE_BUILD_BRIEF_2026-10-16.txt",
            "UNITS_MODE_FUTURE_BUILD_BRIEF_2026-09-25.txt"
        )
        Calculations = @(
            "BUSINESS_OUTCOME_FILE_MAP_v6_0.txt",
            "VARIABLE_TRACKER_v6_0.txt"
        )
        Archive = @(
            "A11_RecoverySummary_v6_0_BRIEF_VERIFIED_2026-09-23.txt",
            "Assets_v6_0_BRIEF_VERIFIED_2026-09-23.txt",
            "BusinessModelling_v6_0_BRIEF_CONSOLIDATED_2026-09-24.txt",
            "BusinessOutcome_v6_0_BRIEF_VERIFIED_2026-09-23.txt",
            "Cost_Allocation_v6_0_BRIEF_VERIFIED_2026-09-23.txt",
            "IDLE_COST_BUSINESS_OUTCOME_DESIGN_BRIEF_2026-10-14.txt",
            "KICKOFF_UPDATE_LOG_ARCHIVE_2026-10-01.txt",
            "Labour_v6_0_BRIEF_VERIFIED_2026-09-21.txt",
            "P_AND_L_v6_0_BRIEF_VERIFIED_2026-09-21.txt",
            "PHASE_1_CROSS_IMPORT_VERIFIED_2026-09-20.txt",
            "RATE_BUILDER_ASSET_LEVEL_CALCULATORS_BRIEF_2026-10-04.txt",
            "RateBuilder_PathB_and_UnitsMode_v6_0_SCOPING_BRIEF_2026-09-24.txt",
            "RateBuilder_v6_0_BRIEF_VERIFIED_2026-09-23.txt",
            "RB1_OVERHEAD_BASIS_FIX_BRIEF_2026-10-01.txt",
            "SESSION_9_ADDENDUM_for_kickoff_doc_2026-09-27.txt",
            "SMOKE_TEST_v6_0_BRIEF_2026-09-26.txt",
            "Summaries_v6_0_BRIEF_VERIFIED_2026-09-23.txt",
            "TURBOPACK_NFT_WARNING_PNL_IMPORT_FIX_BRIEF_2026-10-17.txt"
        )
    }

    if ($Apply) { Write-Host "=== APPLY MODE: files WILL be moved ===" } else { Write-Host "=== DRY RUN: nothing will be changed ===" }

    # Preflight
    $ok = $true
    if (-not (Test-Path -LiteralPath $src)) { Write-Host "PREFLIGHT FAIL: source folder missing"; $ok = $false }
    $listed = @{}
    $moves = @()
    foreach ($k in $plan.Keys) {
        if (-not (Test-Path -LiteralPath $dest[$k])) {
            if ($k -eq "Archive" -and (Test-Path -LiteralPath (Split-Path $dest[$k]))) { Write-Host "NOTE: will create $($dest[$k])" }
            else { Write-Host "PREFLIGHT FAIL: destination folder missing: $($dest[$k])"; $ok = $false; continue }
        }
        foreach ($n in $plan[$k]) {
            $s = Join-Path $src $n
            $d = Join-Path $dest[$k] $n
            $listed[$n] = $true
            if (-not (Test-Path -LiteralPath $s)) { Write-Host "PREFLIGHT FAIL: source missing: $n"; $ok = $false; continue }
            if (Test-Path -LiteralPath $d) { Write-Host "PREFLIGHT FAIL: destination exists: $k\$n"; $ok = $false; continue }
            $moves += [pscustomobject]@{ Name = $n; Target = $k; From = $s; To = $d; Bytes = (Get-Item -LiteralPath $s).Length }
            Write-Host ("PREFLIGHT ok: {0,-13} <- {1}" -f $k, $n)
        }
    }
    # Anything in the folder not in a list = held
    $held = @(Get-ChildItem -LiteralPath $src -File -Force | Where-Object { -not $listed.ContainsKey($_.Name) })
    Write-Host "--- HELD (stay in fin_mirra_v6.0 Briefs):"
    $held | ForEach-Object { Write-Host ("  " + $_.Name) }

    # Informational: does anything outside docs\ hard-code the old folder name?
    Write-Host "--- References to 'fin_mirra_v6.0 Briefs' outside docs\ (info only):"
    $hits = @(Get-ChildItem -LiteralPath $root -Recurse -File -Force -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -notmatch '\\(node_modules|\.next|\.git|docs|v6_1_reorg)\\' -and $_.Extension -match '^\.(ps1|py|ts|tsx|js|json|md|txt|gitignore)$|^$' } |
        Select-String -Pattern 'fin_mirra_v6\.0 Briefs' -SimpleMatch -ErrorAction SilentlyContinue)
    if ($hits.Count -eq 0) { Write-Host "  none" } else { $hits | ForEach-Object { Write-Host ("  {0}:{1}" -f $_.Path.Replace($root + "\", ""), $_.LineNumber) } }

    if (-not $ok) { Write-Host "STOPPED at preflight - nothing was changed."; return }
    if (-not $Apply) {
        Write-Host ("DRY RUN OK: {0} files would move ({1} Archive, {2} Future_Build, {3} Calculations), {4} held. Re-run with -Apply." -f $moves.Count, $plan.Archive.Count, $plan.Future_Build.Count, $plan.Calculations.Count, $held.Count)
        return
    }

    if (-not (Test-Path -LiteralPath $dest.Archive)) { New-Item -ItemType Directory -Path $dest.Archive | Out-Null; Write-Host "CREATED: $($dest.Archive)" }
    foreach ($m in $moves) {
        try { Move-Item -LiteralPath $m.From -Destination $m.To -ErrorAction Stop; Write-Host "MOVED: $($m.Target)\$($m.Name)" }
        catch { Write-Host "MOVE FAILED: $($m.Name) - $($_.Exception.Message)"; Write-Host "STOPPED. Close editors open in docs\ and send me this output."; return }
    }

    $allPass = $true
    foreach ($m in $moves) {
        $arrived = Test-Path -LiteralPath $m.To
        $gone = -not (Test-Path -LiteralPath $m.From)
        $sizeOk = $arrived -and ((Get-Item -LiteralPath $m.To).Length -eq $m.Bytes)
        if ($arrived -and $gone -and $sizeOk) { Write-Host ("PASS: {0}\{1}" -f $m.Target, $m.Name) }
        else { Write-Host ("FAIL: {0}\{1} arrived={2} sourceGone={3} sizeMatch={4}" -f $m.Target, $m.Name, $arrived, $gone, $sizeOk); $allPass = $false }
    }
    Write-Host "--- fin_mirra_v6.0 Briefs now contains:"
    Get-ChildItem -LiteralPath $src -Force | ForEach-Object { Write-Host ("  " + $_.Name) }
    $st = @(git status --porcelain -- docs)
    Write-Host ("--- git: {0} changed paths under docs (moves show as delete + new until staged)" -f $st.Count)
    if ($allPass) { Write-Host "PHASE 2 COMPLETE - all checks passed. Do not commit yet; send me this output." }
    else { Write-Host "PHASE 2 HAD FAILURES - do not commit; send me this output." }
} *>&1 | Out-String -Width 250 | Set-Clipboard
Write-Host "Copied to clipboard" -ForegroundColor Green
