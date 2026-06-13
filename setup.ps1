$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

function Test-Command($Name) {
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

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

if (-not (Test-Command "node")) {
  Write-Error "Node.js 18 or newer is required. Install it from https://nodejs.org, then run this script again."
}

$npm = Get-NpmCommand
if (-not $npm) {
  Write-Error "npm was not found. Reinstall Node.js from https://nodejs.org."
}

$nodeMajor = [int](& node -p "process.versions.node.split('.')[0]")
if ($nodeMajor -lt 18) {
  Write-Error "Node.js 18 or newer is required. Found: $(& node -v)"
}

Write-Host "Installing project dependencies..."
if (Test-Path "package-lock.json") {
  & $npm ci
} else {
  & $npm install
}

Write-Host ""
Write-Host "Setup complete. Start the app with:"
Write-Host "  npm run dev"
