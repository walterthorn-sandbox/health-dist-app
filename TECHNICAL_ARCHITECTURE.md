# Technical Architecture - Food Establishment Permit Application POC

## Overview
This document outlines the technical architecture for a proof-of-concept voice-driven permit application system with synchronized mobile UI. The system enables users to complete applications via voice call while watching their responses populate a form in real-time on their mobile device.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Experience                          │
├─────────────────────────┬───────────────────────────────────────┤
│   Phone (Voice Call)    │    Mobile Device (Web Browser)        │
│   ┌─────────────┐       │    ┌──────────────────────────┐      │
│   │ Voice Agent │       │    │   Mobile Web UI          │      │
│   │ "What's the │       │    │  ┌────────────────────┐  │      │
│   │  name of    │       │    │  │ Establishment Name │  │      │
│   │  your       │◄──────┼────┤  │ [Joe's Pizza    ]  │  │      │
│   │  business?" │       │    │  │                    │  │      │
│   └─────────────┘       │    │  │ Address           │  │      │
│         │               │    │  │ [              ]  │  │      │
│         ▼               │    │  │                    │  │      │
│   "Joe's Pizza"         │    │  └────────────────────┘  │      │
│                         │    │   Real-time Updates      │      │
│                         │    └──────────────────────────┘      │
└─────────────────────────┴───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Integration Layer                            │
├─────────────────────────┬───────────────────────────────────────┤
│   Twilio (Telephony)    │    OpenAI Realtime API (Voice AI)    │
└─────────────────────────┴───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend Services                             │
│                    (Hosted on Vercel)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │  API Server      │  │  WebSocket       │  │  Voice       │ │
│  │  (Next.js)       │  │  (Ably)          │  │  Handler     │ │
│  │                  │  │                  │  │              │ │
│  │  - REST API      │  │  - Session mgmt  │  │  - Twilio    │ │
│  │  - Form submit   │  │  - Real-time     │  │    webhooks  │ │
│  │  - Admin views   │  │    sync          │  │  - OpenAI    │ │
│  │                  │  │  - Broadcast     │  │    interface │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Data Layer                                   │
├─────────────────────────┬───────────────────────────────────────┤
│  Vercel Postgres        │    Braintrust (AI Eval & Logging)    │
│  (Neon)                 │                                       │
│                         │    - Voice agent performance          │
│  - Applications         │    - Conversation quality             │
│  - Sessions             │    - Field extraction accuracy        │
│  - Tracking IDs         │    - Latency metrics                  │
└─────────────────────────┴───────────────────────────────────────┘
```

## Technology Stack

### Hosting Platform: Vercel

**Why Vercel:**
- ✅ Excellent Next.js support (zero-config deployment)
- ✅ Built-in serverless functions for API routes
- ✅ Global edge network for low latency
- ✅ Seamless integration with Ably for real-time features
- ✅ Free tier suitable for POC
- ✅ Easy environment variable management
- ✅ Integrated PostgreSQL (Vercel Postgres powered by Neon)
- ✅ Automatic HTTPS and preview deployments

### Frontend

**Framework: Next.js 14+ (App Router)**
- React-based framework with excellent Vercel integration
- Server-side rendering for fast initial loads
- API routes for backend endpoints
- Built-in TypeScript support

**UI Libraries:**
- **Tailwind CSS** - Utility-first styling, mobile-first responsive design
- **shadcn/ui** - Accessible component library built on Radix UI
- **React Hook Form** - Form state management and validation
- **Zod** - TypeScript-first schema validation

**Real-time Communication: Ably**
- Managed WebSocket service with excellent Vercel integration
- Free tier: 3M messages/month, 100 concurrent connections
- Native Vercel integration for seamless deployment
- Automatic fallback to HTTP streaming for reliability
- Simple pub/sub API for broadcasting form updates
- Built-in presence tracking and history features

### Backend

**API Framework: Next.js API Routes / Server Actions**
- Serverless functions on Vercel
- TypeScript for type safety
- Built-in middleware support

**Voice Processing Pipeline:**
```
Incoming Call (Twilio)
    ↓
Twilio Webhook → Next.js API Route
    ↓
Initialize Session → Store in DB + Ably channel
    ↓
Connect to OpenAI Realtime API (WebSocket)
    ↓
Stream audio bidirectionally
    ↓
Extract structured data → Broadcast via Ably → Mobile UI updates
    ↓
Final submission → Store in PostgreSQL
```

### Voice & Telephony

**Telephony: Twilio**
- Industry-standard reliability
- Programmable Voice API
- WebSocket support for audio streaming
- Pay-as-you-go pricing (~$0.013/min)
- Free trial credit for testing

**Voice AI: OpenAI Realtime API**
- Low-latency voice-to-voice conversation (<1 second)
- Built-in function calling for structured data extraction
- Natural conversation flow with interruption handling
- Supports multiple voices and configurable instructions
- Pricing: ~$0.06/min input, ~$0.24/min output
- WebSocket-based for real-time bidirectional audio streaming

### Database: Vercel Postgres (Neon)

**Why Vercel Postgres:**
- Serverless PostgreSQL with automatic scaling
- Seamlessly integrated with Vercel platform
- Free tier: 0.5GB storage, 100 hours compute/month (sufficient for POC)
- Direct SQL access via `@vercel/postgres` package
- Connection pooling built-in
- Zero configuration needed for Vercel deployments
- Backup and point-in-time recovery available

**Schema:**
```sql
-- Sessions table (for voice + mobile sync)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW(),
  phone_number VARCHAR(20),
  status VARCHAR(20), -- 'active', 'completed', 'abandoned'
  channel_name VARCHAR(100) -- Ably channel for real-time sync
);

