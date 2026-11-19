$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$releaseDir = Join-Path $projectRoot 'desktop\release\windows'
$downloadsDir = Join-Path $projectRoot 'backend\downloads'
New-Item -ItemType Directory -Path $downloadsDir -Force | Out-Null
$manifests = @(Get-ChildItem -LiteralPath $releaseDir -Filter 'RS-KITS-*.exe.json' -File)
if ($manifests.Count -eq 0) { throw 'Nenhuma build compatível encontrada. Execute desktop\build_windows.bat primeiro.' }
foreach ($manifest in $manifests) {
    $executablePath = $manifest.FullName.Substring(0, $manifest.FullName.Length - 5)
    if (-not (Test-Path -LiteralPath $executablePath -PathType Leaf)) { throw "Executável ausente: $executablePath" }
    Copy-Item -LiteralPath $executablePath -Destination $downloadsDir -Force
    Copy-Item -LiteralPath $manifest.FullName -Destination $downloadsDir -Force
}
Write-Host "Builds publicadas em $downloadsDir"
