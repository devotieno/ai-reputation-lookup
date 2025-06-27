# 🚀 Quick Git Setup Instructions

## Method 1: PowerShell Script (Recommended)
1. Open PowerShell as Administrator
2. Navigate to your project:
   ```powershell
   Set-Location "C:\Users\ADMIN\Desktop\ailookup\ai-reputation-lookup"
   ```
3. Run the PowerShell script:
   ```powershell
   .\setup-git.ps1
   ```

## Method 2: Command Prompt
1. Open Command Prompt as Administrator
2. Navigate to your project:
   ```cmd
   cd "C:\Users\ADMIN\Desktop\ailookup\ai-reputation-lookup"
   ```
3. Run the batch script:
   ```cmd
   setup-git.bat
   ```

## Method 3: Manual Commands (if scripts don't work)
Open PowerShell/Command Prompt and run these commands one by one:

```powershell
# Navigate to project
Set-Location "C:\Users\ADMIN\Desktop\ailookup\ai-reputation-lookup"

# Initialize git
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: AI Reputation Lookup project with multi-platform analysis"

# Add GitHub remote
git remote add origin https://github.com/devotieno/ai-reputation-lookup.git

# Push to GitHub
git push -u origin main
```

## ⚠️ Important Notes:
- Make sure you're connected to the internet
- You may be prompted to log in to GitHub
- Your `.env.local` file is already excluded by `.gitignore`
- If you get authentication errors, you may need to set up GitHub authentication

## 🎉 After Success:
Your project will be available at: https://github.com/devotieno/ai-reputation-lookup

You can then:
- Deploy to Vercel for live hosting
- Share the repository with collaborators
- Continue development with version control