-- Applications table
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id VARCHAR(20) UNIQUE NOT NULL,
  session_id UUID REFERENCES sessions(id),
  created_at TIMESTAMP DEFAULT NOW(),
  submitted_at TIMESTAMP,

  -- Establishment info
  establishment_name VARCHAR(255),
  street_address TEXT,
  establishment_phone VARCHAR(20),
  establishment_email VARCHAR(255),

  -- Owner info
  owner_name VARCHAR(255),
  owner_phone VARCHAR(20),
  owner_email VARCHAR(255),

  -- Operating info
  establishment_type VARCHAR(100),
  planned_opening_date DATE,

  -- Metadata
  submission_channel VARCHAR(20), -- 'web', 'voice', 'voice_mobile'
  raw_data JSONB -- Store full conversation/form data
);
```

### AI Evaluation & Monitoring

**Braintrust**
- AI agent evaluation and observability
- Track conversation quality and accuracy
- Monitor field extraction success rates
- A/B test different prompts and models
- Free tier suitable for POC

**Integration Points:**
1. **Log every voice conversation**
   - User input (transcribed)
   - AI responses
   - Extracted field data
   - Latency metrics

2. **Create evaluation datasets**
   - Test cases for different scenarios
   - Edge cases (unclear responses, corrections)
   - Multi-turn conversations

3. **Track key metrics**
   - Field extraction accuracy
   - Conversation completion rate
   - Average conversation duration
   - User corrections/retries per field

**Braintrust Setup:**
```typescript
import { Braintrust } from "braintrust";

// Initialize
const bt = new Braintrust({
  apiKey: process.env.BRAINTRUST_API_KEY,
});

// Log conversation
await bt.log({
  projectName: "food-permit-voice-agent",
  input: { field: "establishment_name", userSpeech: "Joe's Pizza" },
  output: { extractedValue: "Joe's Pizza", confidence: 0.95 },
  expected: "Joe's Pizza",
  metadata: {
    sessionId: session.id,
    latency: 450, // ms
    model: "gpt-4o-realtime-preview",
  },
});
```

### Real-time Sync Architecture with Ably

Ably provides the real-time synchronization between the voice agent and mobile UI:

```typescript
// Backend: Broadcast update (Next.js API Route)
import Ably from 'ably/promises';

const ably = new Ably.Rest(process.env.ABLY_API_KEY);
const channel = ably.channels.get(`session:${sessionId}`);

await channel.publish('field-update', {
  field: 'establishment_name',
  value: 'Joe\'s Pizza'
});

