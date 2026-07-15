[CmdletBinding()]
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$CommandArgs,
    [switch]$WhatIf
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Fail([string]$Message, [int]$Code = 1) {
    Write-Error $Message
    exit $Code
}

if ($PSVersionTable.PSVersion.Major -lt 7) {
    Fail 'PowerShell 7 or later is required.' 2
}

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptRoot '..')
$cliEntry = Join-Path $repoRoot 'apps/executive-desk/cli/index.ts'
$tsConfig = Join-Path $repoRoot 'apps/executive-desk/tsconfig.cli.json'

if (-not (Test-Path $cliEntry)) {
    Fail "Missing CLI entrypoint: $cliEntry" 3
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Fail 'Node.js is required but was not found on PATH.' 4
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Fail 'npm is required but was not found on PATH.' 5
}

$usePnpm = $false
if ((Test-Path (Join-Path $repoRoot 'pnpm-lock.yaml')) -and (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    $usePnpm = $true
}

$argsToForward = @()
if ($WhatIf) {
    $argsToForward += '--whatif'
}
$argsToForward += $CommandArgs

Push-Location $repoRoot
try {
    if ($usePnpm) {
        & pnpm exec tsx --tsconfig "$tsConfig" "$cliEntry" @argsToForward
    }
    else {
        & npm exec --yes -- tsx --tsconfig "$tsConfig" "$cliEntry" @argsToForward
    }

    if ($LASTEXITCODE -ne 0) {
        Fail "sentinel runtime failed with exit code $LASTEXITCODE" $LASTEXITCODE
    }
}
finally {
    Pop-Location
}
