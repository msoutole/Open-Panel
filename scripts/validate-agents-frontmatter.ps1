$script = Join-Path $PSScriptRoot 'validate-agents-frontmatter.js'
if (-not (Test-Path $script)) {
  Write-Error "Script not found: $script"
  exit 1
}

# Run node with the script
$nodeCmd = "node";
$proc = Start-Process -FilePath $nodeCmd -ArgumentList $script -NoNewWindow -Wait -PassThru
if ($proc.ExitCode -ne 0) {
  Write-Error "Agent frontmatter validation failed (exit code $($proc.ExitCode))."
  exit $proc.ExitCode
}
Write-Host "Agent frontmatter validation passed" -ForegroundColor Green
exit 0
