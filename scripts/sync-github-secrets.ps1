# Sync Vercel env vars to GitHub Actions secrets (run after `gh auth login`)
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

gh auth status 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Run: gh auth login" -ForegroundColor Red
    exit 1
}

$envFile = Join-Path $root "backend\.env"
if (-not (Test-Path $envFile)) {
    Write-Host "Missing backend\.env" -ForegroundColor Red
    exit 1
}

$map = @{
    SUPABASE_URL             = $null
    SUPABASE_SECRET_KEY      = $null
    SUPABASE_PUBLISHABLE_KEY = $null
    SUPABASE_JWKS_URL        = $null
    JWT_SECRET               = $null
    CLIENT_URL               = "https://zoom-xi-ten.vercel.app"
}

Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([^#=]+)=(.*)$') {
        $k = $matches[1].Trim()
        $v = $matches[2].Trim()
        if ($map.ContainsKey($k)) { $map[$k] = $v }
    }
}

foreach ($name in $map.Keys) {
    $val = $map[$name]
    if ($val) {
        $val | gh secret set $name --repo mohommadhuafnan/Zoom
        Write-Host "Set secret: $name"
    }
}

Write-Host "Done. Run Desktop Release workflow on GitHub Actions." -ForegroundColor Green
