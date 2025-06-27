# PowerShell script to set up Git repository for AI Reputation Lookup
Write-Host "Setting up Git repository for AI Reputation Lookup..." -ForegroundColor Green
Write-Host ""

# Navigate to script directory
Set-Location $PSScriptRoot

# Initialize git if not already done
if (-not (Test-Path ".git")) {
    Write-Host "Initializing git repository..." -ForegroundColor Yellow
    git init
    Write-Host ""
}

# Check git status
Write-Host "Current git status:" -ForegroundColor Cyan
git status
Write-Host ""

# Add all files
Write-Host "Adding all files to git..." -ForegroundColor Yellow
git add .
Write-Host ""

# Show what will be committed
Write-Host "Files to be committed:" -ForegroundColor Cyan
git status --short
Write-Host ""

# Commit changes
Write-Host "Creating initial commit..." -ForegroundColor Yellow
git commit -m "Initial commit: AI Reputation Lookup project with multi-platform analysis"
Write-Host ""

# Add remote if not already added
try {
    $remote = git remote get-url origin 2>$null
    if ($remote) {
        Write-Host "Remote already exists:" -ForegroundColor Cyan
        git remote -v
    }
} catch {
    Write-Host "Adding GitHub remote..." -ForegroundColor Yellow
    git remote add origin https://github.com/devotieno/ai-reputation-lookup.git
}
Write-Host ""

# Push to GitHub
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git push -u origin main
Write-Host ""

Write-Host "Git setup complete!" -ForegroundColor Green
Write-Host "Your project is now available at: https://github.com/devotieno/ai-reputation-lookup" -ForegroundColor Cyan
Read-Host "Press Enter to continue..."
