param([switch]$NoWatch)

$ErrorActionPreference = "Stop"
$nekstPath = "C:\Users\User\AppData\Roaming\npm\nest.cmd"
$nodePath = "C:\Program Files\nodejs\node.exe"
$backendDir = "C:\RS-KITS\backend"

Write-Host "Iniciando backend RS KITS..."
Write-Host "Diretório: $backendDir"

if (-not (Test-Path $nekstPath)) {
    Write-Error "nest.cmd não encontrado em $nekstPath"
    return
}

if (-not (Test-Path $nodePath)) {
    Write-Error "node.exe não encontrado em $nodePath"
    return
}

Write-Host "Executando: $nodePath $nekstPath start --watch"

& $nodePath $nekstPath start --watch