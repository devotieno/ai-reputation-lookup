@echo off
echo Setting up Git repository for AI Reputation Lookup...
echo.

REM Navigate to project directory
cd /d "%~dp0"

REM Initialize git if not already done
if not exist ".git" (
    echo Initializing git repository...
    git init
    echo.
)

REM Check git status
echo Current git status:
git status
echo.

REM Add all files
echo Adding all files to git...
git add .
echo.

REM Show what will be committed
echo Files to be committed:
git status --short
echo.

REM Commit changes
echo Creating initial commit...
git commit -m "Initial commit: AI Reputation Lookup project with multi-platform analysis"
echo.

REM Add remote if not already added
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo Adding GitHub remote...
    git remote add origin https://github.com/devotieno/ai-reputation-lookup.git
) else (
    echo Remote already exists:
    git remote -v
)
echo.

REM Push to GitHub
echo Pushing to GitHub...
git push -u origin main
echo.

echo Git setup complete!
echo Your project is now available at: https://github.com/devotieno/ai-reputation-lookup
pause
