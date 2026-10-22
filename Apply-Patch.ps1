# Apply-Patch.ps1 - dot-source at the top of every patch batch:   . .\Apply-Patch.ps1
#
# Functions:
#   Apply-Patch         original single patch (IndexOf/Substring, UTF-8 no BOM). Now also counts failures.
#   Invoke-PatchBatch   preflight every patch (exactly 1 match each, EOL-normalised), then apply all.
#                       Returns $true only if everything applied. Nothing is changed if preflight fails.
#   Test-PatchPreflight the preflight on its own.
#   Assert-Contains     post-patch check that a string is (or with -Not, is not) in a file.
#   Invoke-Build        runs npm run build; refuses if a dev server looks to be running (rule 14)
#                       or if any patch/assert failed earlier in this batch.
#   Reset-PatchState    zero the failure counter (Invoke-PatchBatch does this itself).
#
# Typical batch (wrap in & { } so return stops the lot):
#   & {
#     . .\Apply-Patch.ps1
#     $ok = Invoke-PatchBatch -Patches @(
#       @{ Path = "hooks\x.js"; OldText = @'
# old text
# '@; NewText = @'
# new text
# '@ }
#     )
#     if (-not $ok) { return }
#     Assert-Contains "hooks\x.js" "new text" | Out-Null
#     Invoke-Build | Out-Null
#   } *>&1 | Out-String -Width 250 | Set-Clipboard
#
# ASCII only on purpose: PowerShell 5.1 reads BOM-less files as ANSI.
# Do not set $ErrorActionPreference = "Stop" at the top level (see Working Conventions).

$global:PatchFailures = 0

function Reset-PatchState {
    $global:PatchFailures = 0
}

function Apply-Patch {
    param(
        [Parameter(Mandatory=$true)][string]$Path,
        [Parameter(Mandatory=$true)][string]$OldText,
        [Parameter(Mandatory=$true)][AllowEmptyString()][string]$NewText
    )
    if (-not (Test-Path $Path)) {
        Write-Host "NOT FOUND: $Path (file does not exist)"
        $global:PatchFailures++
        return
    }
    $bytes = [System.IO.File]::ReadAllBytes($Path)
    $content = [System.Text.Encoding]::UTF8.GetString($bytes)
    $firstIndex = $content.IndexOf($OldText)
    if ($firstIndex -lt 0) {
        Write-Host "NOT FOUND: $Path"
        $global:PatchFailures++
        return
    }
    $secondIndex = $content.IndexOf($OldText, $firstIndex + 1)
    if ($secondIndex -ge 0) {
        Write-Host "AMBIGUOUS: $Path"
        $global:PatchFailures++
        return
    }
    $newContent = $content.Substring(0, $firstIndex) + $NewText + $content.Substring($firstIndex + $OldText.Length)
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $newContent, $utf8NoBom)
    Write-Host "Patched: $Path"
}

function Read-PatchFile {
    param([Parameter(Mandatory=$true)][string]$Path)
    $bytes = [System.IO.File]::ReadAllBytes($Path)
    return [System.Text.Encoding]::UTF8.GetString($bytes)
}

# Rewrites every line ending in $Text to match the file's own style (CRLF if the file has any CRLF, else LF).
function ConvertTo-FileEol {
    param(
        [AllowEmptyString()][string]$Text,
        [Parameter(Mandatory=$true)][string]$FileContent
    )
    $eol = "`n"
    if ($FileContent.Contains("`r`n")) { $eol = "`r`n" }
    $lf = $Text -replace "`r`n", "`n"
    return ($lf -replace "`n", $eol)
}

# Counts occurrences the same way Apply-Patch finds them (overlaps counted).
function Get-OccurrenceCount {
    param(
        [Parameter(Mandatory=$true)][string]$Content,
        [string]$Text
    )
    if ([string]::IsNullOrEmpty($Text)) { return 0 }
    $count = 0
    $i = $Content.IndexOf($Text)
    while ($i -ge 0) {
        $count++
        $i = $Content.IndexOf($Text, $i + 1)
    }
    return $count
}