// Frontend: Subscribe to updates (React Component)
import { useChannel } from 'ably/react';

function SessionForm({ sessionId }) {
  const [formData, setFormData] = useState({});

  useChannel(`session:${sessionId}`, 'field-update', (message) => {
    setFormData(prev => ({
      ...prev,
      [message.data.field]: message.data.value
    }));
  });

  return <form>...</form>;
}
```

**Key Features:**
- Sub-second latency for real-time updates
- Automatic reconnection handling
- Message ordering guarantees
- Presence awareness (know when user is connected)
- Message history (retrieve missed updates)

### Session Management Flow

```typescript
// 1. User calls phone number
POST /api/voice/incoming (Twilio webhook)
  → Generate sessionId
  → Create session record in DB
  → Create Ably channel: `session:${sessionId}`
  → Send SMS with link: https://app.com/session/{sessionId}
  → Return TwiML to connect to OpenAI Realtime API

// 2. User opens mobile link
GET /session/[sessionId]
  → Load session from DB
  → Subscribe to Ably channel
  → Display empty form, ready for real-time updates

// 3. Voice agent asks questions
OpenAI Realtime API (via WebSocket)
  → Use function calling to extract structured data
  → POST /api/session/[sessionId]/update
    → Save to DB
    → Broadcast via Ably
  → Mobile UI receives update, populates field

// 4. Application complete
Voice agent confirms all fields
  → POST /api/applications
    → Create application record
    → Mark session as completed
    → Send final confirmation via Ably
```

## Final Technology Stack

| Component | Technology | Reasoning |
|-----------|-----------|-----------|
| **Hosting** | Vercel | Production-ready, excellent Next.js support, serverless |
| **Frontend** | Next.js 14 + React | Modern, type-safe, integrated with hosting |
| **Styling** | Tailwind CSS + shadcn/ui | Rapid development, mobile-first, accessible |
| **Database** | Vercel Postgres (Neon) | Serverless, auto-scaling, free tier |
| **Real-time** | Ably | Managed, reliable, Vercel integration, free tier |
| **Telephony** | Twilio | Industry standard, reliable, good documentation |
| **Voice AI** | OpenAI Realtime API | Lowest latency, easiest integration, function calling |
| **Monitoring** | Braintrust | AI-specific evaluation and logging |
| **Form Validation** | Zod | Type-safe, integrates with React Hook Form |

This stack provides:
- **Minimal configuration**: Vercel + Next.js work seamlessly together
- **Cost-effective**: Free tiers cover entire POC development
- **Production-ready**: Can scale from POC to production without major changes
- **Developer experience**: Modern tools with excellent documentation
- **Real-time capabilities**: Ably handles WebSocket complexity
- **AI observability**: Braintrust provides insights into voice agent performance

## Development Workflow

### Phase 1: Basic Infrastructure (Week 1)
1. Set up Vercel project with Next.js
2. Set up Vercel Postgres database
3. Create basic web form UI
4. Implement form submission → DB storage
5. Create admin list/detail views
6. **Validation:** Basic web form works end-to-end

### Phase 2: Real-time Sync (Week 1-2)
1. Integrate Ably for real-time communication
2. Create session management system
3. Build mobile UI with real-time form updates
4. Create test API endpoint to simulate field updates
5. **Validation:** Mobile UI updates in real-time when API is called

### Phase 3: Voice Integration (Week 2-3)
1. Set up Twilio account and phone number
2. Integrate OpenAI Realtime API
3. Implement voice conversation flow
4. Connect voice extraction → Ably broadcast
5. Add Braintrust logging
6. **Validation:** Voice call → mobile UI sync → DB storage

### Phase 4: Polish & Testing (Week 3-4)
1. Improve voice prompts and conversation flow
2. Add error handling and edge cases
3. Optimize latency
4. Use Braintrust to evaluate and improve
5. **Validation:** Full POC working smoothly

## Environment Variables

```bash
# Database
POSTGRES_URL="postgresql://..."
POSTGRES_PRISMA_URL="postgresql://..."
POSTGRES_URL_NON_POOLING="postgresql://..."

