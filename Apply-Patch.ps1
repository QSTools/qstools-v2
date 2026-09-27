function Apply-Patch {
    param(
        [Parameter(Mandatory=$true)][string]$Path,
        [Parameter(Mandatory=$true)][string]$OldText,
        [Parameter(Mandatory=$true)][string]$NewText
    )
    if (-not (Test-Path $Path)) {
        Write-Host "NOT FOUND: $Path (file does not exist)"
        return
    }
    $bytes = [System.IO.File]::ReadAllBytes($Path)
    $content = [System.Text.Encoding]::UTF8.GetString($bytes)
    $firstIndex = $content.IndexOf($OldText)
    if ($firstIndex -lt 0) {
        Write-Host "NOT FOUND: $Path"
        return
    }
    $secondIndex = $content.IndexOf($OldText, $firstIndex + 1)
    if ($secondIndex -ge 0) {
        Write-Host "AMBIGUOUS: $Path"
        return
    }
    $newContent = $content.Substring(0, $firstIndex) + $NewText + $content.Substring($firstIndex + $OldText.Length)
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $newContent, $utf8NoBom)
    Write-Host "Patched: $Path"
}