# $Patches is an array of hashtables: @{ Path = ...; OldText = ...; NewText = ... }
function Test-PatchPreflight {
    param([Parameter(Mandatory=$true)][object[]]$Patches)
    $ok = $true
    $n = 0
    foreach ($p in $Patches) {
        $n++
        if (-not (Test-Path $p.Path)) {
            Write-Host "PREFLIGHT $n NOT FOUND (no such file): $($p.Path)"
            $ok = $false
            continue
        }
        $content = Read-PatchFile -Path $p.Path
        $old = ConvertTo-FileEol -Text ([string]$p.OldText) -FileContent $content
        $c = Get-OccurrenceCount -Content $content -Text $old
        if ($c -eq 1) {
            Write-Host "PREFLIGHT $n ok (1 match): $($p.Path)"
        } else {
            Write-Host "PREFLIGHT $n BAD COUNT ($c found, need exactly 1): $($p.Path)"
            $ok = $false
        }
    }
    return $ok
}

function Invoke-PatchBatch {
    param([Parameter(Mandatory=$true)][object[]]$Patches)
    Reset-PatchState
    if (-not (Test-PatchPreflight -Patches $Patches)) {
        Write-Host "Preflight failed - nothing was changed."
        $global:PatchFailures++
        return $false
    }
    foreach ($p in $Patches) {
        $content = Read-PatchFile -Path $p.Path
        $old = ConvertTo-FileEol -Text ([string]$p.OldText) -FileContent $content
        $new = ConvertTo-FileEol -Text ([string]$p.NewText) -FileContent $content
        Apply-Patch -Path $p.Path -OldText $old -NewText $new
    }
    if ($global:PatchFailures -eq 0) {
        Write-Host "BATCH OK: $($Patches.Count) patch(es) applied."
        return $true
    }
    Write-Host "BATCH FAILED: $($global:PatchFailures) problem(s) - do NOT build or commit until resolved."
    return $false
}

function Assert-Contains {
    param(
        [Parameter(Mandatory=$true)][string]$Path,
        [Parameter(Mandatory=$true)][string]$Text,
        [switch]$Not
    )
    if (-not (Test-Path $Path)) {
        Write-Host "FAIL: file missing: $Path"
        $global:PatchFailures++
        return $false
    }
    $content = Read-PatchFile -Path $Path
    $needle = ConvertTo-FileEol -Text $Text -FileContent $content
    $found = $content.Contains($needle)
    $pass = ($found -and -not $Not) -or ((-not $found) -and $Not)
    $label = $Text
    if ($label.Length -gt 60) { $label = $label.Substring(0, 60) + "..." }
    $label = $label -replace "`r?`n", " | "
    if ($pass) {
        if ($Not) { Write-Host "PASS: absent in ${Path}: $label" } else { Write-Host "PASS: present in ${Path}: $label" }
        return $true
    }
    if ($Not) { Write-Host "FAIL: still present in ${Path}: $label" } else { Write-Host "FAIL: missing from ${Path}: $label" }
    $global:PatchFailures++
    return $false
}

function Invoke-Build {
    param([switch]$IgnoreDevCheck)
    if ($global:PatchFailures -gt 0) {
        Write-Host "BUILD SKIPPED: $($global:PatchFailures) patch/assert problem(s) earlier in this batch."
        return $false
    }
    if (-not $IgnoreDevCheck) {
        $devProcs = @(Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
            Where-Object { $_.CommandLine -match 'next[^\s"]*"?\s+dev(\s|$)' })
        $listening = @(Get-NetTCPConnection -State Listen -LocalPort 3000 -ErrorAction SilentlyContinue)
        if ($devProcs.Count -gt 0 -or $listening.Count -gt 0) {
            Write-Host "BUILD REFUSED: a dev server looks to be running (node 'next dev' or port 3000 in use)."
            Write-Host "Stop it (Ctrl+C) first - building under a running dev server corrupts .next. Use -IgnoreDevCheck to override."
            return $false
        }
    }
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "BUILD OK (exit 0). Before restarting dev: clear .next."
        return $true
    }
    Write-Host "BUILD FAILED (exit $LASTEXITCODE)."
    return $false
}
