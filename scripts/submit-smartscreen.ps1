# Open Microsoft file submission for SmartScreen reputation
$exe = Get-ChildItem "$PSScriptRoot\..\release\UniMeet-Setup-*.exe" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $exe) {
    Write-Host "Build first: npm run build:desktop" -ForegroundColor Red
    exit 1
}
$hash = (Get-FileHash $exe.FullName -Algorithm SHA256).Hash
Write-Host "File: $($exe.Name)" -ForegroundColor Cyan
Write-Host "SHA256: $hash"
Write-Host ""
Write-Host "Opening Microsoft submission page..." -ForegroundColor Green
Write-Host "Upload the file above as Software Developer submission."
Start-Process "https://www.microsoft.com/en-us/wdsi/filesubmission"
explorer.exe /select,"$($exe.FullName)"
