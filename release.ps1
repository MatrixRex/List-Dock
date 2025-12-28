param (
    [Parameter(Mandatory=$true)]
    [ValidateSet("major", "minor", "patch")]
    $Type
)

Write-Host "Updating version and tagging ($Type)..." -ForegroundColor Cyan

# Check if there are uncommitted changes
$status = git status --porcelain
if ($status) {
    Write-Host "Error: You have uncommitted changes. Please commit or stash them first." -ForegroundColor Red
    exit 1
}

# Run npm version
npm version $Type

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: npm version failed." -ForegroundColor Red
    exit 1
}

Write-Host "Pushing changes and tags to GitHub..." -ForegroundColor Cyan
git push
git push --tags

Write-Host "Success! GitHub Actions will now build the release." -ForegroundColor Green
