function New-SmokeStep {
    param(
        [Parameter(Mandatory=$true)][string]$Version,
        [Parameter(Mandatory=$true)][string]$Slug,
        [string]$Description = ""
    )
    $root = "D:\QSTools\qstools-web\docs\Audit\v6_0\smoke_test"
    $folderName = "{0}_{1}" -f $Version, $Slug
    $stepPath = Join-Path $root $folderName
    New-Item -ItemType Directory -Force -Path $stepPath | Out-Null

    $downloads = [Environment]::GetFolderPath("UserProfile") + "\Downloads"
    $moved = @()
    Get-ChildItem -Path $downloads -Filter "*smoke_test*.txt" -ErrorAction SilentlyContinue | ForEach-Object {
        $dest = Join-Path $stepPath $_.Name
        Move-Item -Path $_.FullName -Destination $dest -Force
        $moved += $_.Name
    }

    $filesStr = "NONE FOUND"
    if ($moved.Count -gt 0) {
        $filesStr = $moved -join ", "
    }

    $indexPath = Join-Path $root "INDEX.txt"
    $line = "{0}  |  step {1}_{2}  |  {3}  |  files: {4}" -f `
        (Get-Date -Format "yyyy-MM-dd HH:mm"), $Version, $Slug, $Description, $filesStr
    Add-Content -Path $indexPath -Value $line -Encoding UTF8

    Write-Host "Step folder: $stepPath"
    if ($moved.Count -gt 0) {
        Write-Host "Moved files:"
        $moved | ForEach-Object { Write-Host "  - $_" }
    } else {
        Write-Host "WARNING: no smoke_test files found in Downloads. Did you run the browser download script first?"
    }
}