# v6_1_archive_phase4.ps1
#
# WHAT: Phase 4 of the V6.1 docs reorganisation (step 4c, part 2). Moves R2_HANDOVER and V6_0_KICKOFF_AND_HANDOVER
#       from docs\fin_mirra_v6.0 Briefs\ to docs\Archive\fin_mirra_v6.0 Briefs\.
# WHY:  PROJECT_MAP.md and the V6.1c handover now replace them. Rule: archive, never delete.
# SAFE: DRY RUN by default - changes nothing. Add -Apply to move. Refuses to start if PROJECT_MAP.md or the V6.1c
#       handover is missing, any source is missing, or any destination file already exists.
#       After moving it re-checks arrival, source gone and size, and prints PASS / FAIL per file.
# HELD (not touched): CALCULATION_TRACE brief, desktop.ini.
#
# Run from the repo root (D:\QSTools\qstools-web):
#   .\scripts\v6_1_reorg\v6_1_archive_phase4.ps1          <- dry run
#   .\scripts\v6_1_reorg\v6_1_archive_phase4.ps1 -Apply   <- real move
# Output goes to the clipboard - paste it straight back.

param([switch]$Apply)

& {
    $root = (Get-Location).Path
    if (-not (Test-Path (Join-Path $root "package.json"))) {
        Write-Host "STOP: run this from the repo root (D:\QSTools\qstools-web). Nothing was changed."
        return
    }
    $src  = Join-Path $root "docs\fin_mirra_v6.0 Briefs"
    $dest = Join-Path $root "docs\Archive\fin_mirra_v6.0 Briefs"
    $need = @(
        (Join-Path $root "docs\fin_mirra_v6.1\PROJECT_MAP.md"),
        (Join-Path $root "docs\fin_mirra_v6.1\Audit\V6.1\c\HANDOVER.txt")
    )
    $names = @(
        "R2_HANDOVER_2026-10-18.txt",
        "V6_0_KICKOFF_AND_HANDOVER_2026-09-20.txt"
    )

    if ($Apply) { Write-Host "=== APPLY MODE: files WILL be moved ===" } else { Write-Host "=== DRY RUN: nothing will be changed ===" }

    $ok = $true
    foreach ($f in $need) {
        if (-not (Test-Path -LiteralPath $f)) { Write-Host "PREFLIGHT FAIL: replacement doc missing: $f"; $ok = $false }
        else { Write-Host ("PREFLIGHT ok: replacement present: {0} ({1} bytes)" -f $f.Replace($root + "\", ""), (Get-Item -LiteralPath $f).Length) }
    }
    if (-not (Test-Path -LiteralPath $src))  { Write-Host "PREFLIGHT FAIL: source folder missing"; $ok = $false }
    if (-not (Test-Path -LiteralPath $dest)) { Write-Host "PREFLIGHT FAIL: archive folder missing: $dest"; $ok = $false }

    $moves = @()
    foreach ($n in $names) {
        $s = Join-Path $src $n
        $d = Join-Path $dest $n
        if (-not (Test-Path -LiteralPath $s)) { Write-Host "PREFLIGHT FAIL: source missing: $n"; $ok = $false; continue }
        if (Test-Path -LiteralPath $d)        { Write-Host "PREFLIGHT FAIL: destination exists: $n"; $ok = $false; continue }
        $moves += [pscustomobject]@{ Name = $n; From = $s; To = $d; Bytes = (Get-Item -LiteralPath $s).Length }
        Write-Host ("PREFLIGHT ok: Archive <- {0} ({1} bytes)" -f $n, (Get-Item -LiteralPath $s).Length)
    }

    if (Test-Path -LiteralPath $src) {
        Write-Host "--- Will remain in fin_mirra_v6.0 Briefs:"
        Get-ChildItem -LiteralPath $src -File -Force | Where-Object { $names -notcontains $_.Name } | ForEach-Object { Write-Host ("  " + $_.Name) }
    }

    if (-not $ok) { Write-Host "STOPPED at preflight - nothing was changed."; return }
    if (-not $Apply) { Write-Host ("DRY RUN OK: {0} files would move to Archive. Re-run with -Apply." -f $moves.Count); return }

    foreach ($m in $moves) {
        try { Move-Item -LiteralPath $m.From -Destination $m.To -ErrorAction Stop; Write-Host "MOVED: $($m.Name)" }
        catch { Write-Host "MOVE FAILED: $($m.Name) - $($_.Exception.Message)"; Write-Host "STOPPED. Close editors open in docs\ and send me this output."; return }
    }

    $allPass = $true
    foreach ($m in $moves) {
        $arrived = Test-Path -LiteralPath $m.To
        $gone    = -not (Test-Path -LiteralPath $m.From)
        $sizeOk  = $arrived -and ((Get-Item -LiteralPath $m.To).Length -eq $m.Bytes)
        if ($arrived -and $gone -and $sizeOk) { Write-Host ("PASS: {0}" -f $m.Name) }
        else { Write-Host ("FAIL: {0} arrived={1} sourceGone={2} sizeMatch={3}" -f $m.Name, $arrived, $gone, $sizeOk); $allPass = $false }
    }
    Write-Host "--- fin_mirra_v6.0 Briefs now contains:"
    Get-ChildItem -LiteralPath $src -Force | ForEach-Object { Write-Host ("  " + $_.Name) }
    if ($allPass) { Write-Host "PHASE 4 COMPLETE - all checks passed. Do not commit yet; send me this output." }
    else { Write-Host "PHASE 4 HAD FAILURES - do not commit; send me this output." }
} *>&1 | Out-String -Width 250 | Set-Clipboard
Write-Host "Copied to clipboard" -ForegroundColor Green
