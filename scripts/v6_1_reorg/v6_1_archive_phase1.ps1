# v6_1_archive_phase1.ps1
#
# WHAT: Phase 1 of the V6.1 docs reorganisation. Moves the legacy docs folders
#       (v5 briefs, v5 future briefs, the old "_Archive Folders", the May-Aug
#       Evidence packs and "generic cmd") into docs\Archive\, keeping each
#       folder's own name so anything old is still findable at the same
#       relative path, just one level down.
# WHY:  docs\ should end up holding only Archive\ and fin_mirra_v6.1\.
#       Rule: archive, never delete.
# SAFE: DRY RUN by default - lists what would move with file counts and
#       changes nothing. Add -Apply to actually move. Refuses to start if any
#       destination already exists. After moving it re-counts every folder and
#       prints PASS/FAIL so no file can go missing silently.
# ALSO: "docs/generic cmd/" is git-ignored; the ignore line is repointed to the
#       new path so that folder stays out of git after the move.
# NOT IN THIS PHASE (each needs other work first):
#       - fin_mirra_v6.0 Briefs  -> archived after the briefs are collated
#       - Audit\v6_0             -> extract_calc_map.py, the stress-test README
#                                   and .gitignore all point at it; moved
#                                   together with those path fixes in step 4
#       - Excel Imports          -> holds the live stress-test template
#
# Run from the repo root (D:\QSTools\qstools-web):
#   .\scripts\v6_1_reorg\v6_1_archive_phase1.ps1          <- dry run
#   .\scripts\v6_1_reorg\v6_1_archive_phase1.ps1 -Apply   <- real move
# Output goes to the clipboard - paste it straight back.

param([switch]$Apply)

& {
    $root = (Get-Location).Path
    if (-not (Test-Path (Join-Path $root "package.json"))) {
        Write-Host "STOP: run this from the repo root (D:\QSTools\qstools-web). Nothing was changed."
        return
    }
    $docs = Join-Path $root "docs"
    $arch = Join-Path $docs "Archive"

    # Folders under docs\ that move, unchanged, into docs\Archive\
    $folders = @("_Archive Folders", "Mirra_v5_Briefs", "Mirra_v5_Future Briefs", "Evidence", "generic cmd")

    if ($Apply) { Write-Host "=== APPLY MODE: folders WILL be moved ===" } else { Write-Host "=== DRY RUN: nothing will be changed ===" }

    # Preflight: every source must exist, no destination may exist yet.
    $ok = $true
    $before = @{}
    foreach ($f in $folders) {
        $src = Join-Path $docs $f
        $dst = Join-Path $arch $f
        if (-not (Test-Path -LiteralPath $src)) { Write-Host "PREFLIGHT FAIL: source missing: docs\$f"; $ok = $false; continue }
        if (Test-Path -LiteralPath $dst) { Write-Host "PREFLIGHT FAIL: destination already exists: docs\Archive\$f"; $ok = $false; continue }
        $n = @(Get-ChildItem -LiteralPath $src -Recurse -File -Force -ErrorAction SilentlyContinue).Count
        $before[$f] = $n
        Write-Host ("PREFLIGHT ok: docs\{0}  ->  docs\Archive\{0}   ({1} files)" -f $f, $n)
    }
    if (-not (Test-Path -LiteralPath $arch)) { Write-Host "PREFLIGHT FAIL: docs\Archive does not exist"; $ok = $false }

    # .gitignore line for generic cmd must be found exactly once.
    . (Join-Path $root "Apply-Patch.ps1")
    $gi = @(@{ Path = ".gitignore"; OldText = "docs/generic cmd/"; NewText = "docs/Archive/generic cmd/" })
    if (-not (Test-PatchPreflight -Patches $gi)) { $ok = $false }

    if (-not $ok) { Write-Host "STOPPED at preflight - nothing was changed."; return }
    if (-not $Apply) {
        Write-Host ("DRY RUN OK: {0} folders, {1} files would move. Re-run with -Apply." -f $folders.Count, ($before.Values | Measure-Object -Sum).Sum)
        return
    }

    # Move each folder; stop at the first failure so we never half-move silently.
    foreach ($f in $folders) {
        $src = Join-Path $docs $f
        $dst = Join-Path $arch $f
        try {
            Move-Item -LiteralPath $src -Destination $dst -ErrorAction Stop
            Write-Host "MOVED: docs\$f"
        } catch {
            Write-Host "MOVE FAILED: docs\$f - $($_.Exception.Message)"
            Write-Host "STOPPED. Close any Explorer window or editor open in docs\ and send me this output."
            return
        }
    }

    # Verify: every file arrived, nothing left behind.
    $allPass = $true
    foreach ($f in $folders) {
        $n = @(Get-ChildItem -LiteralPath (Join-Path $arch $f) -Recurse -File -Force -ErrorAction SilentlyContinue).Count
        $gone = -not (Test-Path -LiteralPath (Join-Path $docs $f))
        if ($n -eq $before[$f] -and $gone) { Write-Host ("PASS: Archive\{0}  {1}/{2} files, source gone" -f $f, $n, $before[$f]) }
        else { Write-Host ("FAIL: Archive\{0}  {1}/{2} files, source gone={3}" -f $f, $n, $before[$f], $gone); $allPass = $false }
    }

    if (-not (Invoke-PatchBatch -Patches $gi)) { $allPass = $false }

    Write-Host "--- docs\ now contains:"
    Get-ChildItem -LiteralPath $docs -Force | ForEach-Object { Write-Host ("  " + $_.Name) }
    Write-Host "--- git status (docs + .gitignore), summary:"
    $st = @(git status --porcelain -- docs .gitignore)
    Write-Host ("  {0} changed paths (moves show as delete + new until staged)" -f $st.Count)

    if ($allPass) { Write-Host "PHASE 1 COMPLETE - all checks passed. Do not commit yet; send me this output." }
    else { Write-Host "PHASE 1 HAD FAILURES - do not commit; send me this output." }
} *>&1 | Out-String -Width 250 | Set-Clipboard
Write-Host "Copied to clipboard" -ForegroundColor Green
