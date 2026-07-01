# Publish installer to GitHub Releases (public download link for friends)
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$version = (Get-Content "$root\package.json" | ConvertFrom-Json).version
$tag = "v$version"
$asset = Get-ChildItem "$root\release\UniMeet-Setup-*.exe" | Select-Object -First 1

if (-not $asset) {
    Write-Host "Run: npm run build:desktop" -ForegroundColor Red
    exit 1
}

gh auth status 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Log in to GitHub:" -ForegroundColor Yellow
    gh auth login --hostname github.com --git-protocol https --web
}

gh release view $tag 2>$null
if ($LASTEXITCODE -eq 0) {
    gh release upload $tag $asset.FullName --clobber
} else {
    gh release create $tag $asset.FullName --title "UniMeet Desktop $tag" --notes "Windows installer — share https://zoom-xi-ten.vercel.app/download"
}

$fileName = $asset.Name
$downloadUrl = "https://github.com/mohommadhuafnan/Zoom/releases/download/$tag/$fileName"
Write-Host "Setup file URL: $downloadUrl" -ForegroundColor Green

Set-Location $root
echo $downloadUrl | vercel env add APP_DOWNLOAD_URL production --force 2>$null
echo $version | vercel env add APP_VERSION production --force 2>$null
vercel deploy --prod --yes

Write-Host ""
Write-Host "Share with friends:" -ForegroundColor Cyan
Write-Host "  Page:  https://zoom-xi-ten.vercel.app/download"
Write-Host "  Setup: $downloadUrl"
