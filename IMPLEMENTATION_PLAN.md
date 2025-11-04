# Platform Implementation Plan

**Project**: Health Distribution Platform (MyTechNavigator)
**Version**: 1.0
**Date**: 2025-11-01
**Based on**: [PLATFORM_REQUIREMENTS.md](PLATFORM_REQUIREMENTS.md) v1.1

---

## Executive Summary

This implementation plan breaks down the platform development into 8 phases over an estimated 16-20 weeks. Each phase delivers working functionality that can be tested and validated before moving to the next phase.

**Timeline Overview**:
- **Phase 0**: Setup & Infrastructure (Week 1-2)
- **Phase 1**: Database Schema & Auth (Week 2-3)
- **Phase 2**: Core Platform Features (Week 4-6)
- **Phase 3**: Form Builder (Week 7-9)
- **Phase 4**: Voice Agent Integration (Week 10-11)
- **Phase 5**: Subdomain Routing & Multi-tenancy (Week 12-13)
- **Phase 6**: Platform Admin Tools (Week 14-15)
- **Phase 7**: Testing & Polish (Week 16-18)
- **Phase 8**: Deployment & Launch (Week 19-20)

---

## Phase 0: Setup & Infrastructure (Week 1-2)

### Goals
- Set up new repository and development environment
- Configure all external services
- Create foundational project structure

### Tasks

#### 0.1 Repository Setup
- [ ] Fork existing `health-dist-app` repository to new repo `health-dist-platform`
- [ ] Clean up unnecessary files from old app
- [ ] Update README with platform-specific documentation
- [ ] Set up `.env.example` with all required environment variables
- [ ] Configure `.gitignore` for platform-specific files

#### 0.2 Service Configuration
- [ ] **Vercel**: Create new Vercel project `mytechnavigator`
  - Link to new repository
  - Configure environment variables
  - Set up preview deployments
- [ ] **Neon**: Create new PostgreSQL database instance
  - Note connection string
  - Set up database connection pooling
  - Configure database backups (Neon Pro feature, or defer to later)
- [ ] **Railway**: Create new Railway app for background jobs
  - Configure environment variables
  - Set up deployment pipeline
- [ ] **Clerk**: Create new Clerk application
  - Enable Organizations feature
  - Configure passwordless authentication (Email OTP + SMS OTP)
  - Set up roles: admin (Account Admin), member (Account User)
  - Configure callback URLs for Vercel
  - Customize sign-in/sign-up flows
- [ ] **Twilio**: Document existing Twilio account credentials
  - For voice calls only (SMS OTP handled by Clerk)

#### 0.3 Project Structure Updates
- [ ] Set up monorepo structure (if needed) or keep existing Next.js structure
- [ ] Create new directories:
  - `/src/components/admin` - Platform admin components
  - `/src/components/forms` - Form builder components
  - `/src/components/account` - Account management components
  - `/src/lib/auth` - Clerk integration helpers
  - `/src/lib/multitenancy` - Subdomain routing logic
  - `/prisma` or `/supabase` - Database schema and migrations
- [ ] Install additional dependencies:
  - Clerk SDK for Next.js: `@clerk/nextjs`
  - Form builder library (SurveyJS recommended): `survey-react-ui`, `survey-creator-react`
  - Database ORM: Prisma (recommended for Neon) or Drizzle
  - Neon serverless driver: `@neondatabase/serverless`
  - Additional UI components as needed

#### 0.4 Development Environment
- [ ] Update `package.json` with new project name and dependencies
- [ ] Set up local development environment variables
- [ ] Configure local database connection to Neon
- [ ] Test basic Next.js app runs locally
- [ ] Set up ESLint and Prettier rules (if not already configured)

### Deliverables
- New repository with clean foundation
- All services configured and accessible
- Local development environment working
- Basic Next.js app running on Vercel

### Success Criteria
- Can run `npm run dev` and see Next.js app locally
- Can deploy to Vercel successfully
- Can connect to Neon database
- Clerk test login works (email OTP or SMS OTP)

---

## Phase 1: Database Schema & Auth (Week 2-3)

### Goals
- Design and implement complete database schema
- Set up Clerk integration with Organizations
- Implement database-level security and access control
- Create seed data script
- Sync Clerk users and organizations to Neon database

### Tasks

#### 1.1 Database Schema Design
- [ ] Create database schema diagram
- [ ] Write SQL migration scripts or Prisma schema

**Tables to create**:

```sql
-- Core tables
accounts (id, name, slug, clerk_org_id, status, created_at, updated_at)
users (id, clerk_user_id, email, name, created_at, updated_at)
account_users (id, account_id, user_id, clerk_role, created_at, updated_at)

-- Form tables
forms (id, account_id, name, description, slug, status, current_version, published_version, created_at, updated_at)
form_versions (id, form_id, version_number, fields_json, created_at, created_by)
form_fields (id, form_version_id, field_type, label, required, order, config_json)

-- Prompt tables
prompts (id, form_id, version_number, prompt_text, created_by, generation_method, status, created_at)
form_version_prompts (id, form_version_id, prompt_id, is_active, created_at)

-- Phone number tables
phone_numbers (id, account_id, form_id, phone_number, twilio_sid, twilio_auth_token_encrypted, status, provisioning_method, created_at)

-- Session tables
sessions (id, account_id, form_id, form_version_id, prompt_id, phone_number_id, transcript_json, collected_data_json, status, started_at, completed_at)
```

