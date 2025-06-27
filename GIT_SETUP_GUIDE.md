# Git Setup and GitHub Deployment Guide

## 🚀 **Quick Setup (Recommended)**

### **Option A: Use the Automated Script**
1. Open PowerShell or Command Prompt
2. Navigate to your project directory:
   ```cmd
   cd "C:\Users\ADMIN\Desktop\ailookup\ai-reputation-lookup"
   ```
3. Run the setup script:
   ```cmd
   setup-git.bat
   ```

The script will automatically handle all git setup steps for you!

---

## 🔧 **Manual Setup (Alternative)**

## 🚀 **Committing and Pushing to GitHub**

### **Step 1: Initialize Git Repository**
```bash
# Navigate to your project directory (if not already there)
cd "C:\Users\ADMIN\Desktop\ailookup\ai-reputation-lookup"

# Initialize git repository
git init

# Add all files to staging
git add .

# Create initial commit
git commit -m "Initial commit: AI Reputation Lookup with multi-platform analysis"
```

### **Step 2: Create GitHub Repository**
1. **Go to GitHub**: https://github.com/new
2. **Repository name**: `ai-reputation-lookup` 
3. **Description**: `AI-powered reputation analysis across multiple social media platforms`
4. **Visibility**: Choose Public or Private
5. **Don't initialize** with README, .gitignore, or license (since you already have files)
6. **Click "Create repository"**

### **Step 3: Connect Local Repository to GitHub**
```bash
# Add GitHub remote
git remote add origin https://github.com/devotieno/ai-reputation-lookup.git

# Verify remote was added
git remote -v

# Push to GitHub
git push -u origin main
```

### **Step 4: Environment Variables Security**
⚠️ **IMPORTANT**: Your `.env.local` file contains sensitive API keys and should NOT be pushed to GitHub.

**Create .gitignore file** (if it doesn't exist):
```bash
# Create .gitignore to exclude sensitive files
echo "# Environment Variables" > .gitignore
echo ".env.local" >> .gitignore
echo ".env" >> .gitignore
echo "" >> .gitignore
echo "# Dependencies" >> .gitignore
echo "node_modules/" >> .gitignore
echo "" >> .gitignore
echo "# Build outputs" >> .gitignore
echo ".next/" >> .gitignore
echo "out/" >> .gitignore
echo "dist/" >> .gitignore
echo "" >> .gitignore
echo "# Logs" >> .gitignore
echo "*.log" >> .gitignore
echo "npm-debug.log*" >> .gitignore
echo "" >> .gitignore
echo "# Runtime data" >> .gitignore
echo "pids" >> .gitignore
echo "*.pid" >> .gitignore
echo "*.seed" >> .gitignore
echo "" >> .gitignore
echo "# Coverage directory used by tools like istanbul" >> .gitignore
echo "coverage/" >> .gitignore
echo "" >> .gitignore
echo "# IDE files" >> .gitignore
echo ".vscode/" >> .gitignore
echo ".idea/" >> .gitignore
echo "*.swp" >> .gitignore
echo "*.swo" >> .gitignore
echo "" >> .gitignore
echo "# OS generated files" >> .gitignore
echo ".DS_Store" >> .gitignore
echo ".DS_Store?" >> .gitignore
echo "._*" >> .gitignore
echo ".Spotlight-V100" >> .gitignore
echo ".Trashes" >> .gitignore
echo "ehthumbs.db" >> .gitignore
echo "Thumbs.db" >> .gitignore
```

### **Step 5: Update Repository with Security**
```bash
# Remove .env.local from git if accidentally added
git rm --cached .env.local

# Add .gitignore and commit
git add .gitignore
git commit -m "Add .gitignore to protect environment variables"

# Push the security update
git push origin main
```

## 📚 **Repository Documentation**

### **Update README.md**
Your repository should have a comprehensive README. Here's what to include:

```markdown
# AI Reputation Lookup

AI-powered reputation analysis across multiple social media platforms using real APIs.

## Features
- ✅ Multi-platform analysis (YouTube, LinkedIn, Twitter/X, Reddit, GitHub, Instagram)
- ✅ Real API integration (OpenAI GPT-4o, Perplexity, SerpAPI, Perspective API)
- ✅ Advanced search strategies for each platform
- ✅ Comprehensive reputation scoring across 8 categories
- ✅ Modern glassmorphism UI with dark theme
- ✅ Authenticated and public analysis modes

## Setup
1. Clone repository
2. Install dependencies: `npm install`
3. Copy `.env.local.example` to `.env.local`
4. Add your API keys to `.env.local`
5. Run development server: `npm run dev`

## API Keys Required
- OpenAI API Key
- YouTube Data API Key
- SerpAPI Key
- Perspective API Key
- Perplexity API Key

See `.env.local.example` for complete configuration.
```

## 🔒 **Security Best Practices**

### **What to NEVER commit:**
- ❌ `.env.local` (contains API keys)
- ❌ `node_modules/` (dependencies)
- ❌ Build outputs (`.next/`, `dist/`)
- ❌ Log files

### **What to ALWAYS commit:**
- ✅ Source code (`src/`)
- ✅ Configuration files (`package.json`, `next.config.ts`)
- ✅ Documentation (`.md` files)
- ✅ `.env.local.example` (template without real keys)

## 🚀 **Deployment Options**

### **Option 1: Vercel (Recommended for Next.js)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel

# Follow prompts to deploy
```

### **Option 2: GitHub Pages (Static only)**
```bash
# Build static version
npm run build
npm run export

# Deploy to gh-pages branch
git checkout -b gh-pages
git add out/
git commit -m "Deploy to GitHub Pages"
git push origin gh-pages
```

### **Option 3: Docker Deployment**
```dockerfile
# Create Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📋 **Quick Commands Summary**

```bash
# Initial setup
git init
git add .
git commit -m "Initial commit: AI Reputation Lookup"

# Connect to GitHub
git remote add origin https://github.com/YOUR_USERNAME/ai-reputation-lookup.git
git push -u origin main

# Future updates
git add .
git commit -m "Your commit message"
git push origin main
```

## 🔧 **Environment Setup for Collaborators**

When others clone your repository, they'll need to:
1. Copy `.env.local.example` to `.env.local`
2. Add their own API keys
3. Run `npm install`
4. Run `npm run dev`

## 📊 **Repository Structure**
```
ai-reputation-lookup/
├── src/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── types/
├── public/
├── .env.local.example
├── package.json
├── README.md
└── .gitignore
```

Your project is now ready to be committed and pushed to GitHub! 🎉
