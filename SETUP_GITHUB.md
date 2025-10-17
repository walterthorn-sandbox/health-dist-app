# GitHub Repository Setup Guide

This guide walks you through setting up the GitHub repository and project board for the Food Establishment Permit Application POC.

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `health-dist-app` (or your preferred name)
3. Description: "Voice-driven permit application system with synchronized mobile UI - POC"
4. Choose: **Public** or **Private** (your preference)
5. **Do NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

## Step 2: Push Local Repository to GitHub

```bash
# Add the remote origin (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/health-dist-app.git

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: POC setup with requirements and architecture"

# Push to GitHub
git push -u origin main
```

If you prefer to use `main` as your default branch and it's not set:
```bash
git branch -M main
git push -u origin main
```

## Step 3: Create Labels

Go to: `https://github.com/YOUR_USERNAME/health-dist-app/labels`

Create the following labels:

| Label Name | Color | Description |
|------------|-------|-------------|
| `phase-1` | `#0E8A16` | Phase 1: Basic Infrastructure |
| `phase-2` | `#1D76DB` | Phase 2: Real-time Sync |
| `phase-3` | `#5319E7` | Phase 3: Voice Integration |
| `phase-4` | `#E99695` | Phase 4: Polish & Testing |
| `setup` | `#C2E0C6` | Setup and configuration tasks |
| `frontend` | `#BFD4F2` | Frontend/UI work |
| `backend` | `#D4C5F9` | Backend/API work |
| `database` | `#FEF2C0` | Database related |
| `voice` | `#F9D0C4` | Voice agent related |
| `realtime` | `#D1F0FF` | Real-time sync related |
| `monitoring` | `#FBCA04` | Braintrust/logging related |
| `testing` | `#D93F0B` | Testing tasks |
| `documentation` | `#0075CA` | Documentation tasks |
| `enhancement` | `#A2EEEF` | New features |
| `bug` | `#D73A4A` | Bug reports |
| `security` | `#EE0701` | Security related |
| `performance` | `#FFA500` | Performance optimization |
| `deployment` | `#5319E7` | Deployment related |

## Step 4: Create Milestones

Go to: `https://github.com/YOUR_USERNAME/health-dist-app/milestones`

Create the following milestones:

1. **Phase 1: Basic Infrastructure**
   - Due date: 1 week from start
   - Description: "Basic web form and admin interface working. Form submissions save to database."

2. **Phase 2: Real-time Sync**
   - Due date: 2 weeks from start
   - Description: "Real-time synchronization working. Mobile UI updates when API is called."

3. **Phase 3: Voice Integration**
   - Due date: 3 weeks from start
   - Description: "Voice agent integrated. Complete voice call → mobile UI sync → database flow working."

4. **Phase 4: POC Complete**
   - Due date: 4 weeks from start
   - Description: "Polished POC ready for demo. All success criteria met."

## Step 5: Create GitHub Project Board

1. Go to: `https://github.com/YOUR_USERNAME/health-dist-app/projects`
2. Click "New project"
3. Choose "Board" template
4. Name: "POC Development"
5. Click "Create project"

### Configure Board Columns

Create the following columns:
1. **Backlog** - Tasks not yet started
2. **Phase 1** - Basic Infrastructure tasks
3. **Phase 2** - Real-time Sync tasks
4. **Phase 3** - Voice Integration tasks
5. **Phase 4** - Polish & Testing tasks
6. **In Progress** - Currently being worked on
7. **In Review** - Ready for review
8. **Done** - Completed tasks

### Project Settings (Optional)

- Enable automation:
  - Auto-add new issues
  - Move to "In Progress" when issue is assigned
  - Move to "Done" when issue is closed

## Step 6: Create Issues from GITHUB_ISSUES.md

You can create issues manually or use the GitHub CLI:

### Manual Creation
1. Go to: `https://github.com/YOUR_USERNAME/health-dist-app/issues`
2. Click "New issue"
3. Choose "Feature" template
4. Copy content from `GITHUB_ISSUES.md`
5. Add appropriate labels and milestone
6. Repeat for all 52 issues

### Using GitHub CLI (Faster)

Install GitHub CLI: https://cli.github.com/

```bash
# Login to GitHub
gh auth login

# Create issues (you'll need to run this for each issue)
gh issue create --title "Set up Next.js project with TypeScript and Tailwind" \
  --body "See GITHUB_ISSUES.md Issue #1" \
  --label "phase-1,setup,enhancement" \
  --milestone "Phase 1: Basic Infrastructure"

# Or use a script (example for first few issues)
```

Alternatively, I can create a script to bulk-create issues if you'd like.

## Step 7: Configure Branch Protection (Optional)

For better collaboration:

1. Go to Settings → Branches
2. Add rule for `main` branch:
   - Require pull request before merging
   - Require status checks (CI) to pass
   - Require conversation resolution before merging

## Step 8: Add Repository Topics

Add topics to make the repo discoverable:
- `voice-ai`
- `real-time`
- `nextjs`
- `vercel`
- `twilio`
- `openai`
- `ably`
- `typescript`
- `poc`

## Step 9: Update README with Repository URL

Update the clone command in README.md with your actual repository URL.

## Step 10: Add Collaborators (Optional)

Settings → Collaborators → Add people

---

## Quick Start Checklist

- [ ] Create GitHub repository
- [ ] Push local code to GitHub
- [ ] Create labels
- [ ] Create milestones
- [ ] Create GitHub Project board
- [ ] Configure board columns
- [ ] Create issues (at least Phase 1 to start)
- [ ] Add repository topics
- [ ] Update README with correct URLs
- [ ] (Optional) Configure branch protection
- [ ] (Optional) Add collaborators

---

## What's Next?

Once GitHub is set up:
1. Start with Phase 1 issues
2. Create feature branches for each issue
3. Submit PRs for review
4. Move issues through the project board
5. Track progress in milestones

## Helpful GitHub CLI Commands

```bash
# View all issues
gh issue list

# View project
gh project list

# Create a branch for an issue
gh issue develop ISSUE_NUMBER --checkout

# View issue details
gh issue view ISSUE_NUMBER

# Close an issue
gh issue close ISSUE_NUMBER
```