- [ ] Create indexes for performance:
  - `accounts.slug` (unique)
  - `forms.account_id`, `forms.slug`
  - `sessions.account_id`, `sessions.form_id`
  - `account_users.account_id`, `account_users.user_id`

#### 1.2 Database Access Control
With Neon (standard PostgreSQL), we'll use application-level access control instead of Supabase-style RLS:

- [ ] Create database access helper functions:
  - `getUserAccounts(clerkUserId)` - Get all accounts for a user
  - `checkUserAccountAccess(clerkUserId, accountId)` - Verify user has access to account
  - `getUserRole(clerkUserId, accountId)` - Get user's role in account
- [ ] Implement middleware-level checks:
  - Extract Clerk user ID and org ID from session
  - Verify user has access before any database query
  - Inject account ID filter into all queries
- [ ] Create query builder helpers:
  - All form queries automatically filter by `account_id`
  - All session queries automatically filter by `account_id`
  - Prevent cross-account data access at application layer

**Example access control**:
```typescript
// In API route
import { auth } from '@clerk/nextjs'

export async function GET(req: Request) {
  const { userId, orgId } = auth()

  if (!userId || !orgId) {
    return new Response('Unauthorized', { status: 401 })
  }

  // All queries automatically filtered by orgId
  const forms = await db.forms.findMany({
    where: { accountId: orgId }
  })

  return Response.json(forms)
}
```

