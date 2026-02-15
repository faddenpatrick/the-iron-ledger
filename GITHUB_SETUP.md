# 🚀 GitHub Setup Guide

## ✅ Pre-Push Checklist

### Security Verification
- [x] `.env` is in `.gitignore` ✅
- [x] `.env.example` contains only placeholders ✅
- [x] No real SECRET_KEY committed ✅
- [x] No passwords committed ✅
- [x] `.claude/` directory ignored ✅
- [x] No `node_modules/` committed ✅
- [x] No `dist/` or `build/` committed ✅
- [x] No `__pycache__/` or `venv/` committed ✅

### Repository Status
```
✅ 105 files committed
✅ 2 commits made
✅ All sensitive data excluded
✅ Ready to push to GitHub
```

## 📋 Step-by-Step GitHub Setup

### Option 1: Create New Repository on GitHub (Recommended)

**1. Go to GitHub and create a new repository:**
   - Visit: https://github.com/new
   - Repository name: `HealthApp` (or your preferred name)
   - Description: `Offline-first PWA for tracking workouts and nutrition`
   - Privacy: Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
   - Click "Create repository"

**2. Add GitHub as remote and push:**
```bash
cd /Users/patrickfadden/Documents/Projects/HealthApp

# Add GitHub as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/HealthApp.git

# Or use SSH (if you have SSH keys set up):
# git remote add origin git@github.com:YOUR_USERNAME/HealthApp.git

# Push your code
git branch -M main
git push -u origin main
```

**3. Verify the push:**
   - Refresh your GitHub repository page
   - You should see all 105 files
   - Check that README.md displays correctly
   - Verify .env is NOT visible (it shouldn't be!)

### Option 2: Push to Existing Repository

If you already have a repository:

```bash
cd /Users/patrickfadden/Documents/Projects/HealthApp

# Add remote
git remote add origin <your-repo-url>

# Push
git push -u origin main
```

## 🔐 Setting Up GitHub Secrets (For CI/CD - Optional)

If you plan to use GitHub Actions for automated deployment:

1. Go to your repository on GitHub
2. Click "Settings" → "Secrets and variables" → "Actions"
3. Add these secrets:
   - `DATABASE_PASSWORD` - Your database password
   - `SECRET_KEY` - Your JWT secret key
   - `SERVER_SSH_KEY` - SSH key for deployment (optional)

## 📝 Recommended Repository Settings

### Topics/Tags
Add these topics to make your repo discoverable:
- `pwa`
- `progressive-web-app`
- `workout-tracker`
- `nutrition-tracker`
- `offline-first`
- `fastapi`
- `react`
- `typescript`
- `docker`
- `postgresql`

### About Section
```
Offline-first Progressive Web App for tracking workouts and nutrition.
Built with FastAPI, React, TypeScript, and Docker.
Features complete offline functionality with background sync.
```

### .github Folder (Optional - for later)

You can add these later for better GitHub integration:
- `.github/workflows/` - CI/CD workflows
- `.github/ISSUE_TEMPLATE/` - Issue templates
- `.github/PULL_REQUEST_TEMPLATE.md` - PR template
- `.github/dependabot.yml` - Automated dependency updates

## 🔄 Daily Workflow After Setup

**Making changes:**
```bash
# 1. Make your changes
nano backend/app/api/v1/some_file.py

# 2. Test locally
make build
make up

# 3. Commit
git add .
git commit -m "feat: Add new feature"

# 4. Push to GitHub
git push

# 5. Deploy to server
ssh patrick@192.168.1.44
cd HealthApp
git pull
make deploy
```

## 🌟 Repository Features to Enable

### 1. Branch Protection (Recommended for collaboration)
   - Settings → Branches → Add rule
   - Pattern: `main`
   - Enable: "Require pull request reviews before merging"

### 2. GitHub Pages (Optional - for documentation)
   - Settings → Pages
   - Source: `main` branch, `/docs` folder
   - You can add documentation later

### 3. Issues
   - Enable Issues in Settings
   - Add labels: `bug`, `enhancement`, `documentation`

## 📊 Current Repository Stats

```
Language Breakdown:
- TypeScript: ~45%
- Python: ~40%
- CSS: ~10%
- Other: ~5%

Files by Category:
- Backend: 23 files
- Frontend: 31 files
- Docker: 5 files
- Documentation: 11 files
- Configuration: 10 files

Total Size: ~300KB (excluding node_modules and venv)
```

## 🔍 What to Check After Pushing

1. **README displays correctly** - Should show formatted markdown
2. **No .env file visible** - Security check
3. **All phase completion docs visible** - PHASE5-9_COMPLETE.md
4. **Docker files present** - Dockerfile, docker-compose.prod.yml
5. **No build artifacts** - node_modules, dist, venv should be absent

## 🚨 If You Accidentally Commit Secrets

If you accidentally commit a secret:

```bash
# Remove sensitive file from git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/sensitive/file" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (WARNING: Rewrites history)
git push origin --force --all

# Regenerate the exposed secret immediately!
# For SECRET_KEY: openssl rand -hex 32
# For passwords: Use a password manager
```

Better: **Never commit secrets in the first place!** Always use `.env` files.

## ✅ Verification Commands

Run these to verify everything is correct:

```bash
# Check what's being tracked
git ls-files | wc -l
# Should be: 105 files

# Verify .env is ignored
git status .env
# Should show: "not under version control"

# Check for secrets in history
git log --all --full-history --source --pretty=format:'%H' -- .env
# Should be empty

# Verify .gitignore is working
git check-ignore -v .env node_modules/ dist/ venv/
# Should show these are ignored
```

## 🎯 Next Steps After Pushing

1. **Set up server deployment:**
   ```bash
   ssh patrick@192.168.1.44
   git clone https://github.com/YOUR_USERNAME/HealthApp.git
   cd HealthApp
   cp .env.example .env
   nano .env  # Configure
   make deploy
   ```

2. **Enable GitHub notifications** for issues and PRs

3. **Star your own repo** (for quick access!)

4. **Share with others** (if public)

## 📱 Clone Instructions for Others

Add this to your README for others to use:

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/HealthApp.git
cd HealthApp

# Configure environment
cp .env.example .env
nano .env  # Update DATABASE_PASSWORD and SECRET_KEY

# Deploy with Docker
make build
make up

# Access the app
# Frontend: http://localhost
# Backend: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

---

## 🎉 You're Ready to Push!

Everything is configured correctly and secure. Your repository is ready for GitHub!

**Quick Command Summary:**
```bash
# Create repo on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/HealthApp.git
git push -u origin main
```

Good luck! 🚀
