# GitHub Issues - Complete Task List

This document contains all tasks to be created as GitHub issues. Once the repository is pushed to GitHub, these can be created as actual issues.

---

## Phase 1: Basic Infrastructure (Week 1)

### Issue #1: Set up Next.js project with TypeScript and Tailwind
**Labels**: `phase-1`, `setup`, `enhancement`
**Description**: Initialize Next.js 14 project with TypeScript, Tailwind CSS, and App Router
**Acceptance Criteria**:
- [ ] Next.js 14 project created with App Router
- [ ] TypeScript configured
- [ ] Tailwind CSS installed and configured
- [ ] Project runs locally (`npm run dev`)
- [ ] Basic file structure created

**Commands**:
```bash
npx create-next-app@latest food-permit-app --typescript --tailwind --app
```

---

### Issue #2: Install and configure dependencies
**Labels**: `phase-1`, `setup`, `enhancement`
**Description**: Install all required npm packages for the project
**Acceptance Criteria**:
- [ ] All dependencies installed
- [ ] Package.json includes all required packages
- [ ] No dependency conflicts

**Dependencies**:
- @vercel/postgres
- ably
- ably/react
- openai
- twilio
- braintrust
- zod
- react-hook-form
- @hookform/resolvers

---

### Issue #3: Set up shadcn/ui component library
**Labels**: `phase-1`, `setup`, `enhancement`
**Description**: Initialize shadcn/ui and install base components
**Acceptance Criteria**:
- [ ] shadcn/ui initialized
- [ ] Base components installed (Button, Input, Form, Card, etc.)
- [ ] Components work correctly with TypeScript
- [ ] Styling matches Tailwind config