#### 1.3 Clerk Integration
- [ ] Install Clerk Next.js SDK (`@clerk/nextjs`)
- [ ] Configure Clerk provider in Next.js app:
  - Set up environment variables (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`)
  - Wrap app with `<ClerkProvider>`
- [ ] Create middleware for authentication:
  ```typescript
  // middleware.ts
  import { authMiddleware } from '@clerk/nextjs'

  export default authMiddleware({
    publicRoutes: ['/', '/api/voice/webhook'],
  })
  ```
- [ ] Configure Clerk Organizations:
  - Enable Organizations in Clerk dashboard
  - Set up organization roles: `admin` and `member`
  - Configure organization invitation emails
- [ ] Set up passwordless authentication:
  - Enable Email OTP in Clerk dashboard
  - Enable SMS OTP in Clerk dashboard
  - Customize email/SMS templates
- [ ] Build authentication helpers:
  - `getCurrentUser()` - Get Clerk user from session
  - `requireAuth()` - Protect routes (use Clerk middleware)
  - `checkOrgAccess(orgId)` - Verify user belongs to organization
  - `getUserOrgs()` - Get user's organizations from Clerk

#### 1.4 Clerk-to-Database Sync
- [ ] Create Clerk webhook handlers to sync data to Neon:
  - `/api/webhooks/clerk` - Receive Clerk events
  - Handle `user.created` - Create user in Neon database
  - Handle `organizationMembership.created` - Add user to account
  - Handle `organization.created` - Create account in Neon
  - Handle `user.updated` - Update user in Neon
  - Handle `organizationMembership.deleted` - Remove user from account
- [ ] Verify webhook signature for security
- [ ] Test webhook flow:
  - Create user in Clerk → user appears in Neon
  - Add user to org in Clerk → account_users record created

#### 1.5 Seed Data Script
- [ ] **Manual Clerk setup** (cannot be fully scripted):
  - Create platform admin user in Clerk (your email)
  - Create "Riverside County Health District" organization in Clerk
  - Add platform admin as org admin to Riverside County
  - Note Clerk IDs for database seed
- [ ] **Database seed script** (`/scripts/seed.sql` or TypeScript):
  - Seed Riverside County account using Clerk org ID:
    - Slug: `riverside`
    - clerk_org_id: (from Clerk dashboard)
    - Status: active
  - Seed platform admin user record using Clerk user ID
  - Seed "Food Establishment Permit Application" form:
    - Create form record
    - Create form_version record (v1)
    - Create form_fields based on existing app
    - Status: published
  - Seed phone number for the form (using test credentials)
  - Seed initial prompt based on existing app logic
  - Create relationship records (form_version_prompts)

#### 1.6 Database Access Layer
- [ ] Create TypeScript types for all database entities
- [ ] Build repository pattern or use ORM (Prisma recommended):
  - `AccountRepository` - CRUD for accounts
  - `UserRepository` - User management
  - `FormRepository` - Form operations
  - `PromptRepository` - Prompt management
  - `SessionRepository` - Session tracking
- [ ] Add validation and error handling
- [ ] Create database connection pooling configuration

### Deliverables
- Complete database schema implemented in Neon
- Application-level access control enforced
- Clerk integration working with Organizations
- Clerk webhooks syncing to Neon database
- Seed data script ready to run
- Database access layer complete

### Success Criteria
- Can run seed script and populate database
- Can log in via Clerk (Email OTP or SMS OTP) and see user session
- Application prevents cross-account data access
- Clerk webhooks sync users and orgs to Neon
- Can query accounts, users, forms via repository layer

---

## Phase 2: Core Platform Features (Week 4-6)

### Goals
- Build account management UI
- Implement user invitation system
- Create account settings and user management pages
- Build basic navigation and layout

### Tasks

#### 2.1 Platform Layout & Navigation
- [ ] Create main layout component with:
  - Top navigation bar
  - Account switcher (for users in multiple accounts)
  - User profile dropdown
  - Platform admin link (if user is platform admin)
- [ ] Build responsive sidebar navigation:
  - Dashboard
  - Forms
  - Users (if admin)
  - Phone Numbers
  - Sessions
  - Settings
- [ ] Implement account context provider:
  - Track current active account
  - Switch between accounts
  - Load account-specific data

#### 2.2 Dashboard Pages
- [ ] `/dashboard` - Main dashboard after login
  - Welcome message
  - Quick stats: # of forms, # of sessions, # of users
  - Recent sessions list
  - Quick actions: Create form, Invite user
- [ ] `/dashboard/[accountId]` - Account-specific dashboard
  - Account name and subdomain
  - Account stats
  - Recent activity

#### 2.3 Account Management
- [ ] **Create Account Page** (Platform Admin only): `/admin/accounts/new`
  - Form to create new account:
    - Account name
    - Slug (with validation for uniqueness and format)
    - Initial admin email
  - On submit:
    - Create Clerk Organization via API
    - Create account record in Neon (via webhook or directly)
    - Invite admin to organization via Clerk
    - Send invitation email (handled by Clerk)
- [ ] **Account List Page** (Platform Admin only): `/admin/accounts`
  - List all accounts with search/filter
  - View account details
  - Suspend/activate accounts
- [ ] **Account Settings Page**: `/[accountSlug]/settings/account`
  - Edit account name
  - Edit slug (with warnings about breaking existing URLs)
  - View account status

#### 2.4 User Management
- [ ] **User Invitation Flow**:
  - Create `/[accountSlug]/settings/users/invite` page
  - Form to invite user:
    - Email address
    - Role (`admin` or `member`)
  - Send invitation via Clerk Organizations API
  - User record created in Neon automatically via webhook when accepted
- [ ] **User List Page**: `/settings/users`
  - List all users in current account
  - Show role for each user
  - Actions: Change role, Remove from account
- [ ] **User Role Management**:
  - Build role assignment UI
  - Implement role change API endpoint
  - Update Clerk organization membership role when changed

#### 2.5 API Endpoints
Create Next.js API routes:
- [ ] `/api/accounts` - Create, list, update accounts
- [ ] `/api/accounts/[accountId]/users` - Manage users in account
- [ ] `/api/accounts/[accountId]/users/invite` - Invite user
- [ ] `/api/users/[userId]/roles` - Update user roles
- [ ] `/api/auth/session` - Get current user session with accounts

All endpoints should:
- Check authentication
- Enforce authorization (role-based)
- Validate input
- Handle errors gracefully

#### 2.6 Platform Admin Portal
- [ ] Create `/admin` layout with admin-only navigation
- [ ] **Accounts Page**: `/admin/accounts`
  - List all accounts
  - Search and filter
  - Create new account button
- [ ] **Account Details Page**: `/admin/accounts/[accountId]`
  - View account information
  - View users in account
  - View forms and sessions (read-only)
  - Suspend/activate account

### Deliverables
- Working dashboard with navigation
- Account creation and management (platform admin)
- User invitation and role management
- Account settings page
- Platform admin portal

### Success Criteria
- Platform admin can create new accounts
- Account admin can invite users to their account
- Users can be assigned roles
- Navigation and layout work on desktop and mobile
- Can switch between accounts if user belongs to multiple

---

## Phase 3: Form Builder (Week 7-9)

### Goals
- Integrate form builder library (SurveyJS)
- Build form creation and editing UI
- Implement form versioning
- Create form publishing workflow

### Tasks

#### 3.1 Form Builder Library Integration
- [ ] Install SurveyJS dependencies:
  ```bash
  npm install survey-core survey-creator-core survey-react-ui survey-creator-react
  ```
- [ ] Create form builder wrapper component:
  - `/src/components/forms/FormBuilder.tsx`
  - Configure SurveyJS with custom theme
  - Restrict to supported field types: short text, long text, phone, email, date, dropdown
  - Configure accessibility settings
- [ ] Create form preview component:
  - `/src/components/forms/FormPreview.tsx`
  - Render form in read-only mode
  - Show how end users will see the form

#### 3.2 Form Management Pages
- [ ] **Forms List Page**: `/forms`
  - List all forms in current account
  - Show form name, status (draft/published), version
  - Actions: Edit, Publish, View, Delete
  - Create new form button
- [ ] **Create Form Page**: `/forms/new`
  - Form builder interface
  - Fields: Form name, description, slug
  - Save as draft
  - Cancel (with confirmation if unsaved changes)
- [ ] **Edit Form Page**: `/forms/[formId]/edit`
  - Load form from database
  - Show form builder with existing fields
  - Save draft changes
  - Publish button (triggers publishing workflow)
- [ ] **Form Details Page**: `/forms/[formId]`
  - View published form (read-only)
  - Show form metadata (name, version, created date)
  - Show associated phone number
  - Show version history
  - Edit button (if user has permission)

#### 3.3 Form Versioning
- [ ] Implement versioning logic:
  - When form is published, create `form_versions` record
  - Increment version number
  - Snapshot form fields as JSON
  - Lock previous version (read-only)
- [ ] **Version History Page**: `/forms/[formId]/versions`
  - List all versions with dates
  - Compare versions (diff view)
  - View specific version (read-only)
  - Roll back to previous version (creates new version)

#### 3.4 Form Publishing Workflow
- [ ] Create publishing modal/dialog:
  - Confirm form is ready to publish
  - Show what's changed since last version (if applicable)
  - Ask: "Update voice agent prompt?"
    - Yes → Generate new prompt with AI
    - No → Keep existing prompt
    - Edit → Show prompt editor
- [ ] Implement publish API endpoint: `/api/forms/[formId]/publish`
  - Validate form has all required fields
  - Create new form version
  - Update form status to "published"
  - Handle prompt update based on user selection
  - Return success with new version number

#### 3.5 AI Prompt Generation
- [ ] Create prompt generation service:
  - `/src/lib/ai/promptGenerator.ts`
  - Analyze form fields and generate conversational prompt
  - Use OpenAI API (GPT-4 or similar)
  - Maintain bilingual support (English/Spanish)
  - Include error handling and validation
- [ ] **Prompt for new form**:
  - Analyze all form fields
  - Generate structured prompt with:
    - Greeting
    - Field-by-field data collection strategy
    - Validation and error handling
    - Confirmation and closing
- [ ] **Prompt for updated form**:
  - Compare old and new form versions
  - Identify what changed (new fields, removed fields, modified fields)
  - Generate updated prompt that reflects changes
- [ ] Create prompt editor component:
  - Text area with syntax highlighting
  - Preview prompt
  - Save new prompt version

#### 3.6 Form API Endpoints
- [ ] `/api/forms` - Create, list forms for account
- [ ] `/api/forms/[formId]` - Get, update, delete form
- [ ] `/api/forms/[formId]/publish` - Publish form, create version
- [ ] `/api/forms/[formId]/versions` - List versions
- [ ] `/api/forms/[formId]/versions/[versionId]` - Get specific version
- [ ] `/api/forms/[formId]/prompt` - Get/update active prompt
- [ ] `/api/prompts/generate` - Generate AI prompt for form

### Deliverables
- Working form builder with SurveyJS integration
- Form creation and editing UI
- Form versioning system
- Publishing workflow with AI prompt generation
- Form preview and version history

### Success Criteria
- Can create a new form with drag-and-drop
- Can add all supported field types
- Can save form as draft and continue editing
- Can publish form and create version
- AI generates appropriate prompt for form
- Can view version history and compare versions

---

## Phase 4: Voice Agent Integration (Week 10-11)

### Goals
- Integrate voice agent with forms
- Connect phone numbers to forms
- Implement session tracking
- Test end-to-end call flow

### Tasks

#### 4.1 Phone Number Management UI
- [ ] **Phone Numbers List Page**: `/phone-numbers`
  - List all phone numbers in account
  - Show phone number, associated form, status
  - Add phone number button
- [ ] **Add Phone Number Page**: `/phone-numbers/new`
  - Form to manually add phone number:
    - Phone number (E.164 format validation)
    - Twilio Account SID
    - Twilio Auth Token (encrypted)
    - Twilio Phone Number SID
    - Associated form (dropdown)
  - Save and test Twilio connection
- [ ] **Edit Phone Number Page**: `/phone-numbers/[phoneId]/edit`
  - Update phone number details
  - Change associated form
  - Test connection
  - Deactivate phone number

#### 4.2 Phone Number API Endpoints
- [ ] `/api/phone-numbers` - Create, list phone numbers for account
- [ ] `/api/phone-numbers/[phoneId]` - Get, update, delete phone number
- [ ] `/api/phone-numbers/[phoneId]/test` - Test Twilio connection
- [ ] `/api/phone-numbers/validate` - Validate phone number format

#### 4.3 Voice Agent Integration
- [ ] Update voice agent code to work with multi-tenant platform:
  - Identify which form based on incoming phone number
  - Load form version and fields dynamically
  - Load active prompt for form
  - Track account ID for session
- [ ] Create voice agent webhook endpoint: `/api/voice/webhook`
  - Receives call from Twilio
  - Looks up phone number → form → prompt
  - Loads form fields dynamically
  - Initiates voice agent with appropriate prompt
  - Tracks session with form and prompt versions
- [ ] Update voice agent prompt loading:
  - Instead of hardcoded prompt, load from database
  - Use active prompt for the form version
  - Pass form field information to voice agent

#### 4.4 Session Tracking
- [ ] Enhance session tracking to include:
  - Account ID
  - Form ID
  - Form version ID
  - Prompt ID (version used)
  - Phone number ID
  - All existing session data (transcript, collected data, etc.)
- [ ] Create session API endpoints:
  - `/api/sessions` - List sessions for account
  - `/api/sessions/[sessionId]` - Get session details
  - `/api/forms/[formId]/sessions` - List sessions for specific form
- [ ] **Sessions List Page**: `/sessions`
  - List all sessions for account
  - Filter by form, date range, status
  - View session details
- [ ] **Session Details Page**: `/sessions/[sessionId]`
  - Show full transcript
  - Show collected data (form submission)
  - Show which form and prompt version were used
  - Show call duration and metadata
  - Link to form version and prompt version used

#### 4.5 Voice Agent Testing
- [ ] Set up test phone number with test Twilio account
- [ ] Create test form in seed data
- [ ] Test complete call flow:
  - Call phone number
  - Voice agent uses correct prompt
  - Voice agent collects form data
  - Session is recorded correctly
  - Form submission is saved
- [ ] Test error handling:
  - Invalid phone number
  - Form not found
  - Twilio errors
  - Voice agent failures

### Deliverables
- Phone number management UI
- Voice agent integrated with dynamic forms and prompts
- Session tracking with version information
- Working end-to-end call flow

### Success Criteria
- Can add phone number manually and associate with form
- Can call phone number and interact with voice agent
- Voice agent uses correct prompt from database
- Voice agent collects data according to form fields
- Session is recorded with form and prompt version
- Can view session details and transcript

---

## Phase 5: Path-Based Routing & Multi-tenancy (Week 12-13)

### Goals
- Implement path-based account routing (e.g., `/riverside/forms`)
- Ensure data isolation between accounts
- Create public form pages
- Test multi-tenant access
- Design for easy migration to subdomain routing later

### Tasks

#### 5.1 Path-Based Routing Middleware
- [ ] Create Next.js middleware for account resolution:
  - `/middleware.ts`
  - Extract account slug from URL path: `/[accountSlug]/...`
  - Look up account by slug from database
  - Inject account context into request
  - Handle invalid account slugs (404 page)
  - Redirect root `/` to account selector or default account
- [ ] Create account context provider:
  - `/src/contexts/AccountContext.tsx`
  - Provide current account to all components
  - Handle account switching for multi-account users
  - Expose `currentAccount`, `switchAccount()`, `accounts[]`
- [ ] Create account resolution abstraction:
  - `/src/lib/account/resolver.ts`
  - `resolveAccountFromRequest(req)` - single source of truth for account resolution
  - Easy to migrate to subdomain-based later (just update this function)
- [ ] Update all data fetching to use account context:
  - Ensure all queries filter by current account
  - Prevent cross-account data leaks
  - Add account ID checks in all API routes

**URL Structure Examples:**
```
Admin pages:
  mytechnavigator.vercel.app/riverside/forms
  mytechnavigator.vercel.app/riverside/sessions
  mytechnavigator.vercel.app/riverside/settings

Public pages:
  mytechnavigator.vercel.app/riverside/food-permit-form
  mytechnavigator.vercel.app/testorg/customer-survey
```

#### 5.2 Public Form Pages
- [ ] Create public-facing form page: `/[accountSlug]/[formSlug]`
  - Loads form by slug and account slug
  - Only shows published forms
  - Displays form for end users to fill out (future enhancement)
  - Shows phone number to call for voice-based filling
- [ ] Create form landing page:
  - Form title and description
  - Instructions for calling and voice interaction
  - Phone number prominently displayed
  - Accessibility information
  - Clean, minimal design
- [ ] Style public pages differently from admin pages:
  - Minimal navigation (no account admin menu)
  - Focus on accessibility
  - Clear call-to-action
  - Public layout component separate from admin layout

#### 5.3 Account Slug Management
- [ ] **Slug Validation**:
  - Enforce slug rules (alphanumeric, lowercase, hyphens allowed, no special chars)
  - Check uniqueness when creating/updating slug
  - Reserved slugs: `admin`, `api`, `auth`, `public`, `assets`, `_next`
  - Minimum length: 3 characters
  - Maximum length: 50 characters
- [ ] **Slug Change Flow**:
  - Warn user about changing slug (breaks existing links)
  - Require confirmation
  - Update slug in database
  - Show old URLs → new URLs mapping

#### 5.4 Account Switcher UI
- [ ] Build account switcher component:
  - Dropdown in top navigation showing current account
  - List all accounts user belongs to
  - Click to switch accounts
  - Redirects to same page in new account context (if exists)
- [ ] Handle account switching:
  - Update URL from `/oldaccount/forms` → `/newaccount/forms`
  - Persist last-used account in localStorage or cookie
  - Redirect to account's dashboard if target page doesn't exist

#### 5.5 Multi-tenancy Testing
- [ ] Create test accounts with different slugs
- [ ] Test data isolation:
  - User in Account A cannot see Account B's data
  - Forms from Account A don't appear in Account B
  - Sessions are properly isolated
  - API endpoints enforce account filtering
- [ ] Test path-based routing:
  - Access `/riverside/forms` loads correct account
  - Access `/invalidaccount/forms` shows 404
  - Account slug is case-insensitive
- [ ] Test with multiple accounts:
  - User belongs to Account A and Account B
  - Can switch between accounts via account switcher
  - Data updates in correct account
  - Sessions remain isolated

#### 5.6 Future Subdomain Migration Preparation
- [ ] Document subdomain migration plan in `/docs/SUBDOMAIN_MIGRATION.md`:
  - When to migrate (after custom domain acquired, user base grows)
  - What needs to change (middleware, URL generation, redirects)
  - How to run both path-based and subdomain simultaneously (transition period)
- [ ] Design URL helpers to abstract routing:
  ```typescript
  // lib/urls.ts
  export function getAccountUrl(accountSlug: string, path: string) {
    // Phase 1: return `/${accountSlug}${path}`
    // Future: return `https://${accountSlug}.domain.com${path}`
  }

  export function getFormUrl(accountSlug: string, formSlug: string) {
    return getAccountUrl(accountSlug, `/${formSlug}`)
  }
  ```
- [ ] Use URL helpers consistently throughout codebase
  - No hardcoded path construction
  - All links use `getAccountUrl()` or similar helpers
  - Easy to switch to subdomain by updating one function

### Deliverables
- Path-based routing middleware working
- Public form landing pages
- Account switcher UI for multi-account users
- Data isolation enforced and tested
- URL abstraction layer for future subdomain migration

### Success Criteria
- Can access forms via path: `/riversidehealth/forms`
- Each account's data is completely isolated
- Invalid account slugs show 404 page
- Users in multiple accounts can switch between them
- Public form pages are accessible without authentication at `/{accountSlug}/{formSlug}`
- No CORS issues (single domain)
- Codebase is ready for subdomain migration with minimal changes

---

## Phase 6: Platform Admin Tools (Week 14-15)

### Goals
- Build comprehensive platform admin portal
- Add monitoring and analytics
- Create audit logs
- Implement user impersonation for support

### Tasks

#### 6.1 Enhanced Platform Admin Dashboard
- [ ] **Admin Home**: `/admin`
  - Platform-wide statistics:
    - Total accounts
    - Total users
    - Total forms
    - Total sessions (last 30 days)
  - Recent activity feed
  - System health indicators
- [ ] **Accounts Management**: `/admin/accounts`
  - Already created in Phase 2, enhance with:
    - Advanced search and filtering
    - Bulk actions (suspend multiple accounts)
    - Export account list to CSV
- [ ] **Users Overview**: `/admin/users`
  - List all users across all accounts
  - Show which accounts each user belongs to
  - Filter by role, account, signup date
  - Search by email or name

#### 6.2 Account Analytics
- [ ] Create analytics dashboard: `/admin/analytics`
  - Usage metrics:
    - Forms created per week
    - Sessions per week
    - Active users per account
  - Growth metrics:
    - New accounts per month
    - New users per month
  - Performance metrics:
    - Average session duration
    - Form completion rates (future)
- [ ] Add charts and visualizations:
  - Line charts for trends
  - Bar charts for comparisons
  - Use library like Recharts or Chart.js

#### 6.3 Audit Logging
- [ ] Create audit log system:
  - Log important actions:
    - Account created/updated/suspended
    - User invited/role changed/removed
    - Form published
    - Phone number added/removed
    - Prompt updated
  - Store in `audit_logs` table:
    - `id, account_id, user_id, action, entity_type, entity_id, metadata_json, created_at`
- [ ] Create audit log viewer: `/admin/audit-logs`
  - List all audit logs
  - Filter by account, user, action, date range
  - Export to CSV
- [ ] Add audit log hooks to all critical operations:
  - Update repository methods to create audit logs
  - Include before/after values for updates

#### 6.4 User Impersonation (for Support)
- [ ] **Impersonation feature** (use with caution):
  - Platform admin can impersonate any user
  - Creates special session that indicates impersonation
  - All actions logged with "impersonated by admin X"
  - Visible banner: "You are viewing as [User Name]"
  - Exit impersonation button
- [ ] Create impersonation API:
  - `/api/admin/impersonate` - Start impersonation
  - `/api/admin/exit-impersonation` - End impersonation
- [ ] Security measures:
  - Log all impersonation sessions in audit log
  - Time limit on impersonation (auto-expire after 1 hour)
  - Cannot impersonate another platform admin
  - Require re-authentication before impersonating

#### 6.5 System Monitoring
- [ ] **Health Check Endpoint**: `/api/health`
  - Check database connection (Neon)
  - Check Clerk API connectivity
  - Check Twilio API (basic test)
  - Return status: healthy/degraded/down
- [ ] **Error Tracking Integration** (optional):
  - Set up Sentry or similar for error tracking
  - Track errors by account
  - Alert on critical errors

### Deliverables
- Comprehensive platform admin portal
- Analytics dashboard with key metrics
- Audit logging system
- User impersonation for support
- System health monitoring

### Success Criteria
- Platform admin can view system-wide analytics
- All critical actions are logged in audit log
- Platform admin can impersonate users for support
- Health check endpoint reports system status
- Admin tools are intuitive and easy to use

---

## Phase 7: Testing & Polish (Week 16-18)

### Goals
- Comprehensive testing of all features
- Fix bugs and edge cases
- Polish UI/UX
- Performance optimization
- Security review

### Tasks

#### 7.1 Functional Testing
- [ ] **Authentication & Authorization**:
  - Test login/logout with Clerk (Email OTP and SMS OTP)
  - Test multi-organization access
  - Test role-based permissions (admin vs member)
  - Test user invitation flow end-to-end (Clerk orgs)
  - Test user cannot access other accounts' data
- [ ] **Form Builder**:
  - Test creating forms with all field types
  - Test form versioning
  - Test publishing workflow
  - Test AI prompt generation
  - Test editing published forms (creates new version)
- [ ] **Voice Agent**:
  - Test calling each form's phone number
  - Test voice agent collects correct data
  - Test session tracking
  - Test error scenarios (hang up, invalid input)
- [ ] **Subdomain Routing**:
  - Test accessing forms via subdomain
  - Test invalid subdomains
  - Test subdomain changes

#### 7.2 Edge Case Testing
- [ ] What happens if user deletes a form with active sessions?
- [ ] What happens if user changes subdomain?
- [ ] What happens if user removes a phone number that's receiving calls?
- [ ] What happens if two users edit the same form simultaneously?
- [ ] What happens if AI prompt generation fails?
- [ ] What happens if Clerk is down?
- [ ] What happens if Twilio credentials are invalid?
- [ ] What happens if Clerk webhook fails to sync to database?

#### 7.3 Performance Testing
- [ ] Load test with multiple concurrent accounts
- [ ] Test form builder with large number of fields
- [ ] Test session list page with thousands of sessions
- [ ] Optimize slow database queries:
  - Add indexes where needed
  - Use pagination for large lists
  - Implement caching for frequently accessed data
- [ ] Optimize page load times:
  - Code splitting for form builder
  - Lazy load components
  - Optimize images and assets
- [ ] Test on mobile devices (tablet minimum)

#### 7.4 Security Review
- [ ] **Penetration Testing** (basic):
  - Test for SQL injection (should be prevented by ORM)
  - Test for XSS vulnerabilities
  - Test for CSRF (should be prevented by Next.js)
  - Test for unauthorized access (bypass authentication)
  - Test for privilege escalation (regular user accessing admin features)
- [ ] **Data Security**:
  - Verify RLS policies are working
  - Verify sensitive data is encrypted (Twilio credentials)
  - Verify no data leaks between accounts
- [ ] **Code Review**:
  - Review all API endpoints for authorization checks
  - Review all database queries for account filtering
  - Review environment variable usage (no hardcoded secrets)

#### 7.5 UI/UX Polish
- [ ] **Accessibility Review**:
  - Test with screen reader
  - Ensure all interactive elements are keyboard accessible
  - Check color contrast (WCAG AA)
  - Add ARIA labels where needed
- [ ] **Visual Polish**:
  - Consistent spacing and typography
  - Responsive design on all screen sizes
  - Loading states for all async operations
  - Error messages are clear and helpful
  - Success messages after actions
- [ ] **User Flows**:
  - Walk through all critical user flows
  - Remove unnecessary steps
  - Add helpful tooltips and guidance
  - Improve onboarding for new users

#### 7.6 Bug Fixes
- [ ] Create bug tracking system (GitHub Issues or similar)
- [ ] Prioritize bugs: Critical, High, Medium, Low
- [ ] Fix all critical and high-priority bugs
- [ ] Document known issues for medium/low priority bugs

### Deliverables
- Comprehensive test coverage
- All critical bugs fixed
- Polished UI/UX
- Performance optimizations applied
- Security review completed

### Success Criteria
- All functional tests pass
- No critical bugs remaining
- Pages load in < 2 seconds
- Security vulnerabilities addressed
- Accessibility standards met (WCAG 2.1 AA)

---

## Phase 8: Deployment & Launch (Week 19-20)

### Goals
- Deploy to production environment
- Set up monitoring and alerts
- Create documentation
- Launch platform

### Tasks

#### 8.1 Production Deployment
- [ ] **Environment Variables**:
  - Set all production environment variables in Vercel
  - Ensure secrets are secure (use Vercel secrets)
  - Double-check all API keys and tokens
- [ ] **Database (Neon)**:
  - Run database migrations on production Neon instance
  - Run seed script to create Riverside County account (after Clerk org created)
  - Set up automated backups (Neon Pro, or use pg_dump manually)
  - Configure connection pooling
- [ ] **Clerk**:
  - Configure production Clerk application
  - Set allowed origins and redirect URLs
  - Configure production webhooks
  - Test login flow on production (Email OTP and SMS OTP)
  - Verify organization creation and invitations work
- [ ] **Vercel**:
  - Deploy main branch to production
  - Configure custom domain (`mytechnavigator.vercel.app`)
  - Set up wildcard subdomain routing
  - Enable automatic deployments for main branch
- [ ] **Railway**:
  - Deploy background jobs to Railway production
  - Configure environment variables
  - Test connectivity to production database

#### 8.2 DNS & Domain Configuration
- [ ] **For mytechnavigator.vercel.app**:
  - Verify Vercel subdomain is active
  - Test wildcard subdomains work
  - Configure SSL certificates (auto via Vercel)
- [ ] **For future mytechnavigator.ai**:
  - Document DNS records needed
  - Create checklist for when domain is purchased

#### 8.3 Monitoring & Alerts
- [ ] Set up Vercel monitoring:
  - Enable Vercel Analytics
  - Monitor function execution times
  - Monitor error rates
- [ ] Set up Supabase monitoring:
  - Enable Supabase logs
  - Monitor database performance
  - Set up alerts for high CPU/memory usage
- [ ] Set up error tracking:
  - If using Sentry, configure production environment
  - Set up alert emails for critical errors
- [ ] Create uptime monitoring:
  - Use UptimeRobot or similar
  - Monitor main domain and health check endpoint
  - Alert via email/SMS if site is down

#### 8.4 Documentation
- [ ] **User Documentation**:
  - Getting Started guide
  - How to create an account (platform admin)
  - How to invite users
  - How to create and publish forms
  - How to add phone numbers
  - How to view sessions and transcripts
  - FAQ section
- [ ] **Developer Documentation**:
  - Setup instructions for local development
  - Database schema documentation
  - API endpoint documentation
  - Deployment process
  - Troubleshooting guide
- [ ] **Platform Admin Runbook**:
  - How to create new accounts
  - How to suspend accounts
  - How to handle support requests
  - Emergency procedures (site down, security incident)
  - Backup and restore procedures

#### 8.5 Launch Preparation
- [ ] **Final Testing**:
  - Test complete end-to-end flow on production
  - Test with real Twilio phone number (if available)
  - Test Clerk login (Email OTP and SMS OTP)
  - Test organization creation and user invitations
  - Verify all environment variables are correct
  - Verify Clerk webhooks are working
- [ ] **Create Launch Checklist**:
  - [ ] All services deployed and healthy
  - [ ] DNS configured correctly
  - [ ] SSL certificates active
  - [ ] Monitoring and alerts set up
  - [ ] Documentation complete
  - [ ] Seed data loaded (platform admin + Riverside County)
  - [ ] Support system ready (email, etc.)
- [ ] **Soft Launch**:
  - Launch to limited users first (just yourself + test users)
  - Monitor for issues
  - Fix any critical bugs
  - Gather initial feedback

#### 8.6 Post-Launch
- [ ] Monitor system for first 48 hours closely
- [ ] Address any issues that arise
- [ ] Gather feedback from initial users
- [ ] Plan for next phase of features (from Future Enhancements)

### Deliverables
- Platform deployed to production
- Monitoring and alerts configured
- Complete documentation
- Platform ready for users

### Success Criteria
- Platform is accessible at `mytechnavigator.vercel.app`
- Can create accounts and invite users on production
- Can create and publish forms on production
- Voice agent works with real phone numbers
- Monitoring alerts are functioning
- Documentation is complete and accurate

---

## Timeline Summary

| Phase | Description | Duration | Week |
|-------|-------------|----------|------|
| **Phase 0** | Setup & Infrastructure | 2 weeks | 1-2 |
| **Phase 1** | Database Schema & Auth | 2 weeks | 2-3 |
| **Phase 2** | Core Platform Features | 3 weeks | 4-6 |
| **Phase 3** | Form Builder | 3 weeks | 7-9 |
| **Phase 4** | Voice Agent Integration | 2 weeks | 10-11 |
| **Phase 5** | Subdomain Routing | 2 weeks | 12-13 |
| **Phase 6** | Platform Admin Tools | 2 weeks | 14-15 |
| **Phase 7** | Testing & Polish | 3 weeks | 16-18 |
| **Phase 8** | Deployment & Launch | 2 weeks | 19-20 |
| **Total** | | **~20 weeks** | **~5 months** |

**Note**: Timeline is an estimate. Some phases may overlap, and adjustments should be made based on actual progress.

---

## Risk Management

### Potential Risks & Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Clerk webhook sync failures | High | Medium | Implement retry logic; manual sync fallback; monitor webhooks |
| Form builder integration issues | High | Medium | Evaluate SurveyJS thoroughly; have backup plan for custom builder |
| Application-level access control gaps | Critical | Low | Thorough security testing; code review all API endpoints |
| Voice agent integration breaks | High | Low | Keep existing voice agent code as reference; test frequently |
| Performance with many accounts | Medium | Medium | Implement pagination and caching early; load test regularly |
| Scope creep | Medium | High | Stick to requirements doc; defer nice-to-haves to Phase 2 |

### Mitigation Strategies
- **Weekly check-ins**: Review progress and adjust timeline as needed
- **Blockers log**: Document any blockers immediately and prioritize resolution
- **MVP mindset**: Focus on core features first; polish and enhancements later
- **Testing throughout**: Don't wait until Phase 7 to start testing

---

## Success Metrics

### Launch Success Criteria
- [ ] Platform admin can create 5 test accounts successfully
- [ ] Each test account can create and publish at least 1 form
- [ ] Voice agent successfully handles 10 test calls across different forms
- [ ] No critical bugs or security vulnerabilities
- [ ] 99% uptime in first month
- [ ] All documentation complete and accurate

### Post-Launch Metrics (First 3 Months)
- **Adoption**: 5+ accounts created (beyond test accounts)
- **Usage**: 100+ sessions/calls handled
- **Reliability**: 99.5% uptime
- **Performance**: < 2 second page load times
- **Support**: < 24 hour response time to support requests

---

## Dependencies & Prerequisites

### Before Starting Phase 0
- [ ] Approve requirements document
- [ ] Confirm budget for services (Vercel, Neon, Clerk, Railway, Twilio, OpenAI)
- [ ] Set up accounts for all services
- [ ] Assign developer(s) to project

### External Dependencies
- **Clerk**: Free tier (100 organizations, 10,000 MAUs)
- **Vercel**: Deployment and hosting
- **Neon**: PostgreSQL database
- **Railway**: Background jobs
- **Twilio**: Phone numbers and voice API
- **OpenAI**: AI prompt generation

### Development Prerequisites
- Node.js 18+ and npm/yarn
- Git and GitHub access
- Access to all service accounts
- Local development environment

---

## Post-Launch Roadmap (Future Phases)

### Phase 2 Features (Months 6-9)
- Form-level permissions (granular access control)
- Webhook integrations (send data to external systems)
- Advanced analytics dashboard
- Additional user roles (Form Editor, Viewer, Analyst)
- Email notifications for sessions

### Phase 3 Features (Months 10-12)
- Evaluation system:
  - Transcript review UI
  - Session scoring
  - Human and AI reviews
  - Prompt optimization based on evals
- Programmatic phone number provisioning (Twilio API)
- Custom domains for accounts
- White-labeling and custom branding

### Phase 4+ (Year 2)
- API access for third-party integrations
- Mobile app for account management
- Advanced reporting and exports
- Multi-language support (beyond EN/ES)
- Payment/billing integration
- SOC 2 and HIPAA compliance initiatives

---

## Conclusion

This implementation plan provides a structured approach to building the platform over ~20 weeks. Each phase delivers working functionality that can be tested and validated. By following this plan, you'll have a fully functional multi-tenant platform with account management, form building, voice agent integration, and comprehensive admin tools.

**Next Steps**:
1. Review and approve this implementation plan
2. Set up development environment (Phase 0)
3. Begin Phase 1 (Database & Auth)
4. Schedule weekly check-ins to track progress

Good luck with the build! 🚀
