# Phase 3: Voice Integration Setup

## Overview

This phase integrates Twilio Voice with OpenAI Realtime API to allow users to complete the food permit application by voice call while seeing the form populate in real-time on their mobile device.

## Architecture

```
User Phone Call
    ↓
Twilio Phone Number
    ↓
Twilio Media Streams (WebSocket)
    ↓
Voice WebSocket Server (server/voice-server.ts)
    ↓
OpenAI Realtime API (Speech-to-Speech)
    ↓
Function Calling → Ably → Mobile UI Updates
```

## Prerequisites

1. **OpenAI API Key** with Realtime API access
   - Get from: https://platform.openai.com/api-keys
   - Add to `.env.local`: `OPENAI_API_KEY=sk-...`

2. **Twilio Account** (already configured)
   - Phone number: +15094361961
   - Account SID and Auth Token already in `.env.local`

3. **ngrok** for local development
   - Install: `brew install ngrok` (macOS) or download from https://ngrok.com
   - Sign up and get auth token
   - Run: `ngrok http 5050`

## Environment Variables

Add to `.env.local`:

```bash
# OpenAI Realtime API
OPENAI_API_KEY=sk-proj-...

# Voice Server Port (optional, defaults to 5050)
VOICE_SERVER_PORT=5050
```

## Running Locally

### Terminal 1: Next.js Web App
```bash
npm run dev
```
Runs on http://localhost:3000

### Terminal 2: Voice WebSocket Server
```bash
npm run voice-server
```
Runs on http://localhost:5050

### Terminal 3: ngrok Tunnel
```bash
ngrok http 5050
```
Provides public HTTPS URL for Twilio webhooks

## Twilio Configuration

1. Go to https://console.twilio.com/us1/develop/phone-numbers/manage/incoming
2. Click on your phone number: +15094361961
3. Configure **Voice & Fax** section:
   - **A CALL COMES IN**: Webhook, HTTP POST
   - URL: `https://your-ngrok-url.ngrok.app/api/voice/incoming`
   - (Or when deployed): `https://your-domain.com/api/voice/incoming`

## How It Works

1. **User calls** the Twilio number from the SMS link
2. **Twilio webhook** hits `/api/voice/incoming` and returns TwiML
3. **TwiML connects** to Media Stream WebSocket at `/media-stream?sessionId=xxx`
4. **Voice server** creates OpenAI Realtime Agent with function calling
5. **Agent asks questions** conversationally to collect form data
6. **Function calls** broadcast field updates via Ably
7. **Mobile UI updates** in real-time as user speaks
8. **Application submitted** when complete

## Function Calling

The OpenAI agent has two functions:

### `updateField(field, value)`
Updates a single form field and broadcasts to mobile UI.

Fields:
- `establishmentName`
- `streetAddress`
- `establishmentPhone`
- `establishmentEmail`
- `ownerName`
- `ownerPhone`
- `ownerEmail`
- `establishmentType`
- `plannedOpeningDate`

### `submitApplication(trackingId)`
Completes the application and saves to database.

## Testing

1. Start all three services (Next.js, Voice Server, ngrok)
2. Update Twilio webhook URL with ngrok URL
3. On home page, enter your phone number
4. Receive SMS with session link
5. Open link on mobile device
6. Call the Twilio number
7. Speak with the AI agent
8. Watch the form populate in real-time!

## Production Deployment

For production, you'll need to:
1. Deploy the voice server to a service that supports WebSockets (Railway, Render, Fly.io)
2. Update Twilio webhook URLs to production domain
3. Ensure all environment variables are set

## Troubleshooting

### Voice server won't start
- Check that `OPENAI_API_KEY` and `ABLY_API_KEY` are set
- Port 5050 might be in use - change `VOICE_SERVER_PORT`

### No audio on call
- Check ngrok is running and URL is updated in Twilio
- Check browser console for WebSocket errors
- Verify OpenAI API key has Realtime API access

### Form not updating
- Check Ably connection on mobile page
- Look for "field-update" events in browser console
- Verify sessionId matches between call and web page
