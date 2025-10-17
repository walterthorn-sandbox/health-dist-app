#!/bin/bash

# GitHub Issues Bulk Creation Script
# This script helps create all 52 issues from GITHUB_ISSUES.md
#
# Prerequisites:
# 1. Install GitHub CLI: https://cli.github.com/
# 2. Run: gh auth login
# 3. Ensure labels and milestones are created first
#
# Usage:
# chmod +x scripts/create-github-issues.sh
# ./scripts/create-github-issues.sh

set -e

echo "🚀 Creating GitHub Issues for Food Permit POC"
echo "=============================================="
echo ""

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed"
    echo "Install from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub"
    echo "Run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is ready"
echo ""
echo "⚠️  Make sure you have created:"
echo "   - Labels (see SETUP_GITHUB.md)"
echo "   - Milestones (Phase 1-4)"
echo ""
read -p "Press enter to continue or Ctrl+C to cancel..."

# Phase 1 Issues
echo ""
echo "Creating Phase 1 Issues..."

gh issue create --title "Set up Next.js project with TypeScript and Tailwind" \
  --body "Initialize Next.js 14 project with TypeScript, Tailwind CSS, and App Router

**Acceptance Criteria**:
- [ ] Next.js 14 project created with App Router
- [ ] TypeScript configured
- [ ] Tailwind CSS installed and configured
- [ ] Project runs locally (\`npm run dev\`)
- [ ] Basic file structure created

**Commands**:
\`\`\`bash
npx create-next-app@latest food-permit-app --typescript --tailwind --app
\`\`\`" \
  --label "phase-1,setup,enhancement" \
  --milestone "Phase 1: Basic Infrastructure"

gh issue create --title "Install and configure dependencies" \
  --body "Install all required npm packages for the project

**Acceptance Criteria**:
- [ ] All dependencies installed
- [ ] Package.json includes all required packages
- [ ] No dependency conflicts

**Dependencies**: @vercel/postgres, ably, ably/react, openai, twilio, braintrust, zod, react-hook-form, @hookform/resolvers" \
  --label "phase-1,setup,enhancement" \
  --milestone "Phase 1: Basic Infrastructure"

gh issue create --title "Set up shadcn/ui component library" \
  --body "Initialize shadcn/ui and install base components

**Acceptance Criteria**:
- [ ] shadcn/ui initialized
- [ ] Base components installed (Button, Input, Form, Card, etc.)
- [ ] Components work correctly with TypeScript
- [ ] Styling matches Tailwind config" \
  --label "phase-1,setup,enhancement" \
  --milestone "Phase 1: Basic Infrastructure"

gh issue create --title "Set up Vercel Postgres database" \
  --body "Create and configure Vercel Postgres database

**Acceptance Criteria**:
- [ ] Vercel Postgres database created
- [ ] Environment variables configured
- [ ] Connection tested successfully
- [ ] Database schema SQL file created

**Files**: sql/schema.sql, lib/db.ts" \
  --label "phase-1,database,setup" \
  --milestone "Phase 1: Basic Infrastructure"

gh issue create --title "Create database schema" \
  --body "Implement database schema for sessions and applications tables

**Acceptance Criteria**:
- [ ] Sessions table created
- [ ] Applications table created
- [ ] All required fields included
- [ ] Foreign key relationships established
- [ ] Schema matches technical architecture" \
  --label "phase-1,database,enhancement" \
  --milestone "Phase 1: Basic Infrastructure"

gh issue create --title "Create Zod validation schemas" \
  --body "Define TypeScript/Zod schemas for form validation

**Acceptance Criteria**:
- [ ] Application schema defined
- [ ] Field-level validation rules
- [ ] Type exports for TypeScript
- [ ] Error messages configured

**File**: lib/schema.ts" \
  --label "phase-1,enhancement" \
  --milestone "Phase 1: Basic Infrastructure"

gh issue create --title "Create database utility functions" \
  --body "Build helper functions for database operations

**Acceptance Criteria**:
- [ ] Connection helper created
- [ ] CRUD functions for applications
- [ ] CRUD functions for sessions
- [ ] Error handling implemented
- [ ] TypeScript types defined

**File**: lib/db.ts" \
  --label "phase-1,database,enhancement" \
  --milestone "Phase 1: Basic Infrastructure"

gh issue create --title "Build basic web form UI" \
  --body "Create simple permit application web form

**Acceptance Criteria**:
- [ ] Form component created with all fields
- [ ] Mobile-responsive design
- [ ] Field validation with Zod
- [ ] Form submission handler
- [ ] Success/error states

**Files**: components/forms/PermitForm.tsx, app/apply/page.tsx

**Fields**: Establishment name, address, phone, email; Owner name, phone, email; Establishment type, planned opening date" \
  --label "phase-1,frontend,enhancement" \
  --milestone "Phase 1: Basic Infrastructure"

gh issue create --title "Implement form submission API" \
  --body "Create API route to handle form submissions

**Acceptance Criteria**:
- [ ] POST endpoint created
- [ ] Request validation with Zod
- [ ] Data saved to database
- [ ] Tracking ID generated
- [ ] Success response returned
- [ ] Error handling implemented

**File**: app/api/applications/route.ts" \
  --label "phase-1,backend,enhancement" \
  --milestone "Phase 1: Basic Infrastructure"

gh issue create --title "Create admin list view" \
  --body "Build admin interface to view all applications

**Acceptance Criteria**:
- [ ] List view showing all applications
- [ ] Display: establishment name, date, tracking ID
- [ ] Basic filtering (by name, date)
- [ ] Pagination (if needed)
- [ ] Responsive design
- [ ] Link to detail view

**File**: app/admin/page.tsx" \
  --label "phase-1,frontend,enhancement" \
  --milestone "Phase 1: Basic Infrastructure"

gh issue create --title "Create admin detail view" \
  --body "Build admin interface to view individual application

**Acceptance Criteria**:
- [ ] Detail view showing all application data
- [ ] Well-formatted display of all fields
- [ ] Back button to list view
- [ ] Responsive design

**File**: app/admin/[id]/page.tsx" \
  --label "phase-1,frontend,enhancement" \
  --milestone "Phase 1: Basic Infrastructure"

gh issue create --title "Add CSV export functionality" \
  --body "Enable exporting applications to CSV from admin

**Acceptance Criteria**:
- [ ] Export button in admin list view
- [ ] All application data included
- [ ] Proper CSV formatting
- [ ] Download works in browser" \
  --label "phase-1,enhancement" \
  --milestone "Phase 1: Basic Infrastructure"

gh issue create --title "Phase 1 testing and validation" \
  --body "Test basic web form end-to-end flow

**Acceptance Criteria**:
- [ ] Form submission works
- [ ] Data saves to database correctly
- [ ] Admin list shows submissions
- [ ] Admin detail shows correct data
- [ ] Validation works properly
- [ ] Error handling works" \
  --label "phase-1,testing" \
  --milestone "Phase 1: Basic Infrastructure"

echo "✅ Phase 1 issues created (13 issues)"
echo ""
echo "Note: To create all 52 issues, you can continue adding the remaining issues"
echo "      or create them manually from GITHUB_ISSUES.md"
echo ""
echo "Next steps:"
echo "1. Create remaining issues for Phase 2-4"
echo "2. Organize issues in GitHub Project board"
echo "3. Start with Issue #1!"
