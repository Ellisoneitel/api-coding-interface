param(
  [switch]$Clean
)

$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

function Get-NpmCommand {
  $npmCmd = Get-Command "npm.cmd" -ErrorAction SilentlyContinue
  if ($npmCmd) {
    return $npmCmd.Source
  }

  $npm = Get-Command "npm" -ErrorAction SilentlyContinue
  if ($npm) {
    return $npm.Source
  }

  return $null
}

if ($Clean) {
  Write-Host "Removing installed dependencies and build output..."
  @(
    "node_modules",
    "client\node_modules",
    "server\node_modules",
    "dist",
    "client\dist"
  ) | ForEach-Object {
    if (Test-Path $_) {
      Remove-Item -LiteralPath $_ -Recurse -Force
    }
  }
}

if (-not (Test-Path "node_modules")) {
  & "$PSScriptRoot\setup.ps1"
}

$npm = Get-NpmCommand
if (-not $npm) {
  Write-Error "npm was not found. Reinstall Node.js from https://nodejs.org."
}

Write-Host "Starting the development server..."
& $npm run dev
