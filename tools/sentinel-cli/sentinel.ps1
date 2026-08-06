#!/usr/bin/env pwsh
<#
.SYNOPSIS
SentinelOS CLI launcher.

.DESCRIPTION
Read-only operator launcher for SentinelOS governance and executive support commands.
This launcher imports the local SentinelOS module and forwards arguments to Invoke-Sentinel.

Governance posture:
- No deployment
- No Azure mutation
- No image push
- No commit/push automation
- No destructive cleanup
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ModulePath = Join-Path $PSScriptRoot 'SentinelOS.psm1'

if (-not (Test-Path $ModulePath)) {
    throw "SentinelOS module not found at $ModulePath"
}

Import-Module $ModulePath -Force
Invoke-Sentinel @args
