# b2_swap_storage_calls.ps1
# WHAT: R3 slice 1 batch 2. In lib\storage, replaces window.localStorage.getItem( / setItem( / removeItem( with
#   model_storage.<same>( and adds one import line for ./modelStorage.js. Skips schedulingStorage.ts, modelStorage*.js
#   and any file that already mentions model_storage.
# SAFETY: DRY RUN by default (reports only). -Live writes, after copying lib\storage to .tmp\b2_backup\lib_storage
#   (refuses if that folder exists). It writes nothing unless the site counts match the expected totals
#   (29 files; 31 get, 35 set, 4 remove).
# RUN: from D:\QSTools\qstools-web:   .\Py\model_storage_tests\b2_swap_storage_calls.ps1        (dry run)
#                                     .\Py\model_storage_tests\b2_swap_storage_calls.ps1 -Live  (writes)
# OUTPUT: Write-Host lines (the caller captures them to the clipboard). Returns $true only if every check passed.
# LIMITS: plain text replace, not a JS parser. Truthiness guards such as Boolean(window.localStorage) are left alone on
#   purpose. Keeps each file's own line endings and BOM. ASCII only (PowerShell 5.1).
param([switch]$Live)

$root = (Get-Location).Path
$dir = Join-Path $root 'lib\storage'
if (-not (Test-Path (Join-Path $dir 'modelStorage.js'))) { Write-Host 'STOP: run from the repo root (lib\storage\modelStorage.js not found).'; return $false }
$import = 'import { model_storage } from "./modelStorage.js";'
$utf8 = New-Object System.Text.UTF8Encoding($false)
$bomch = [string][char]0xFEFF
$plan = @()
$tg = 0; $ts = 0; $tr = 0

$files = Get-ChildItem $dir -File | Where-Object { ($_.Extension -eq '.js' -or $_.Extension -eq '.ts') -and $_.Name -notlike 'modelStorage*' -and $_.Name -ne 'schedulingStorage.ts' } | Sort-Object Name
foreach ($f in $files) {
  $bytes = [System.IO.File]::ReadAllBytes($f.FullName)
  $had_bom = ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF)
  $text = [System.Text.Encoding]::UTF8.GetString($bytes)
  $g = [regex]::Matches($text, 'window\.localStorage\.getItem\(').Count
  $s = [regex]::Matches($text, 'window\.localStorage\.setItem\(').Count
  $r = [regex]::Matches($text, 'window\.localStorage\.removeItem\(').Count
  if ($text.Contains('model_storage')) { Write-Host ("SKIP (already swapped): " + $f.Name); continue }
  if (($g + $s + $r) -eq 0) { continue }
  $bom = ''
  $body = $text
  if ($body.Length -gt 0 -and $body.Substring(0, 1) -eq $bomch) { $bom = $bomch; $body = $body.Substring(1) }
  $eol = "`n"
  if ($body.Contains("`r`n")) { $eol = "`r`n" }
  $body = $body.Replace('window.localStorage.getItem(', 'model_storage.getItem(')
  $body = $body.Replace('window.localStorage.setItem(', 'model_storage.setItem(')
  $body = $body.Replace('window.localStorage.removeItem(', 'model_storage.removeItem(')
  $m = [regex]::Match($body, '^"use (client|server)";[ \t]*\r?\n')
  if ($m.Success) { $body = $body.Substring(0, $m.Length) + $import + $eol + $body.Substring($m.Length); $where = 'after directive' }
  elseif ($body.StartsWith('import ')) { $body = $import + $eol + $body; $where = 'top, before imports' }
  else { $body = $import + $eol + $eol + $body; $where = 'top' }
  $eolname = 'LF'; if ($eol -eq "`r`n") { $eolname = 'CRLF' }
  $bomname = 'no'; if ($had_bom) { $bomname = 'yes' }
  $plan += [pscustomobject]@{ Name = $f.Name; Full = $f.FullName; G = $g; S = $s; R = $r; NewText = ($bom + $body); HadBom = $had_bom }
  $tg += $g; $ts += $s; $tr += $r
  Write-Host ("{0,-48} get {1} set {2} rm {3}  import {4}  eol {5}  bom {6}" -f $f.Name, $g, $s, $r, $where, $eolname, $bomname)
}
Write-Host ("TOTAL files {0}  get {1}  set {2}  remove {3}  = {4} sites" -f $plan.Count, $tg, $ts, $tr, ($tg + $ts + $tr))
$counts_ok = ($plan.Count -eq 29 -and $tg -eq 31 -and $ts -eq 35 -and $tr -eq 4)
if ($counts_ok) { Write-Host 'counts match (29 files, 31 / 35 / 4)' } else { Write-Host 'COUNTS DO NOT MATCH the expected 29 files, 31 get, 35 set, 4 remove. Nothing written.' }
if (-not $Live) { Write-Host 'DRY RUN: nothing written.'; return $counts_ok }
if (-not $counts_ok) { return $false }

$bk = Join-Path $root '.tmp\b2_backup\lib_storage'
if (Test-Path $bk) { Write-Host ('STOP: backup folder already exists: ' + $bk); return $false }
New-Item -ItemType Directory -Path $bk -Force | Out-Null
Copy-Item -Path (Join-Path $dir '*') -Destination $bk -Recurse -Force
Write-Host ('Backup copied to ' + $bk)

foreach ($p in $plan) { [System.IO.File]::WriteAllText($p.Full, $p.NewText, $utf8) }
Write-Host ('Wrote ' + $plan.Count + ' files.')

$all_ok = $true
foreach ($p in $plan) {
  $bytes = [System.IO.File]::ReadAllBytes($p.Full)
  $bom_now = ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF)
  $t = [System.Text.Encoding]::UTF8.GetString($bytes)
  $c_imp = [regex]::Matches($t, [regex]::Escape($import)).Count
  $direct = [regex]::Matches($t, 'window\.localStorage\.(getItem|setItem|removeItem)\(').Count
  $g2 = [regex]::Matches($t, 'model_storage\.getItem\(').Count
  $s2 = [regex]::Matches($t, 'model_storage\.setItem\(').Count
  $r2 = [regex]::Matches($t, 'model_storage\.removeItem\(').Count
  $ok = ($c_imp -eq 1 -and $direct -eq 0 -and $g2 -eq $p.G -and $s2 -eq $p.S -and $r2 -eq $p.R -and $bom_now -eq $p.HadBom)
  if (-not $ok) { $all_ok = $false; Write-Host ('VERIFY FAIL: ' + $p.Name + " import=$c_imp direct=$direct get=$g2/$($p.G) set=$s2/$($p.S) rm=$r2/$($p.R) bom=$bom_now") }
}
if ($all_ok) { Write-Host ('VERIFY OK: all ' + $plan.Count + ' files (import once, no direct calls, counts equal, BOM kept)') }
Write-Host '--- window.localStorage still present (expect only the 4 truthiness guards) ---'
Get-ChildItem $dir -File | Where-Object { $_.Name -notlike 'modelStorage*' -and $_.Name -ne 'schedulingStorage.ts' } | Select-String -Pattern 'window\.localStorage' | ForEach-Object { Write-Host ($_.Filename + ':' + $_.LineNumber + ': ' + $_.Line.Trim()) }
if (-not $all_ok) { Write-Host ('RESTORE with: Copy-Item ' + $bk + '\* ' + $dir + ' -Recurse -Force') }
return $all_ok