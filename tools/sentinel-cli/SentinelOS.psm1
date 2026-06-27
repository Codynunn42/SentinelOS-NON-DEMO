Set-StrictMode -Version Latest

function New-SentinelExecutivePacket {
    [CmdletBinding()]
    param(
        [string]$Output = 'DoctorModeRuntimeRestoreSupportPacket.json'
    )

    $packet = [ordered]@{
        timestamp = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
        command = 'prepare.white_glove_doctor_mode_runtime_restore_support_packet'
        authority = 'NunnCorp Executive Operating Template - 2026-06-16'
        governanceMode = 'READ_ONLY'
        mutationAuthorized = $false
        executiveObjective = 'Transition from build/test-green to operator-green runtime proof'
        currentGate = 'PREPARE_WHITE_GLOVE_DOCTOR_MODE_RUNTIME_RESTORE_SUPPORT_PACKET'
        runtimeStatus = [ordered]@{
            sentinelRuntime = 'UNVERIFIED'
            runtimeHealth = 'NOT_VERIFIED'
            readiness = 'NOT_VERIFIED'
            doctorAck = 'NOT_VERIFIED'
            receiptValidation = 'NOT_VERIFIED'
            externalClaims = 'HELD'
        }
        buildValidation = [ordered]@{
            nexusUiLint = 'PASS'
            nexusUiBuild = 'PASS'
            nunnPayBuild = 'PASS'
            nunnPayTests = 'PASS'
            sentinelBuild = 'PASS'
            sentinelTests = 'PASS_LOCAL_BIND_CAVEAT'
            rootWorkspace = 'PASS_LOCAL_BIND_CAVEAT'
        }
        localEvidence = [ordered]@{
            environment = 'VERIFIED'
            healthEndpoint = 'VERIFIED'
            doctorProxy = 'VERIFIED'
            localDoctorMode = 'VERIFIED'
            receiptQuery = 'VERIFIED'
        }
        outstandingBlockers = @(
            'Azure runtime reachability',
            'Live browser login',
            'Doctor Mode ACK',
            'Receipt validation',
            'Azure control plane evidence',
            'PR7 source identification'
        )
        executiveHolds = @(
            'No deployment',
            'No Azure mutation',
            'No image push',
            'No runtime restart',
            'No external publication',
            'No customer claims'
        )
        nextEvidenceRequired = @(
            'Runtime Health',
            'Readiness',
            'Browser Login',
            'Doctor ACK',
            'Receipt Validation'
        )
        recommendation = 'Continue evidence collection until runtime proof is established.'
    }

    $outputPath = if ([System.IO.Path]::IsPathRooted($Output)) {
        $Output
    }
    else {
        Join-Path (Get-Location) $Output
    }

    $packet | ConvertTo-Json -Depth 20 | Out-File $outputPath -Encoding utf8

    Write-Host ''
    Write-Host '========================================='
    Write-Host ' SENTINELOS EXECUTIVE SUPPORT PACKET'
    Write-Host '========================================='
    Write-Host ''
    $packet | ConvertTo-Json -Depth 20
    Write-Host ''
    Write-Host "Packet written to: $outputPath"
    Write-Host 'STATUS: READ-ONLY'
    Write-Host 'NO MUTATIONS EXECUTED'
    Write-Host 'EXECUTIVE GOVERNANCE PRESERVED'

    return $packet
}

function Show-SentinelHelp {
    [CmdletBinding()]
    param()

    @'
SentinelOS CLI - Read-Only Scaffold

Usage:
  ./tools/sentinel-cli/sentinel.ps1 executive prepare-runtime-packet [-Output <path>]
  ./tools/sentinel-cli/sentinel.ps1 executive report [-Output <path>]
  ./tools/sentinel-cli/sentinel.ps1 help

Available commands:
  executive prepare-runtime-packet  Prepare the Doctor Mode runtime restore support packet.
  executive report                  Alias for prepare-runtime-packet in this scaffold.
  help                              Show this help.

Governance posture:
  This scaffold is read-only. It does not deploy, mutate Azure, push images, commit code,
  publish claims, or activate external operations.
'@ | Write-Host
}

function Invoke-Sentinel {
    [CmdletBinding()]
    param(
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$Args
    )

    if (-not $Args -or $Args.Count -eq 0) {
        Show-SentinelHelp
        return
    }

    $command = ($Args | Where-Object { $_ -notmatch '^-' }) -join ' '

    $output = 'DoctorModeRuntimeRestoreSupportPacket.json'
    for ($i = 0; $i -lt $Args.Count; $i++) {
        if ($Args[$i] -eq '-Output' -and ($i + 1) -lt $Args.Count) {
            $output = $Args[$i + 1]
        }
    }

    switch -Regex ($command) {
        '^help$' {
            Show-SentinelHelp
            break
        }
        '^executive prepare-runtime-packet' {
            New-SentinelExecutivePacket -Output $output
            break
        }
        '^executive report' {
            New-SentinelExecutivePacket -Output $output
            break
        }
        default {
            Write-Error "Unknown SentinelOS command: $($Args -join ' ')"
        }
    }
}

Export-ModuleMember -Function Invoke-Sentinel, New-SentinelExecutivePacket
