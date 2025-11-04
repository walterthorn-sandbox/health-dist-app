# Platform Requirements - Phase 1

## Executive Summary
Convert the existing single-form application into a multi-tenant platform where organizations can create accounts, build custom forms, and manage voice agent interactions. The platform will support user management with role-based access control, form versioning, and AI-powered voice agent prompt generation.

---

## 1. Core Platform Architecture

### 1.1 Multi-Tenancy Model
- **Phase 1 - Path-based tenancy**: Each account gets a unique slug used in URL paths (e.g., `mytechnavigator.vercel.app/riverside/...`)
- **Future - Subdomain-based tenancy**: Migration path to subdomain routing (e.g., `riverside.mytechnavigator.ai/...`)
- **Data isolation**: Strict data separation between accounts at the database level
- **Shared infrastructure**: Single codebase and infrastructure serving all tenants
- **Security consideration**: Architecture designed with future SOC 2 and HIPAA compliance in mind
- **Rationale for path-based Phase 1**:
  - No CORS complexity
  - No wildcard DNS setup required initially
  - Simpler local development
  - Faster MVP delivery
  - Easy migration to subdomain later (designed with abstraction layer)

### 1.2 Account Management
- **Account entity**: Top-level organizational unit
- **Account properties**:
  - Name
  - Slug (unique, user-configurable, used in URL paths)
  - Created date
  - Status (active, suspended, etc.)
  - Billing information (future enhancement)
- **Account limits**: No limits enforced in Phase 1 (unlimited forms, users, sessions per account)
- **URL Structure (Phase 1)**:
  - Admin pages: `/[accountSlug]/forms`, `/[accountSlug]/sessions`, `/[accountSlug]/settings`
  - Public pages: `/[accountSlug]/[formSlug]` (e.g., `/riverside/food-permit-form`)

---

## 2. Authentication & Authorization

### 2.1 Clerk Integration
**Recommendation**: Use **Clerk** with built-in Organizations feature.

