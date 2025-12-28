param (
    [Parameter(Mandatory = $true)]
    [ValidateSet("major", "minor", "patch")]
    $Type
)

# 1. Get current version from package.json
$currentVersion = node -p "require('./package.json').version"
# 2. Get latest git tag
$latestTag = git describe --tags --abbrev=0 2>$null
if (!$latestTag) { $latestTag = "No tags found" }

Write-Host "--- Version Info ---" -ForegroundColor Yellow
Write-Host "Current Package Version: v$currentVersion"
Write-Host "Latest Git Tag:         $latestTag"
Write-Host "Upcoming Bump:          $Type"
Write-Host "--------------------"

# Check if there are uncommitted changes
$status = git status --porcelain
if ($status) {
    Write-Host "Error: You have uncommitted changes. Please commit or stash them first." -ForegroundColor Red
    exit 1
}

# Ask for confirmation
$confirmation = Read-Host "Proceed with $Type release? (y/n)"
if ($confirmation -ne 'y') {
    Write-Host "Release cancelled." -ForegroundColor Gray
    exit 0
}

Write-Host "Updating version and tagging..." -ForegroundColor Cyan

# Run npm version
$newVersion = npm version $Type
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: npm version failed." -ForegroundColor Red
    exit 1
}

Write-Host "New Version: $newVersion" -ForegroundColor Green

Write-Host "Pushing changes and tags to GitHub..." -ForegroundColor Cyan
git push
git push --tags

Write-Host "Success! GitHub Actions will now build the release." -ForegroundColor Green
