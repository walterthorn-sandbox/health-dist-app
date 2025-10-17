# Food Establishment Permit Application System - POC

A proof-of-concept voice-driven permit application system where users can complete a food establishment permit application via voice call while simultaneously viewing real-time form updates on their mobile device.

## 🎯 Project Goal

Demonstrate synchronized voice + mobile UI interaction for new permit applications. The core innovation is allowing users to speak their application details while watching the form populate in real-time on their phone.

## 🏗️ Architecture

- **Hosting**: Vercel
- **Frontend**: Next.js 14 + React + Tailwind CSS + shadcn/ui
- **Database**: Vercel Postgres (Neon)
- **Real-time Sync**: Ably
- **Voice Telephony**: Twilio
- **Voice AI**: OpenAI Realtime API
- **Monitoring**: Braintrust

## 📋 Documentation

- [Requirements](./REQUIREMENTS.md) - Detailed POC requirements and scope
- [Technical Architecture](./TECHNICAL_ARCHITECTURE.md) - System architecture and technology decisions

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Accounts:
  - Vercel
  - Twilio
  - OpenAI (with Realtime API access)
  - Ably
  - Braintrust

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/health-dist-app.git
cd health-dist-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🗂️ Project Structure

```
food-permit-app/
├── app/                   # Next.js app directory
│   ├── api/              # API routes
│   ├── session/          # Real-time session UI
│   ├── admin/            # Admin interface
│   └── apply/            # Web form
├── lib/                  # Utilities and configurations
├── components/           # React components
└── sql/                  # Database schema
```

## 🧪 Development Phases

### Phase 1: Basic Infrastructure ✅
- [x] Set up Vercel project with Next.js
- [ ] Set up Vercel Postgres database
- [ ] Create basic web form UI
- [ ] Implement form submission → DB storage
- [ ] Create admin list/detail views

### Phase 2: Real-time Sync
- [ ] Integrate Ably for real-time communication
- [ ] Create session management system
- [ ] Build mobile UI with real-time form updates
- [ ] Create test API endpoint to simulate field updates

### Phase 3: Voice Integration
- [ ] Set up Twilio account and phone number
- [ ] Integrate OpenAI Realtime API
- [ ] Implement voice conversation flow
- [ ] Connect voice extraction → Ably broadcast
- [ ] Add Braintrust logging

### Phase 4: Polish & Testing
- [ ] Improve voice prompts and conversation flow
- [ ] Add error handling and edge cases
- [ ] Optimize latency
- [ ] Use Braintrust to evaluate and improve

## 📊 Success Criteria

- ✅ User can call phone number and complete application via voice
- ✅ User can simultaneously view form on mobile device
- ✅ Form updates in real-time as voice agent captures information
- ✅ Completed application saves to database
- ✅ Admin can view list of applications and details
- ✅ Basic web form submission works

## 📝 License

TBD

## 🤝 Contributing

This is a proof-of-concept project. Contributions welcome!
