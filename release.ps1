# release.ps1 - Interactive Release Script for Windows

Write-Host "--- List Dock Release Assistant ---" -ForegroundColor Cyan

# 1. Check if there are uncommitted changes
$status = git status --porcelain
if ($status) {
    Write-Host "Error: You have uncommitted changes. Please commit or stash them first." -ForegroundColor Red
    git status
    exit 1
}

# 2. Get current version info
$currentVersion = node -p "require('./package.json').version"
$latestTag = git describe --tags --abbrev=0 2>$null
if (!$latestTag) { $latestTag = "None" }

# Clean tag version (remove 'v' prefix if exists)
$tagVersion = $latestTag -replace '^v', ''

Write-Host "Current Package Version: v$currentVersion" -ForegroundColor Gray
Write-Host "Latest Git Tag:         $latestTag" -ForegroundColor Gray

# 3. Handle Version Mismatch
if ($latestTag -ne "None" -and $currentVersion -ne $tagVersion) {
    Write-Host "`n⚠️  VERSION MISMATCH DETECTED!" -ForegroundColor Amber
    Write-Host "Package version (v$currentVersion) does not match Git tag ($latestTag)."
    Write-Host "Which version should be used as the base for this release?" -ForegroundColor Yellow
    Write-Host "1) Use Package Version (v$currentVersion)"
    Write-Host "2) Use Git Tag Version ($latestTag)"
    Write-Host "q) Quit"

    $syncChoice = Read-Host "Choice"
    if ($syncChoice -eq "2") {
        Write-Host "Syncing package.json to match Git tag ($latestTag)..." -ForegroundColor Cyan
        npm version $tagVersion --no-git-tag-version --allow-same-version
        $currentVersion = $tagVersion
    }
    elseif ($syncChoice -eq "q") {
        Write-Host "Cancelled."; exit 0
    }
    else {
        Write-Host "Proceeding with Package Version as base." -ForegroundColor Gray
    }
}

# 4. Ask for release type
Write-Host "`nSelect release type:" -ForegroundColor Yellow
Write-Host "1) Patch (0.0.x)"
Write-Host "2) Minor (0.x.0)"
Write-Host "3) Major (x.0.0)"
Write-Host "q) Quit"

$choice = Read-Host "Choice"
$type = ""

switch ($choice) {
    "1" { $type = "patch" }
    "2" { $type = "minor" }
    "3" { $type = "major" }
    "q" { Write-Host "Cancelled."; exit 0 }
    default { Write-Host "Invalid choice."; exit 1 }
}

# 5. Ask for custom commit message
Write-Host "`nEnter commit message (leave blank for auto: '$type release vX.X.X'):" -ForegroundColor Yellow
$customMsg = Read-Host "Message"

# 6. Final Confirmation
Write-Host "`nReady to release $type..." -ForegroundColor Cyan
$confirmation = Read-Host "Proceed? (y/n)"
if ($confirmation -ne 'y') {
    Write-Host "Release cancelled." -ForegroundColor Gray
    exit 0
}

Write-Host "`nBumping version..." -ForegroundColor Cyan

# Run npm version
# We use -m to store the custom message if provided
if ($customMsg) {
    $newVersion = npm version $type -m "$customMsg"
}
else {
    $newVersion = npm version $type
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: npm version failed." -ForegroundColor Red
    exit 1
}

Write-Host "New Version: $newVersion" -ForegroundColor Green

# 7. Push to origin
Write-Host "`nPushing changes and tags to origin..." -ForegroundColor Cyan
git push
git push --tags

Write-Host "`n✨ Release $newVersion successful! GitHub Actions check has started." -ForegroundColor Green
