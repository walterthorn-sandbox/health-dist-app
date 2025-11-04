# Platform Planning Summary

**Project**: MyTechNavigator Platform
**Date**: 2025-11-01
**Status**: Requirements and Implementation Plan Complete

---

## Documents Created

### 1. [PLATFORM_REQUIREMENTS.md](PLATFORM_REQUIREMENTS.md)
**Version**: 1.2
**Purpose**: Comprehensive platform requirements document

**Key Sections**:
- Multi-tenant architecture (path-based routing for Phase 1)
- Auth0 Organizations integration
- Account and user management with RBAC
- Form builder with versioning
- Voice agent with AI prompt generation
- Phone number management
- Session tracking with full traceability

**Key Decisions**:
- Path-based routing (`/riverside/forms`) instead of subdomains for Phase 1
- **Clerk** for authentication (100 free organizations, 10,000 MAUs)
- **Neon** for PostgreSQL database
- Passwordless authentication via Email OTP and SMS OTP
- SurveyJS for form builder (recommended)
- Single Twilio account for platform (voice calls only)
- No account limits in Phase 1
- Fork existing codebase, don't migrate data

### 2. [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)
**Version**: 1.0
**Purpose**: 8-phase implementation plan with detailed task breakdown

**Timeline**: ~20 weeks (5 months)

**Phases**:
1. **Phase 0** (Week 1-2): Setup & Infrastructure
2. **Phase 1** (Week 2-3): Database Schema & Auth
3. **Phase 2** (Week 4-6): Core Platform Features
4. **Phase 3** (Week 7-9): Form Builder
5. **Phase 4** (Week 10-11): Voice Agent Integration
6. **Phase 5** (Week 12-13): Path-Based Routing & Multi-tenancy
7. **Phase 6** (Week 14-15): Platform Admin Tools
8. **Phase 7** (Week 16-18): Testing & Polish
9. **Phase 8** (Week 19-20): Deployment & Launch

### 3. [docs/SUBDOMAIN_MIGRATION.md](docs/SUBDOMAIN_MIGRATION.md)
**Version**: 1.0
**Purpose**: Future migration plan from path-based to subdomain routing

**Key Points**:
- Migration effort: 3-6 days when ready
- Triggers: Auth0 upgrade, custom domain, white-labeling needs
- Preparation: Use URL helpers and abstraction layer from day 1
- Strategy: Dual support → redirects → grace period → deprecation

---

## Architecture Overview

### Multi-Tenancy (Phase 1)
```
URL Structure:
  Admin: mytechnavigator.vercel.app/[accountSlug]/forms
  Public: mytechnavigator.vercel.app/[accountSlug]/[formSlug]

Account Resolution:
  Extract slug from URL path → Database lookup → Inject context

Data Isolation:
  Application-level access control
  All queries filtered by account ID from Clerk session
```

### Future Subdomain Migration
```
URL Structure:
  Admin: [accountSlug].mytechnavigator.ai/forms
  Public: [accountSlug].mytechnavigator.ai/[formSlug]

Account Resolution:
  Extract slug from subdomain → Database lookup → Inject context

Migration Trigger:
  When custom domain acquired + user base grows beyond initial pilot
```

---

## Database Schema (High-Level)

```
accounts
  ├─ users (many-to-many via account_users)
  ├─ forms
  │   ├─ form_versions
  │   │   └─ form_fields
  │   └─ prompts (many-to-many via form_version_prompts)
  ├─ phone_numbers
  └─ sessions
```

**Key Relationships**:
- Users can belong to multiple accounts (many-to-many)
- Forms belong to one account (one-to-many)
- Forms have versions (one-to-many)
- Form versions have prompts (many-to-many)
- Sessions track exact form version + prompt version used

---

## Technology Stack

### Infrastructure
- **Hosting**: Vercel
- **Database**: Neon (PostgreSQL)
- **Background Jobs**: Railway
- **Auth**: Clerk (Organizations feature)
- **Voice**: Twilio + OpenAI

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Form Builder**: SurveyJS (recommended)
- **Styling**: Tailwind CSS (assumed from existing app)

### Backend
- **API**: Next.js API Routes
- **Database ORM**: Prisma (recommended for Neon)
- **Auth**: @clerk/nextjs

---

## User Roles & Permissions

### Platform Admin
- Create accounts
- Invite account admins
- View all accounts (read-only)
- Suspend/activate accounts
- Impersonate users (for support)

### Account Admin
- Manage users in their account
- Create/edit/delete forms
- Manage phone numbers
- View all sessions
- Configure account settings

### Account User (Regular)
- View published forms
- View sessions (filtered by access)
- Cannot manage users or account settings

---

## Key Features

