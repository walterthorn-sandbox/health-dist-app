# Deployment Guide

This guide covers deploying the Food Permit Voice Application to production using a split architecture:
- **Railway**: Voice WebSocket server (Twilio + OpenAI integration)
- **Vercel**: Next.js web application and API routes

## Architecture Overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Twilio    │────▶│   Railway    │────▶│   OpenAI    │
│ Media Stream│     │ Voice Server │     │ Realtime API│
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                           │ Ably (Real-time)
                           │
                           ▼
                    ┌──────────────┐
                    │    Vercel    │
                    │  Next.js App │
                    │ + Postgres DB│
                    └──────────────┘
```

## Prerequisites

- GitHub account with this repository pushed
- Railway account (https://railway.app)
- Vercel account (https://vercel.com)
- Twilio account with phone number configured for Media Streams
- OpenAI API key with Realtime API access
- Ably account for real-time messaging
- Braintrust account for AI observability (optional)

## Part 1: Deploy Database and Web App to Vercel

### 1. Create Vercel Postgres Database

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Create Postgres database in Vercel dashboard
# Go to: https://vercel.com/dashboard -> Storage -> Create Database -> Postgres
```

### 2. Pull Environment Variables

```bash
# Pull database credentials from Vercel
vercel env pull .env.local
```

This will populate `.env.local` with:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NO_SSL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

### 3. Initialize Database Schema

```bash
npm run db:init
```

### 4. Add Additional Environment Variables to Vercel

In the Vercel dashboard, add these environment variables:

```
ABLY_API_KEY=your_ably_api_key
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
PAGE_PASSWORD=your_page_password
RAILWAY_VOICE_SERVER_URL=https://your-app.railway.app (add this after Railway deployment)
```

### 5. Deploy to Vercel

```bash
# Deploy to production
vercel --prod
```

Or connect your GitHub repository in the Vercel dashboard for automatic deployments.

## Part 2: Deploy Voice Server to Railway

### 1. Create Railway Project

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will detect the configuration from `railway.json`

### 2. Configure Environment Variables in Railway

Add these environment variables in Railway dashboard:

```
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Ably (for real-time updates)
ABLY_API_KEY=your_ably_api_key

# Braintrust (for AI logging - optional)
BRAINTRUST_API_KEY=your_braintrust_api_key

# Server Configuration
VOICE_SERVER_PORT=5050

# Database (copy from Vercel)
POSTGRES_URL=your_vercel_postgres_url
POSTGRES_PRISMA_URL=your_vercel_postgres_prisma_url
POSTGRES_URL_NO_SSL=your_vercel_postgres_url_no_ssl
POSTGRES_URL_NON_POOLING=your_vercel_postgres_url_non_pooling
```

### 3. Deploy

Railway will automatically deploy when you push to your repository. The deployment will:
1. Run `npm install` (defined in `railway.json`)
2. Start the voice server with `npm run start:voice` (defined in `Procfile`)
3. Monitor the `/health` endpoint for service health

### 4. Get Railway Domain

After deployment, Railway will provide a domain like:
```
https://your-app.railway.app
```

Copy this URL - you'll need it for Twilio configuration and Vercel environment variables.

### 5. Update Vercel Environment Variable

Go back to Vercel dashboard and add/update:
```
RAILWAY_VOICE_SERVER_URL=https://your-app.railway.app
```

Then redeploy Vercel if needed.

## Part 3: Configure Twilio Media Streams

### 1. Configure Your Twilio Phone Number

1. Go to Twilio Console: https://console.twilio.com/
2. Navigate to Phone Numbers → Manage → Active Numbers
3. Click on your phone number
4. Scroll to "Voice Configuration"
5. Set "A CALL COMES IN" to "Webhook"
6. Enter the webhook URL pointing to your **Vercel** deployment:
   ```
   https://your-app.vercel.app/api/voice/incoming
   ```
7. Set HTTP method to "POST"
8. Save

### 2. Verify Webhook URL

The Vercel API route at `/api/voice/incoming` will:
- Receive incoming calls from Twilio
- Return TwiML that starts a Media Stream
- The Media Stream will connect to: `wss://your-app.railway.app/media-stream`

The Media Stream URL is configured in [src/app/api/voice/incoming/route.ts](src/app/api/voice/incoming/route.ts).

## Testing the Deployment

### 1. Test Voice Server Health

```bash
curl https://your-app.railway.app/health
```

Should return:
```json
{"status":"ok","sessions":0}
```

### 2. Test Incoming Call Flow