# Real-time
ABLY_API_KEY="..."
NEXT_PUBLIC_ABLY_KEY="..." # Client-side key

# Voice
TWILIO_ACCOUNT_SID="..."
TWILIO_AUTH_TOKEN="..."
TWILIO_PHONE_NUMBER="..."

# AI
OPENAI_API_KEY="..."

# Monitoring
BRAINTRUST_API_KEY="..."

# App
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
```

## Cost Estimate (POC)

| Service | Free Tier | Estimated Monthly Cost (100 test calls) |
|---------|-----------|------------------------------------------|
| Vercel | Free (Hobby) | $0 |
| Vercel Postgres | 0.5GB / 100hr compute | $0 |
| Ably | 3M messages/month | $0 |
| Twilio | Trial credit | ~$1-2 |
| OpenAI Realtime API | Pay-as-you-go | ~$10-20 (100 calls × 5 min avg) |
| Braintrust | Free tier | $0 |
| **Total** | | **~$11-22/month** |

## Security Considerations

1. **API Keys:** Store in Vercel environment variables
2. **Twilio Webhooks:** Validate requests using Twilio signature
3. **Session Access:** Generate unique UUIDs, no authentication needed for POC
4. **Database:** Use parameterized queries (Vercel Postgres SDK handles this)
5. **HTTPS:** Automatic with Vercel
6. **WebSocket Security:** Ably handles authentication via API keys

## Performance Targets

- **Mobile UI Update Latency:** < 1 second from voice capture
- **Voice Agent Response Time:** < 2 seconds
- **Page Load Time:** < 2 seconds
- **Database Query Time:** < 100ms

## Success Metrics Dashboard (Braintrust)

Track these metrics to evaluate POC success:

1. **Conversation Quality**
   - Completion rate (% of calls that finish application)
   - Average conversation duration
   - User corrections per field

2. **Technical Performance**
   - Voice → UI latency (p50, p95, p99)
   - Field extraction accuracy
   - Error rate

3. **User Experience**
   - Successful submissions
   - Session abandonment points
   - Mobile UI loading time

## Next Steps

1. **Set up accounts:**
   - Vercel account
   - Twilio account + phone number
   - OpenAI API access (Realtime API waitlist if needed)
   - Ably account
   - Braintrust account

2. **Initialize project:**
   ```bash
   npx create-next-app@latest food-permit-app --typescript --tailwind --app
   cd food-permit-app
   npm install @vercel/postgres ably openai twilio braintrust zod react-hook-form @hookform/resolvers
   npm install ably/react
   ```

3. **Configure Vercel project:**
   - Connect GitHub repository
   - Add environment variables in Vercel dashboard
   - Set up Vercel Postgres database
   - Enable automatic deployments

4. **Set up Ably:**
   - Create Ably account at https://ably.com
   - Create new app
   - Copy API key (root key for server-side)
   - Generate client-only key for frontend

5. **Start with Phase 1:** Build and validate basic web form

## Repository Structure

```
food-permit-app/
├── app/
│   ├── api/
│   │   ├── voice/
│   │   │   ├── incoming/route.ts      # Twilio webhook handler
│   │   │   └── realtime/route.ts      # OpenAI Realtime API integration
│   │   ├── session/
│   │   │   └── [id]/
│   │   │       └── update/route.ts    # Update session data
│   │   └── applications/
│   │       ├── route.ts               # Create application
│   │       └── [id]/route.ts          # Get application details
│   ├── session/
│   │   └── [id]/page.tsx              # Mobile UI for real-time sync
│   ├── admin/
│   │   ├── page.tsx                   # Admin list view
│   │   └── [id]/page.tsx              # Admin detail view
│   ├── apply/page.tsx                 # Basic web form
│   └── page.tsx                       # Landing page
├── lib/
│   ├── db.ts                          # Database utilities
│   ├── ably.ts                        # Ably client setup
│   ├── braintrust.ts                  # Braintrust logging
│   └── schema.ts                      # Zod schemas
├── components/
│   ├── forms/
│   │   └── PermitForm.tsx             # Reusable form component
│   └── ui/                            # shadcn/ui components
└── sql/
    └── schema.sql                     # Database schema
```