### Form Builder
- Drag-and-drop interface (SurveyJS)
- Field types: short text, long text, phone, email, date, dropdown
- Draft vs Published state
- Version history with rollback
- AI-generated prompts for voice agent

### Voice Agent
- Dynamic prompt loading from database
- Bilingual support (English/Spanish)
- Session tracking with full traceability
- Prompt versioning independent of form versioning

### Phone Numbers
- Manual provisioning (Phase 1)
- One phone number per form
- Twilio configuration stored encrypted
- Future: Automatic provisioning via Twilio API

### Sessions
- Full transcript saved
- Collected form data
- Associated with specific form version + prompt version
- Filterable by account, form, date range

---

## Seed Data (Development)

### Account
- **Name**: Riverside County Health District
- **Slug**: `riverside`
- **Status**: Active

### Users
- Platform Admin (your email)
- Account Admin for Riverside County
- Regular user for testing

### Form
- **Name**: Food Establishment Permit Application
- **Status**: Published (v1)
- **Fields**: Based on existing app

### Phone Number
- Existing phone number from current app
- Associated with Food Establishment form

---

## Migration from Existing App

**Strategy**: Fork, don't migrate

1. Fork existing `health-dist-app` repo to `health-dist-platform`
2. Create new Vercel project, database, Railway app
3. Existing app continues running in production (untouched)
4. New platform starts fresh with seed data
5. Future: Optionally migrate existing customers when platform is stable

**Rationale**:
- No risk to production app
- Clean separation
- Can reference original codebase
- Parallel development

---

## Success Metrics

### Launch Success (End of Phase 8)
- Platform admin can create 5 test accounts
- Each account can create and publish forms
- Voice agent handles test calls successfully
- No critical bugs or security vulnerabilities
- 99% uptime in first month
- All documentation complete

### Post-Launch (First 3 Months)
- 5+ accounts created (beyond test accounts)
- 100+ sessions/calls handled
- 99.5% uptime
- < 2 second page load times
- < 24 hour support response time

---

## Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| Clerk webhook sync failures | Implement retry logic; manual sync fallback; monitor webhooks |
| Form builder integration issues | Evaluate SurveyJS thoroughly; have backup plan |
| Application-level access control gaps | Thorough security testing; code review all API endpoints |
| Scope creep | Stick to requirements; defer nice-to-haves |

---

## Future Enhancements (Post Phase 1)

### Phase 2 (Months 6-9)
- Form-level permissions (granular RBAC)
- Webhook integrations
- Advanced analytics dashboard
- Additional user roles
- Email notifications

### Phase 3 (Months 10-12)
- Evaluation system (transcript review, scoring, AI review)
- Programmatic phone number provisioning
- Custom domains per account
- White-labeling and custom branding

### Phase 4+ (Year 2)
- API access for third-party integrations
- Mobile app
- Multi-language support (beyond EN/ES)
- Payment/billing integration
- SOC 2 and HIPAA compliance

---

## Next Steps

1. **Review & Approve**
   - Review all three documents
   - Provide feedback or questions
   - Approve implementation plan

2. **Environment Setup**
   - Create Vercel, Neon, Railway, Clerk accounts
   - Gather all API keys and credentials

3. **Begin Phase 0** (Week 1-2)
   - Fork repository
   - Configure services
   - Set up local development environment

4. **Weekly Check-ins**
   - Track progress against plan
   - Identify blockers early
   - Adjust timeline as needed

---

## Questions?

If you have questions about:
- **Architecture**: See [PLATFORM_REQUIREMENTS.md](PLATFORM_REQUIREMENTS.md) Section 1
- **Specific Features**: See [PLATFORM_REQUIREMENTS.md](PLATFORM_REQUIREMENTS.md) Sections 2-7
- **Implementation Tasks**: See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) Phases 0-8
- **Subdomain Migration**: See [docs/SUBDOMAIN_MIGRATION.md](docs/SUBDOMAIN_MIGRATION.md)

---

## Document Status

| Document | Version | Status | Last Updated |
|----------|---------|--------|--------------|
| PLATFORM_REQUIREMENTS.md | v1.3 | ✅ Complete | 2025-11-01 |
| IMPLEMENTATION_PLAN.md | v1.1 | ✅ Complete | 2025-11-01 |
| docs/SUBDOMAIN_MIGRATION.md | v1.0 | ✅ Complete | 2025-11-01 |
| PLATFORM_SUMMARY.md | v1.1 | ✅ Complete | 2025-11-01 |

**Changelog**:
- v1.1 (2025-11-01): Updated all documents to use Clerk instead of Auth0; Changed database from Supabase to Neon; Added passwordless authentication details
- v1.0 (2025-11-01): Initial release with Auth0 and Supabase

**Ready to proceed**: Yes ✅

---

Good luck with the build! 🚀