**Commands**:
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input form card label select
```

---

### Issue #4: Set up Vercel Postgres database
**Labels**: `phase-1`, `database`, `setup`
**Description**: Create and configure Vercel Postgres database
**Acceptance Criteria**:
- [ ] Vercel Postgres database created
- [ ] Environment variables configured
- [ ] Connection tested successfully
- [ ] Database schema SQL file created

**Files to create**:
- `sql/schema.sql`
- `lib/db.ts`

---

### Issue #5: Create database schema
**Labels**: `phase-1`, `database`, `enhancement`
**Description**: Implement database schema for sessions and applications tables
**Acceptance Criteria**:
- [ ] Sessions table created
- [ ] Applications table created
- [ ] All required fields included
- [ ] Foreign key relationships established
- [ ] Schema matches technical architecture

**Tables**:
- `sessions` (id, created_at, phone_number, status, channel_name)
- `applications` (id, tracking_id, session_id, created_at, submitted_at, establishment fields, owner fields, operating fields, submission_channel, raw_data)

---

### Issue #6: Create Zod validation schemas
**Labels**: `phase-1`, `enhancement`
**Description**: Define TypeScript/Zod schemas for form validation
**Acceptance Criteria**:
- [ ] Application schema defined
- [ ] Field-level validation rules
- [ ] Type exports for TypeScript
- [ ] Error messages configured

**File**: `lib/schema.ts`

---

### Issue #7: Create database utility functions
**Labels**: `phase-1`, `database`, `enhancement`
**Description**: Build helper functions for database operations
**Acceptance Criteria**:
- [ ] Connection helper created
- [ ] CRUD functions for applications
- [ ] CRUD functions for sessions
- [ ] Error handling implemented
- [ ] TypeScript types defined

**File**: `lib/db.ts`

---

### Issue #8: Build basic web form UI
**Labels**: `phase-1`, `frontend`, `enhancement`
**Description**: Create simple permit application web form
**Acceptance Criteria**:
- [ ] Form component created with all fields
- [ ] Mobile-responsive design
- [ ] Field validation with Zod
- [ ] Form submission handler
- [ ] Success/error states

**Files**:
- `components/forms/PermitForm.tsx`
- `app/apply/page.tsx`

**Fields**:
- Establishment name, address, phone, email
- Owner name, phone, email
- Establishment type, planned opening date

---

### Issue #9: Implement form submission API
**Labels**: `phase-1`, `backend`, `enhancement`
**Description**: Create API route to handle form submissions
**Acceptance Criteria**:
- [ ] POST endpoint created
- [ ] Request validation with Zod
- [ ] Data saved to database
- [ ] Tracking ID generated
- [ ] Success response returned
- [ ] Error handling implemented

**File**: `app/api/applications/route.ts`

---

### Issue #10: Create admin list view
**Labels**: `phase-1`, `frontend`, `enhancement`
**Description**: Build admin interface to view all applications
**Acceptance Criteria**:
- [ ] List view showing all applications
- [ ] Display: establishment name, date, tracking ID
- [ ] Basic filtering (by name, date)
- [ ] Pagination (if needed)
- [ ] Responsive design
- [ ] Link to detail view

**File**: `app/admin/page.tsx`

---

### Issue #11: Create admin detail view
**Labels**: `phase-1`, `frontend`, `enhancement`
**Description**: Build admin interface to view individual application
**Acceptance Criteria**:
- [ ] Detail view showing all application data
- [ ] Well-formatted display of all fields
- [ ] Back button to list view
- [ ] Responsive design

**File**: `app/admin/[id]/page.tsx`

---

### Issue #12: Add CSV export functionality
**Labels**: `phase-1`, `enhancement`
**Description**: Enable exporting applications to CSV from admin
**Acceptance Criteria**:
- [ ] Export button in admin list view
- [ ] All application data included
- [ ] Proper CSV formatting
- [ ] Download works in browser

---

### Issue #13: Phase 1 testing and validation
**Labels**: `phase-1`, `testing`
**Description**: Test basic web form end-to-end flow
**Acceptance Criteria**:
- [ ] Form submission works
- [ ] Data saves to database correctly
- [ ] Admin list shows submissions
- [ ] Admin detail shows correct data
- [ ] Validation works properly
- [ ] Error handling works

---

## Phase 2: Real-time Sync (Week 1-2)

### Issue #14: Set up Ably account and configuration
**Labels**: `phase-2`, `setup`, `realtime`
**Description**: Create Ably account and configure API keys
**Acceptance Criteria**:
- [ ] Ably account created
- [ ] App created in Ably dashboard
- [ ] API keys generated (root + client-only)
- [ ] Environment variables configured
- [ ] Connection tested

---

### Issue #15: Create Ably client utilities
**Labels**: `phase-2`, `realtime`, `enhancement`
**Description**: Set up Ably client configuration for server and client
**Acceptance Criteria**:
- [ ] Server-side Ably client created
- [ ] Client-side Ably provider configured
- [ ] Channel naming convention established
- [ ] TypeScript types defined

**File**: `lib/ably.ts`

---

### Issue #16: Implement session management system
**Labels**: `phase-2`, `backend`, `enhancement`
**Description**: Build session creation and management
**Acceptance Criteria**:
- [ ] Session creation API endpoint
- [ ] Unique session ID generation
- [ ] Ably channel creation per session
- [ ] Session status tracking
- [ ] Database operations

**File**: `app/api/session/route.ts`

---

### Issue #17: Build mobile session UI page
**Labels**: `phase-2`, `frontend`, `enhancement`
**Description**: Create mobile-optimized form view for real-time sync
**Acceptance Criteria**:
- [ ] Session page with dynamic route
- [ ] Form displays all fields (read-only initially)
- [ ] Mobile-responsive design
- [ ] Loading states
- [ ] Error handling for invalid session

**File**: `app/session/[id]/page.tsx`

---

### Issue #18: Integrate Ably real-time updates in mobile UI
**Labels**: `phase-2`, `frontend`, `realtime`, `enhancement`
**Description**: Connect mobile UI to Ably for real-time form updates
**Acceptance Criteria**:
- [ ] Ably React hooks integrated
- [ ] Subscribe to session channel
- [ ] Handle field-update messages
- [ ] Update form fields in real-time
- [ ] Visual feedback for updates
- [ ] Connection status indicator

---

### Issue #19: Create session update API endpoint
**Labels**: `phase-2`, `backend`, `enhancement`
**Description**: API endpoint to update session data and broadcast via Ably
**Acceptance Criteria**:
- [ ] POST endpoint created
- [ ] Update database
- [ ] Broadcast update via Ably
- [ ] Field validation
- [ ] Error handling

**File**: `app/api/session/[id]/update/route.ts`

---

### Issue #20: Build test endpoint for simulating updates
**Labels**: `phase-2`, `testing`, `enhancement`
**Description**: Create test page to manually trigger field updates
**Acceptance Criteria**:
- [ ] Test UI created
- [ ] Can select session ID
- [ ] Can select field and enter value
- [ ] Triggers update API
- [ ] Shows success/error feedback

**File**: `app/test-sync/page.tsx`

---

### Issue #21: Add progress indicator to mobile UI
**Labels**: `phase-2`, `frontend`, `enhancement`
**Description**: Show visual progress as fields are filled
**Acceptance Criteria**:
- [ ] Progress bar component
- [ ] Updates as fields are completed
- [ ] Shows field count (e.g., "3 / 9 fields")
- [ ] Visual highlighting of current field

---

### Issue #22: Phase 2 testing and validation
**Labels**: `phase-2`, `testing`
**Description**: Test real-time sync functionality
**Acceptance Criteria**:
- [ ] Session creation works
- [ ] Mobile UI loads correctly
- [ ] Real-time updates work (<1 sec latency)
- [ ] Multiple sessions don't interfere
- [ ] Reconnection works after disconnect
- [ ] Error states handled properly

---

## Phase 3: Voice Integration (Week 2-3)

### Issue #23: Set up Twilio account and phone number
**Labels**: `phase-3`, `setup`, `voice`
**Description**: Create Twilio account and provision phone number
**Acceptance Criteria**:
- [ ] Twilio account created
- [ ] Phone number purchased
- [ ] Account SID and Auth Token saved
- [ ] Environment variables configured

---

### Issue #24: Set up OpenAI Realtime API access
**Labels**: `phase-3`, `setup`, `voice`
**Description**: Configure OpenAI API access for Realtime API
**Acceptance Criteria**:
- [ ] OpenAI API key obtained
- [ ] Realtime API access confirmed
- [ ] Environment variables configured
- [ ] Test connection successful

---

### Issue #25: Set up Braintrust account
**Labels**: `phase-3`, `setup`, `monitoring`
**Description**: Create Braintrust account for AI evaluation
**Acceptance Criteria**:
- [ ] Braintrust account created
- [ ] Project created
- [ ] API key obtained
- [ ] Environment variables configured

---

### Issue #26: Create Braintrust logging utilities
**Labels**: `phase-3`, `monitoring`, `enhancement`
**Description**: Build helper functions for logging to Braintrust
**Acceptance Criteria**:
- [ ] Logging helper created
- [ ] Log conversation turns
- [ ] Log field extractions
- [ ] Log latency metrics
- [ ] Error logging

**File**: `lib/braintrust.ts`

---

### Issue #27: Create Twilio webhook handler
**Labels**: `phase-3`, `backend`, `voice`, `enhancement`
**Description**: Build API endpoint to handle incoming Twilio calls
**Acceptance Criteria**:
- [ ] POST endpoint created
- [ ] Twilio signature validation
- [ ] Create session in database
- [ ] Generate session link
- [ ] Send SMS with session link (optional)
- [ ] Return TwiML response

**File**: `app/api/voice/incoming/route.ts`

---

### Issue #28: Implement OpenAI Realtime API integration
**Labels**: `phase-3`, `backend`, `voice`, `enhancement`
**Description**: Connect to OpenAI Realtime API for voice processing
**Acceptance Criteria**:
- [ ] WebSocket connection to Realtime API
- [ ] Audio streaming from Twilio
- [ ] Function calling configured
- [ ] Session configuration
- [ ] Error handling

**File**: `app/api/voice/realtime/route.ts`

---

### Issue #29: Design voice conversation flow
**Labels**: `phase-3`, `voice`, `enhancement`
**Description**: Create conversation script and prompts for voice agent
**Acceptance Criteria**:
- [ ] Greeting message
- [ ] Questions for each field
- [ ] Confirmation flow
- [ ] Error handling (didn't understand)
- [ ] Repeat/correction capability
- [ ] Final confirmation

**File**: `lib/voice-prompts.ts`

---

### Issue #30: Implement function calling for data extraction
**Labels**: `phase-3`, `backend`, `voice`, `enhancement`
**Description**: Define OpenAI functions to extract structured data
**Acceptance Criteria**:
- [ ] Function definitions for each field
- [ ] Parameter validation
- [ ] Call session update API
- [ ] Broadcast via Ably
- [ ] Log to Braintrust

---

### Issue #31: Connect voice extraction to Ably broadcast
**Labels**: `phase-3`, `backend`, `voice`, `realtime`, `enhancement`
**Description**: Link voice agent field extraction to real-time mobile updates
**Acceptance Criteria**:
- [ ] Voice agent calls update API
- [ ] Data saved to database
- [ ] Ably broadcast triggered
- [ ] Mobile UI receives update
- [ ] End-to-end flow works

---

### Issue #32: Add voice session logging to Braintrust
**Labels**: `phase-3`, `monitoring`, `enhancement`
**Description**: Log all voice interactions to Braintrust
**Acceptance Criteria**:
- [ ] Log each conversation turn
- [ ] Log extracted field values
- [ ] Log latency metrics
- [ ] Log errors and retries
- [ ] Dashboard viewable in Braintrust

---

### Issue #33: Implement SMS session link delivery
**Labels**: `phase-3`, `enhancement`
**Description**: Send SMS with session link when user calls
**Acceptance Criteria**:
- [ ] SMS sent via Twilio
- [ ] Link includes session ID
- [ ] Error handling if SMS fails
- [ ] Optional (user can navigate manually)

---

### Issue #34: Phase 3 testing and validation
**Labels**: `phase-3`, `testing`
**Description**: Test complete voice + mobile sync flow
**Acceptance Criteria**:
- [ ] Can call phone number
- [ ] Voice agent responds
- [ ] Fields extracted correctly
- [ ] Mobile UI updates in real-time
- [ ] Application saves to database
- [ ] Admin can view completed application
- [ ] Braintrust logs visible

---

## Phase 4: Polish & Testing (Week 3-4)

### Issue #35: Improve voice prompts and error handling
**Labels**: `phase-4`, `voice`, `enhancement`
**Description**: Refine voice agent conversation quality
**Acceptance Criteria**:
- [ ] Natural conversation flow
- [ ] Better error messages
- [ ] Handle unclear responses
- [ ] Confirmation after each field
- [ ] Support corrections
- [ ] Graceful failures

---

### Issue #36: Add retry and correction logic
**Labels**: `phase-4`, `voice`, `enhancement`
**Description**: Allow users to correct information during voice call
**Acceptance Criteria**:
- [ ] User can say "go back" or "change that"
- [ ] Agent re-asks question
- [ ] Previous value overwritten
- [ ] Mobile UI updates reflect correction

---

### Issue #37: Optimize latency and performance
**Labels**: `phase-4`, `performance`, `enhancement`
**Description**: Reduce latency between voice capture and UI update
**Acceptance Criteria**:
- [ ] Voice → UI latency < 1 second (p95)
- [ ] Database queries optimized
- [ ] Ably connection stable
- [ ] No unnecessary API calls

---

### Issue #38: Add loading states and animations
**Labels**: `phase-4`, `frontend`, `enhancement`
**Description**: Improve UX with loading indicators
**Acceptance Criteria**:
- [ ] Loading spinner during session load
- [ ] Skeleton screens for forms
- [ ] Smooth transitions on field updates
- [ ] Connection status indicator
- [ ] Progress animations

---

### Issue #39: Implement comprehensive error handling
**Labels**: `phase-4`, `enhancement`
**Description**: Add error boundaries and user-friendly error messages
**Acceptance Criteria**:
- [ ] Error boundaries in React
- [ ] API error responses formatted
- [ ] User-facing error messages
- [ ] Fallback UI for failures
- [ ] Error logging

---

### Issue #40: Add form validation feedback
**Labels**: `phase-4`, `frontend`, `enhancement`
**Description**: Show validation errors in real-time
**Acceptance Criteria**:
- [ ] Field-level validation messages
- [ ] Visual error indicators
- [ ] Success indicators
- [ ] Form-level validation summary

---

### Issue #41: Create landing page
**Labels**: `phase-4`, `frontend`, `enhancement`
**Description**: Build homepage explaining the system
**Acceptance Criteria**:
- [ ] Clear explanation of POC
- [ ] Link to web form
- [ ] Instructions for voice call
- [ ] Mobile-responsive design

**File**: `app/page.tsx`

---

### Issue #42: Add session status tracking
**Labels**: `phase-4`, `enhancement`
**Description**: Track and display session status (active, completed, abandoned)
**Acceptance Criteria**:
- [ ] Status field in database updated
- [ ] Admin shows session status
- [ ] Mobile UI shows status
- [ ] Automatic status updates

---

### Issue #43: Create Braintrust evaluation dataset
**Labels**: `phase-4`, `monitoring`, `enhancement`
**Description**: Build test cases for evaluating voice agent
**Acceptance Criteria**:
- [ ] Test scenarios created
- [ ] Expected outputs defined
- [ ] Edge cases included
- [ ] Uploaded to Braintrust

---

### Issue #44: Use Braintrust to evaluate and improve agent
**Labels**: `phase-4`, `monitoring`, `enhancement`
**Description**: Analyze Braintrust data and improve voice prompts
**Acceptance Criteria**:
- [ ] Review conversation logs
- [ ] Identify common failure patterns
- [ ] Update prompts based on data
- [ ] A/B test improvements
- [ ] Document learnings

---

### Issue #45: Add analytics and metrics tracking
**Labels**: `phase-4`, `monitoring`, `enhancement`
**Description**: Track key POC success metrics
**Acceptance Criteria**:
- [ ] Track conversation completion rate
- [ ] Track latency metrics
- [ ] Track field extraction accuracy
- [ ] Dashboard in Braintrust

---

### Issue #46: Write deployment documentation
**Labels**: `phase-4`, `documentation`
**Description**: Document deployment process and configuration
**Acceptance Criteria**:
- [ ] Deployment guide created
- [ ] Environment variables documented
- [ ] Vercel setup instructions
- [ ] Third-party service setup
- [ ] Troubleshooting guide

---

### Issue #47: Create demo video/documentation
**Labels**: `phase-4`, `documentation`
**Description**: Record demo of POC functionality
**Acceptance Criteria**:
- [ ] Video showing voice call
- [ ] Video showing mobile UI sync
- [ ] Screenshots of admin interface
- [ ] README updated with demo

---

### Issue #48: Comprehensive end-to-end testing
**Labels**: `phase-4`, `testing`
**Description**: Final testing of all POC functionality
**Acceptance Criteria**:
- [ ] Web form submission works
- [ ] Voice call + mobile sync works
- [ ] Admin interface works
- [ ] All success criteria met
- [ ] Performance targets met
- [ ] Error scenarios handled

---

### Issue #49: Security review and hardening
**Labels**: `phase-4`, `security`
**Description**: Review and improve security posture
**Acceptance Criteria**:
- [ ] API keys properly secured
- [ ] Twilio signature validation working
- [ ] SQL injection prevention verified
- [ ] HTTPS enforced
- [ ] No sensitive data in logs
- [ ] Rate limiting considered

---

### Issue #50: Create project handoff documentation
**Labels**: `phase-4`, `documentation`
**Description**: Document POC for future development
**Acceptance Criteria**:
- [ ] Architecture documented
- [ ] Code comments added
- [ ] API documentation
- [ ] Known issues documented
- [ ] Future enhancements listed
- [ ] Lessons learned documented

---

## Setup & Infrastructure

### Issue #51: Configure Vercel deployment
**Labels**: `setup`, `deployment`
**Description**: Set up Vercel project and deployment
**Acceptance Criteria**:
- [ ] GitHub repo connected to Vercel
- [ ] Environment variables configured
- [ ] Automatic deployments enabled
- [ ] Preview deployments working
- [ ] Production domain configured

---

### Issue #52: Set up development environment documentation
**Labels**: `setup`, `documentation`
**Description**: Document local development setup
**Acceptance Criteria**:
- [ ] Installation instructions
- [ ] Environment variable setup
- [ ] Database setup
- [ ] Running locally
- [ ] Troubleshooting common issues

---

## Labels to Create in GitHub

- `phase-1` - Phase 1: Basic Infrastructure
- `phase-2` - Phase 2: Real-time Sync
- `phase-3` - Phase 3: Voice Integration
- `phase-4` - Phase 4: Polish & Testing
- `setup` - Setup and configuration tasks
- `frontend` - Frontend/UI work
- `backend` - Backend/API work
- `database` - Database related
- `voice` - Voice agent related
- `realtime` - Real-time sync related
- `monitoring` - Braintrust/logging related
- `testing` - Testing tasks
- `documentation` - Documentation tasks
- `enhancement` - New features
- `bug` - Bug reports
- `security` - Security related
- `performance` - Performance optimization
- `deployment` - Deployment related

## Milestones to Create

1. **Phase 1 Complete** - Basic web form and admin working
2. **Phase 2 Complete** - Real-time sync working
3. **Phase 3 Complete** - Voice integration working
4. **Phase 4 Complete** - POC polished and complete
