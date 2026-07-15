[CmdletBinding()]
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$CommandArgs,
    [switch]$WhatIf
)

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$sentinelScript = Join-Path $scriptRoot 'sentinel.ps1'

$argsToForward = @('executive')
$argsToForward += $CommandArgs

if ($WhatIf) {
    & $sentinelScript -WhatIf @argsToForward
}
else {
    & $sentinelScript @argsToForward
}

exit $LASTEXITCODE
