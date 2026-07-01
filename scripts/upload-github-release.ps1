$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$version = (Get-Content "$root\package.json" | ConvertFrom-Json).version
$tag = "v$version"
$exe = Get-ChildItem "$root\release\UniMeet-Setup-$version.exe" | Select-Object -First 1
$zip = Get-ChildItem "$root\release\UniMeet-Setup-$version.zip" -ErrorAction SilentlyContinue

if (-not $exe) {
    Write-Host "Build first: npm run build:desktop" -ForegroundColor Red
    exit 1
}

if (-not $zip) {
    $zipPath = "$root\release\UniMeet-Setup-$version.zip"
    Compress-Archive -Path $exe.FullName -DestinationPath $zipPath -Force
    $zip = Get-Item $zipPath
}

$credInput = "protocol=https`nhost=github.com`n`n"
$credOut = $credInput | git credential fill
$token = ($credOut | Where-Object { $_ -match '^password=' }) -replace '^password=', ''
if (-not $token) {
    Write-Host "No GitHub token from git credential. Run: gh auth login" -ForegroundColor Red
    exit 1
}

$headers = @{
    Authorization = "token $token"
    Accept        = 'application/vnd.github+json'
}

$release = $null
try {
    $release = Invoke-RestMethod -Uri "https://api.github.com/repos/mohommadhuafnan/Zoom/releases/tags/$tag" -Headers $headers
    Write-Host "Release $tag already exists (id $($release.id))"
} catch {
    $body = @{
        tag_name = $tag
        name     = "UniMeet Desktop $tag"
        body     = "Windows installer with hosted invite links. Share: https://zoom-xi-ten.vercel.app/download"
        draft    = $false
    } | ConvertTo-Json
    $release = Invoke-RestMethod -Uri 'https://api.github.com/repos/mohommadhuafnan/Zoom/releases' -Method Post -Headers $headers -Body $body -ContentType 'application/json'
    Write-Host "Created release $tag (id $($release.id))"
}

$latestYml = Get-ChildItem "$root\release\latest.yml" -ErrorAction SilentlyContinue
$assets = @($exe, $zip)
if ($latestYml) { $assets += $latestYml }

foreach ($file in $assets) {
    $name = $file.Name
    $uploadUrl = "https://uploads.github.com/repos/mohommadhuafnan/Zoom/releases/$($release.id)/assets?name=$name"
    Invoke-RestMethod -Uri $uploadUrl -Method Post -Headers @{
        Authorization = "token $token"
        Accept        = 'application/vnd.github+json'
        'Content-Type' = 'application/octet-stream'
    } -InFile $file.FullName | Out-Null
    Write-Host "Uploaded $name"
}

Write-Host "Download: https://github.com/mohommadhuafnan/Zoom/releases/download/$tag/$($exe.Name)" -ForegroundColor Green