1. Call your Twilio phone number
2. You should hear the AI agent greeting you
3. Try having a conversation about food permit applications
4. Check Railway logs for connection status
5. Check Braintrust dashboard for conversation logs (if configured)

### 3. Test Web Interface

1. Visit your Vercel deployment: `https://your-app.vercel.app`
2. Enter the page password
3. You should see the admin interface
4. Make a test call and verify the form updates in real-time

## Monitoring and Logs

### Railway Logs

View voice server logs in Railway dashboard:
- WebSocket connections
- OpenAI API interactions
- Ably message publishing
- Braintrust logging events

### Vercel Logs

View Next.js logs in Vercel dashboard:
- API route calls
- Database queries
- Server-side rendering

### Braintrust Dashboard

View AI conversation logs and analytics:
- https://www.braintrust.dev/

## Local Development

For local development with production-like setup:

### 1. Run Next.js Dev Server

```bash
npm run dev
```

This starts Next.js on port 3000.

### 2. Run Voice Server Locally

```bash
npm run voice-server
```

This starts the voice server on port 5050.

### 3. Expose with ngrok

```bash
ngrok http 5050
```

Use the ngrok URL in your Twilio webhook configuration for testing.

**Important**: Update the Twilio webhook to point to:
```
https://your-ngrok-url.ngrok-free.app/api/voice/incoming
```

And ensure the Media Stream URL in the code points to the same ngrok domain.

## Environment Variables Reference

### Required for Both Vercel and Railway

```bash
# Ably (real-time messaging)
ABLY_API_KEY=

# Database (from Vercel Postgres)
POSTGRES_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NO_SSL=
POSTGRES_URL_NON_POOLING=
```

### Vercel Only

```bash
# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Page Protection
PAGE_PASSWORD=

# Voice Server URL
RAILWAY_VOICE_SERVER_URL=
```

### Railway Only

```bash
# OpenAI
OPENAI_API_KEY=

# Braintrust (optional)
BRAINTRUST_API_KEY=

# Server Configuration
VOICE_SERVER_PORT=5050
```

## Troubleshooting

### Voice Server Not Connecting

1. Check Railway logs for errors
2. Verify `OPENAI_API_KEY` is set correctly
3. Verify `ABLY_API_KEY` is set correctly
4. Test health endpoint: `curl https://your-app.railway.app/health`

### Twilio Not Connecting to Media Stream

1. Verify Twilio webhook is pointing to Vercel: `https://your-app.vercel.app/api/voice/incoming`
2. Check Vercel logs for incoming webhook calls
3. Verify `RAILWAY_VOICE_SERVER_URL` is set in Vercel environment variables
4. Check that the Media Stream URL in code matches your Railway deployment

### Real-time Updates Not Working

1. Verify `ABLY_API_KEY` is set in both Vercel and Railway
2. Check that both services can publish/subscribe to Ably channels
3. Verify the channel name matches in voice server and web app

### Database Connection Issues

1. Verify Postgres environment variables are set correctly in both services
2. Check Vercel Postgres dashboard for connection limits
3. Ensure `POSTGRES_URL` includes SSL parameters

## Security Notes

- Never commit `.env.local` or any file containing secrets
- Rotate API keys periodically
- Use Vercel's environment variable encryption
- Enable Railway's private networking if available
- Set up Twilio's geo-permissions to restrict calling regions
- Configure CORS appropriately for your domain

## Cost Optimization

### Vercel
- Free tier includes: 100GB bandwidth, serverless function invocations
- Postgres: Pay for storage and compute

### Railway
- $5/month for Hobby plan (includes $5 usage credit)
- Pay for actual resource usage beyond free tier

### OpenAI
- Realtime API: ~$0.06 per minute of audio (input) + $0.24 per minute (output)
- Monitor usage in OpenAI dashboard

### Twilio
- Phone number: ~$1-2/month
- Incoming calls: ~$0.0085/minute
- Media Streams: No additional charge

### Ably
- Free tier: 3M messages/month
- Monitor usage in Ably dashboard

## Updating the Application

### Update Voice Server (Railway)

```bash
git add .
git commit -m "update: voice server changes"
git push origin main
```

Railway will automatically redeploy.

### Update Web App (Vercel)

```bash
git add .
git commit -m "update: web app changes"
git push origin main
```

Vercel will automatically redeploy if connected to GitHub.

## Support

For issues related to:
- **Railway**: https://railway.app/help
- **Vercel**: https://vercel.com/support
- **Twilio**: https://support.twilio.com
- **OpenAI**: https://help.openai.com
- **Ably**: https://ably.com/support