**Why Clerk**:
- **Built for Next.js**: First-class App Router support with middleware and server components
- **Organizations included**: 100 free organizations (vs Auth0's 5-org limit on free tier)
- **Passwordless built-in**: Email OTP and SMS OTP out of the box
- **Excellent DX**: Pre-built UI components, React hooks, simple API
- **Generous free tier**: 10,000 MAUs free
- **Predictable pricing**: $25/month + $0.02/MAU after 10,000 (clearer than Auth0)
- **Works seamlessly with Neon**: Clean separation of auth (Clerk) and data (Neon)

**Tradeoffs Analysis**:

| Approach | Pros | Cons |
|----------|------|------|
| **Clerk Organizations (RECOMMENDED)** | - 100 free organizations<br>- Native Next.js integration<br>- Built-in user invitations<br>- Pre-built UI components<br>- RBAC included<br>- Excellent developer experience<br>- Simple pricing model | - No email magic links (only OTP)<br>- Newer service (less enterprise adoption)<br>- Cannot use your own Twilio for SMS |
| **Auth0 Organizations** | - Email magic links<br>- Can use your own Twilio<br>- Enterprise adoption<br>- Advanced auth features | - Only 5 orgs on free tier ⚠️<br>- More complex setup<br>- Less Next.js-specific<br>- Pricing less predictable |
| **Custom with NextAuth.js** | - Completely free<br>- Full control<br>- Self-hosted | - Build everything yourself<br>- No org management<br>- High maintenance<br>- Slower development |

**Implementation**: Clerk Organizations with organization metadata synced to Neon database.

### 2.2 User Management
- **User entity** (stored in Neon, synced from Clerk):
  - Email (unique across platform)
  - Name
  - Profile information
  - Clerk user ID (primary reference)
  - Created date
- **Multi-account membership**: Users can belong to multiple organizations in Clerk
- **Account-User relationship**: Managed in Clerk, synced to Neon for data queries

### 2.3 Role-Based Access Control (RBAC)

**Phase 1 Roles**:
- **Platform Admin**: Super-user role for platform operations
  - Create new accounts
  - Invite account admins
  - View all accounts (read-only)
  - Suspend/activate accounts
  - Access platform-wide analytics (future)

- **Account Admin**: Full control within their account
  - Invite users to account
  - Assign roles to users
  - Create/edit/delete forms
  - Manage phone numbers
  - View all sessions within account
  - Configure account settings

- **Account User** (Regular): Standard access within account
  - View published forms
  - View sessions for forms they have access to
  - Cannot invite users or modify account settings

**Future Roles** (documented for future planning):
- Form Editor: Can edit specific forms
- Form Viewer: Read-only access to specific forms
- Billing Admin: Manage billing and subscription
- Analyst: Access to analytics and reporting only

### 2.4 Permission Model
- **Phase 1**: Permissions at organization level using Clerk roles
- **Clerk roles map to platform roles**:
  - Clerk `org:admin` → Platform Admin or Account Admin
  - Clerk `org:member` → Account User (Regular)
- **Future**: Granular form-level permissions (user can edit Form A but only view Form B)

### 2.5 Passwordless Authentication
- **Email OTP**: User enters email, receives 6-digit code, enters code to login
- **SMS OTP**: User enters phone number, receives 6-digit code via SMS, enters code to login
- **Session management**: Handled automatically by Clerk
- **Security**: Clerk handles rate limiting, brute force protection, token expiration

---

## 3. Form Management

### 3.1 Form Entity
- **Form properties**:
  - Name
  - Description
  - Account ID (owner)
  - Created date
  - Updated date
  - Current version number
  - Published version number
  - Status: `draft` or `published`
  - Subdomain (inherited from account)
  - Associated phone number
  - Associated prompt (current version)

### 3.2 Form Builder UI
- **Visual drag-and-drop interface** for form creation
- **Supported field types**:
  - Short Text (single line)
  - Long Text (multi-line textarea)
  - Phone Number (with validation)
  - Email (with validation)
  - Date (date picker)
  - Dropdown (single select with custom options)
- **Field properties**:
  - Label
  - Field type
  - Required/optional
  - Placeholder text
  - Help text
  - Validation rules
  - Order/position
- **Form settings**:
  - Form title and description
  - Confirmation message
  - Notification settings (future)

### 3.3 Form Versioning & States

**Versioning Strategy**:
- **Simplified model**: Forms have `draft` vs `published` state
- **Draft state**: Work-in-progress, not publicly accessible
- **Published state**: Publicly accessible, locked from editing
- **Version history**: Each published version is persisted with timestamp
- **Version numbering**: Semantic versioning (v1, v2, v3, etc.)

**Publishing Workflow**:
1. User creates/edits form in draft state
2. User clicks "Publish"
3. System creates new version snapshot
4. System prompts: "Would you like AI to update the voice agent prompt for this form version?"
   - Yes: AI generates new prompt based on form changes
   - No: Keep existing prompt
5. Form becomes publicly accessible
6. Draft is locked; to make changes, user must create new draft from published version

**Version Persistence**:
- Old versions remain in database for historical reference
- Sessions are linked to specific form versions
- Users can view old versions (read-only)
- Users can roll back to a previous version (creates new version)

### 3.4 Form Access
- **Public URL**: `https://{account-subdomain}.accessibleformsapp.com/{form-slug}`
- **Only published forms** are accessible to end users
- **Draft forms** require authentication and appropriate permissions to view

---

## 4. Phone Number Management

### 4.1 Phone Number Assignment
- **Phase 1**: Manual provisioning
  - Account admins manually add phone number details to form
  - Phone number, Twilio SID, and credentials entered via UI
  - One phone number per form (1:1 relationship)
- **Future**: Programmatic provisioning via Twilio API
  - Platform automatically provisions phone numbers
  - Phone number pool management
  - Automatic assignment when form is published

### 4.2 Phone Number Entity
- **Properties**:
  - Phone number (E.164 format)
  - Form ID (owner)
  - Account ID (owner)
  - Twilio configuration:
    - Account SID
    - Auth token (encrypted)
    - Phone number SID
  - Status (active, inactive)
  - Provisioning method (manual, automatic)
  - Created date

### 4.3 Phone Number Requirements
- **Uniqueness**: Each phone number can only be associated with one form
- **Portability**: Platform admin can reassign phone numbers between forms (with confirmation)
- **Validation**: System validates phone number format and Twilio credentials before saving

---

## 5. Voice Agent & Prompt Management

### 5.1 Prompt Versioning Strategy

**Recommendation**: **Independent versioning** with form association.

**Tradeoffs Analysis**:

| Approach | Pros | Cons |
|----------|------|------|
| **Synchronized Versioning** (form v1 → prompt v1) | - Simpler mental model<br>- Clear 1:1 relationship<br>- Easier to understand history | - Can't A/B test prompts<br>- Must version form to update prompt<br>- Less flexibility for prompt optimization |
| **Independent Versioning (RECOMMENDED)** | - A/B test different prompts on same form<br>- Update prompts without form versioning<br>- Optimize voice agent independently<br>- Better for future eval system | - More complex data model<br>- Need UI to manage associations<br>- Harder to track which prompt with which form |

**Implementation**: Independent versioning with "active prompt" pointer per form.

**Associations & Traceability**:
- **Prompt ↔ Form Version**: Many-to-many relationship
  - A form version can have multiple prompts associated with it
  - A prompt version can be associated with multiple form versions
  - Each form version has one "active" prompt at any given time
- **Session ↔ Versions**: Each session/submission records:
  - Form version used (snapshot)
  - Prompt version used (snapshot)
  - This allows full traceability: "For submission X, what form and prompt were used?"
- **Viewing associations**:
  - From submission: View the exact form version and prompt version used
  - From form version: View all prompt versions ever associated with it
  - From prompt version: View all form versions it's been used with

### 5.2 Prompt Entity
- **Properties**:
  - Form ID (association)
  - Version number (auto-incrementing per form)
  - Prompt text (the actual system prompt)
  - Created date
  - Created by (user ID or "AI")
  - Generation method (AI-generated, manual, edited)
  - Status (active, inactive, archived)
  - Performance metrics (future: success rate, avg session length, etc.)

### 5.3 AI Prompt Generation
- **Initial prompt creation**: When form is first published, AI automatically generates initial prompt
- **Prompt update workflow** (on form version publish):
  1. System detects form changes
  2. System prompts user: "Form has changed. Update voice agent prompt?"
     - **Update with AI**: AI analyzes form changes and generates new prompt version
     - **Keep existing**: Current active prompt remains unchanged
     - **Edit manually**: User can manually edit prompt
  3. New prompt version is created and set as active
- **AI prompt generation logic**:
  - Analyzes form fields, types, and validation rules
  - Considers field order and required/optional status
  - Generates conversational prompt optimized for voice interaction
  - Includes data collection strategy and error handling
  - Maintains bilingual support (Spanish/English) as in current implementation

### 5.4 Prompt Management UI
- **View prompt history**: List of all prompt versions for a form
- **Compare versions**: Diff view between prompt versions
- **Activate prompt**: Set a specific version as active
- **Edit prompt**: Create new version by editing existing prompt
- **Test prompt**: (Future) Test prompt in sandbox environment

---

## 6. Session Management

### 6.1 Session Tracking
- **Session entity enhancements**:
  - Account ID (owner)
  - Form ID
  - Form version (snapshot)
  - Prompt version used
  - Phone number used
  - All existing session fields (transcript, collected data, etc.)

### 6.2 Session History
- Sessions are permanently associated with specific form and prompt versions
- Users can filter sessions by form version, date range, status
- Sessions remain accessible even after form is updated

---

## 7. Platform Administration

### 7.1 Platform Admin Portal
- **Account management**:
  - Create new account
  - View all accounts (list with search/filter)
  - Suspend/activate accounts
  - View account details (users, forms, sessions count)
- **User management**:
  - Invite account admin to new account
  - View all platform users (for support purposes)
  - Impersonate user (for debugging, with audit log)
- **System monitoring** (future):
  - Platform-wide analytics
  - System health metrics
  - Usage statistics

### 7.2 Account Admin Portal
- **User management**:
  - Invite users to account (via email)
  - Assign roles to users
  - Remove users from account
  - View user activity logs (future)
- **Form management**:
  - Create/edit/delete forms
  - Publish form versions
  - View form analytics (future)
- **Phone number management**:
  - Add phone numbers manually
  - Configure Twilio credentials
  - View phone usage statistics (future)
- **Account settings**:
  - Update account name
  - Configure subdomain
  - Branding customization (future)

---

## 8. Development & Deployment Strategy

### 8.1 Repository & Deployment Approach
**Strategy**: Fork existing codebase to new repository for platform development.

**Rationale**:
- Keeps existing single-form app operational during platform development
- Allows parallel development without risk to production app
- Clean separation of concerns
- Can reference original codebase during development

**Setup**:
- **New repository**: `health-dist-platform` (or similar name)
- **New Vercel project**: `mytechnavigator.vercel.app` (initially)
- **New Supabase database**: Fresh database instance for platform
- **New Railway app**: New instance for platform services
- **Auth0 configuration**: New Auth0 application/tenant for platform

### 8.2 Seed Data for Development
Create comprehensive seed data to enable testing and development:

**Seed Account**: "Riverside County Health District"
- Subdomain: `riversidehealth`
- Status: Active

**Seed Users**:
- Platform Admin user (your email)
- Account Admin user for Riverside County
- Regular user for testing permissions

**Seed Form**: "Food Establishment Permit Application"
- Based on existing form structure
- All fields from current implementation
- Status: Published (v1)
- Associated prompt: Current prompt logic from existing app

**Seed Phone Number**:
- Phone number configuration based on existing setup
- Twilio credentials (test/development)
- Associated with Food Establishment form

**Seed Data Script**:
- SQL script or database migration to populate initial data
- Can be run on fresh database instances
- Includes all necessary relationships and FK constraints

### 8.3 Platform Admin Setup
- Create platform admin user account in Auth0
- Configure platform admin role and permissions
- Set up admin portal access
- Create initial Auth0 Organization for Riverside County

### 8.4 Existing Application
- **Original app remains unchanged**: Continue running in production
- **No migration needed**: Existing sessions and data stay in original app
- **Reference for testing**: Use existing app as reference for feature parity
- **Future consideration**: Once platform is stable, can optionally migrate existing customers

---

## 9. Technical Implementation Notes

### 9.1 Database Schema
- Continue using Supabase (PostgreSQL)
- Implement Row Level Security (RLS) for multi-tenancy
- Add tables:
  - `accounts`
  - `users` (enhanced)
  - `account_users` (junction table with roles)
  - `forms`
  - `form_versions`
  - `form_fields`
  - `prompts`
  - `phone_numbers`
  - `sessions` (enhanced with account/version tracking)

### 9.2 Frontend Framework
- **Keep existing stack**: Next.js / React / TypeScript
- **Add form builder library**: Consider React-based form builders:
  - **Option 1**: Build custom with `react-beautiful-dnd` for drag-and-drop
  - **Option 2**: Use form builder library like `Formio.js`, `React Form Builder`, or `SurveyJS`
  - **Recommendation**: Start with custom implementation for full control, given specific accessibility requirements

### 9.3 Subdomain Routing
- **DNS configuration**: Wildcard DNS record for `*.accessibleformsapp.com`
- **Next.js middleware**: Route requests based on subdomain
- **Account resolution**: Extract subdomain from request, load account context
- **404 handling**: Invalid subdomain → friendly error page

### 9.4 Security Considerations
- **Data isolation**: RLS policies ensuring users only see their account data
- **Credential encryption**: Encrypt Twilio credentials at rest
- **Audit logging**: Log all sensitive operations (user invites, role changes, form publishes)
- **Rate limiting**: Per-account rate limits on API calls
- **CORS policies**: Strict CORS for subdomain access
- **Future compliance**: Architecture supports future SOC 2, HIPAA requirements

---

## 10. Future Enhancements (Post-Phase 1)

### 10.1 Evaluation System
- **Transcript management**: Save and view call transcripts per session
- **Session scoring**: Automated scoring based on success criteria
- **Human review**: UI for manual session review and annotation
- **AI review**: Automated review using LLMs to evaluate quality
- **Prompt optimization**: Use eval data to suggest prompt improvements
- **A/B testing**: Compare multiple prompt versions with analytics

### 10.2 Advanced Features
- **Form-level permissions**: Granular RBAC for individual forms
- **Additional roles**: Form Editor, Viewer, Analyst
- **Webhook integrations**: Send form submissions to external systems
- **Custom domains**: Allow accounts to use their own domains
- **White-labeling**: Custom branding per account
- **Analytics dashboard**: Session metrics, completion rates, user insights
- **API access**: REST API for programmatic form/session access
- **Notification system**: Email/SMS notifications for sessions
- **Multilingual forms**: Support for additional languages beyond EN/ES
- **Payment integration**: Billing and subscription management

### 10.3 Phone Number Management
- **Automatic provisioning**: Provision Twilio numbers via API
- **Phone number pooling**: Share numbers across forms with routing
- **Number porting**: Import existing phone numbers
- **Geographic preferences**: Choose area code/region for numbers
- **Usage analytics**: Call volume, duration, costs per form

---

## 11. Success Criteria

### 11.1 Phase 1 Completion
- [ ] Platform admin can create accounts and invite account admins
- [ ] Account admins can invite users with appropriate roles
- [ ] Users can belong to multiple accounts with different roles
- [ ] Account admins can create forms using form builder UI
- [ ] Forms support all specified field types
- [ ] Forms can be saved as draft or published
- [ ] Published forms are version-controlled
- [ ] AI generates initial prompts for published forms
- [ ] AI can update prompts when forms change (with user approval)
- [ ] Phone numbers can be manually added to forms
- [ ] Each account has unique subdomain routing
- [ ] Riverside County Health District account migrated successfully
- [ ] Existing form and phone number migrated and functional
- [ ] Sessions are tracked with form/prompt version information
- [ ] Auth0 integration with Organizations is functional
- [ ] Data isolation between accounts is enforced
- [ ] All sensitive credentials are encrypted

### 11.2 Non-Functional Requirements
- **Performance**: Form builder loads in <2 seconds
- **Uptime**: 99.5% uptime SLA
- **Security**: Pass security audit (penetration testing recommended)
- **Scalability**: Support 100+ accounts, 1000+ forms in Phase 1
- **Accessibility**: WCAG 2.1 AA compliance for all platform UIs
- **Mobile responsive**: Form builder works on tablets (phone optional)

---

## 12. Decisions & Answers

1. **Domain name**: `mytechnavigator.ai` (eventually) / `mytechnavigator.vercel.app` (initially)
2. **Authentication**: Clerk (free tier supports up to 100 organizations, 10,000 MAUs)
3. **Database**: Neon (PostgreSQL)
4. **Twilio account structure**: Single Twilio account for entire platform (voice calls only; SMS OTP handled by Clerk)
5. **Billing model**: No monetization or account limits in Phase 1
6. **Form builder library**: Evaluate existing libraries (see Section 13.6 for recommendations)
7. **Prompt AI model**: Continue with OpenAI; explore cost optimization in future phases
8. **Backup strategy**: Defer to future phase
9. **Support system**: Defer to future phase

---

## 13. Additional Recommendations

### 13.1 Onboarding Flow
Consider building a streamlined onboarding experience:
1. New account admin receives invite email
2. Click link → Auth0 signup/login
3. Welcome wizard:
   - Set account subdomain
   - Create first form (guided tutorial)
   - Add phone number (if ready)
   - Publish form and generate prompt
   - Test call walkthrough

### 13.2 Documentation
- **User documentation**:
  - Account admin guide
  - Form builder tutorial
  - Voice agent best practices
- **Developer documentation**:
  - API documentation (for future)
  - Webhook documentation (for future)
- **Platform admin runbook**:
  - Account creation process
  - Troubleshooting guide
  - Emergency procedures

### 13.3 Testing Strategy
- **Unit tests**: All business logic
- **Integration tests**: Auth0, Twilio, database
- **End-to-end tests**: Critical user flows (form creation, publishing, phone calls)
- **Load testing**: Simulate multiple concurrent accounts/calls
- **Security testing**: Penetration testing, vulnerability scanning

### 13.4 Monitoring & Observability
- **Application monitoring**: Error tracking (Sentry, etc.)
- **Performance monitoring**: Response times, database queries
- **Business metrics**: Accounts created, forms published, sessions completed
- **Alerting**: Critical errors, downtime, rate limit breaches

### 13.5 Future Subdomain Migration

**When to Migrate**: Consider migrating from path-based to subdomain-based routing when:
- Auth0 tier is upgraded (beyond 5 organizations limit)
- Custom domain (`mytechnavigator.ai`) is acquired
- User base grows beyond initial pilot customers
- White-labeling becomes important for customer branding

**Migration Complexity**: 3-6 days of development + testing

**What Changes**:
1. **Middleware**: Update account resolution from path parsing to subdomain extraction
2. **URL Generation**: Update URL helper functions to use subdomains
3. **Redirects**: Add redirects from old path-based URLs to new subdomain URLs
4. **Auth0**: Update callback URLs to support wildcard subdomains
5. **DNS**: Configure wildcard DNS (`*.mytechnavigator.ai`)

**Migration Strategy**:
- Phase 1: Add subdomain support alongside path-based (both work)
- Phase 2: Redirect path-based URLs to subdomain URLs
- Phase 3: Deprecate path-based routing (with grace period)

**Preparation in Phase 1**:
- Use URL helper abstraction layer (`getAccountUrl()`, `getFormUrl()`)
- No hardcoded path construction in codebase
- Document migration plan in `/docs/SUBDOMAIN_MIGRATION.md`

### 13.6 Form Builder Library Recommendations

**Evaluation Criteria**:
- React/Next.js compatibility
- Accessibility support (WCAG 2.1 AA)
- Field type flexibility
- Drag-and-drop interface
- Active maintenance and community
- License compatibility
- Customization capabilities

**Top Options**:

| Library | Pros | Cons | Recommendation |
|---------|------|------|----------------|
| **Form.io** | - Comprehensive form builder<br>- JSON schema-based<br>- Good accessibility<br>- Active development | - Can be complex<br>- Enterprise version is paid<br>- Heavier bundle size | Good for complex forms |
| **SurveyJS** | - Modern UI<br>- Excellent documentation<br>- Multiple themes<br>- Free for commercial use | - Survey-focused (may need adaptation)<br>- Limited phone-specific features | Solid choice, needs customization |
| **React Hook Form + Custom Builder** | - Lightweight<br>- Full control<br>- Excellent performance<br>- Use with DnD Kit for drag-drop | - More development time<br>- Need to build UI from scratch | Best for long-term flexibility |
| **Formik + Form Builder UI** | - Popular React form library<br>- Good validation<br>- Can add custom builder on top | - No built-in builder<br>- Would need significant custom work | Not recommended |
| **react-form-builder2** | - Open source<br>- Drag-and-drop out of box<br>- Simple to integrate | - Less active maintenance<br>- Limited customization<br>- Older codebase | Quick start but risky long-term |

**Recommended Approach**:
1. **Quick MVP**: Start with **SurveyJS** for rapid development (1-2 weeks to integrate)
2. **Long-term**: Plan to build custom builder with **React Hook Form + DnD Kit** if SurveyJS proves limiting (8-12 weeks)

**Reasoning**:
- SurveyJS gets you to market fastest with good UX
- Accessibility support is built-in
- JSON schema output can be migrated to custom solution later
- Free commercial license

---

## Document Version
- **Version**: 1.3
- **Date**: 2025-11-01
- **Status**: Updated with Clerk authentication
- **Changes**:
  - v1.0: Initial requirements document
  - v1.1: Updated Section 5.1 with prompt-form-submission associations; Updated Section 8 with fork strategy and seed data approach; Updated Section 12 with answers to open questions; Added Section 13.5 with form builder recommendations
  - v1.2: Changed from subdomain-based to path-based routing for Phase 1 (Sections 1.1, 1.2); Added Section 13.5 for future subdomain migration plan; Updated terminology from "subdomain" to "slug" throughout
  - v1.3: Replaced Auth0 with Clerk for authentication (Section 2); Updated to use Neon database instead of Supabase; Added passwordless authentication details (Section 2.5); Updated decisions (Section 12)
- **Next Review**: Before implementation begins

---

## Appendix: Glossary

- **Account**: Top-level organizational entity; represents a customer/organization
- **Account Slug**: Unique identifier for account used in URLs (e.g., `riverside` in `/riverside/forms`)
- **Form**: A customizable data collection interface with voice agent support
- **Form Version**: Snapshot of a form at time of publishing
- **Draft**: Unpublished, editable form state
- **Published**: Live, publicly accessible form state
- **Prompt**: System instructions for voice agent behavior
- **Session**: A single interaction between end user and voice agent
- **Platform Admin**: Super-user managing the entire platform
- **Account Admin**: User with full control within their account
- **Path-Based Routing**: URL structure using account slug in path (e.g., `/riverside/forms`)
- **Subdomain Routing**: Future URL structure using account slug as subdomain (e.g., `riverside.domain.com/forms`)
- **Multi-tenancy**: Architecture allowing multiple isolated accounts on shared infrastructure
