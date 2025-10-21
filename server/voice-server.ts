/**
 * Voice WebSocket Server
 *
 * Handles Twilio Media Streams and connects to OpenAI Realtime API
 * for conversational food permit application collection.
 *
 * Run with: tsx server/voice-server.ts
 */

import Fastify from "fastify";
import FastifyWebSocket from "@fastify/websocket";
import FastifyFormBody from "@fastify/formbody";
import { TwilioRealtimeTransportLayer } from "@openai/agents-extensions";
import { RealtimeAgent, RealtimeSession, tool } from "@openai/agents/realtime";
import Ably from "ably";
import { config } from "dotenv";
import * as path from "path";
import { z } from "zod";

// Load environment variables
config({ path: path.join(__dirname, "..", ".env.local") });

const PORT = process.env.VOICE_SERVER_PORT || 5050;
const NEXTJS_PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ABLY_API_KEY = process.env.ABLY_API_KEY;

if (!OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY environment variable is required");
  process.exit(1);
}

if (!ABLY_API_KEY) {
  console.error("❌ ABLY_API_KEY environment variable is required");
  process.exit(1);
}

// Initialize Ably client
const ablyClient = new Ably.Realtime(ABLY_API_KEY);

// Create Fastify server
const fastify = Fastify({
  logger: true,
});

// Register plugins
fastify.register(FastifyWebSocket);
fastify.register(FastifyFormBody);

// In-memory session storage (map sessionId -> session data)
const sessions = new Map<string, {
  sessionId: string;
  channelName: string;
  formData: Record<string, unknown>;
}>();

/**
 * WebSocket endpoint for Twilio Media Streams
 * URL: ws://localhost:5050/media-stream?sessionId=xxx
 */
fastify.register(async (fastify) => {
  fastify.get("/media-stream", { websocket: true }, (socket, req) => {
    console.log(`📞 New WebSocket connection`);

    // We'll get the sessionId from Twilio's start message
    let sessionId = "unknown";
    let sessionData: any = null;
    let ablyChannel: any = null;
    let setupComplete = false;

    // Create the Twilio transport layer FIRST (before agent/session)
    const twilioTransport = new TwilioRealtimeTransportLayer({
      twilioWebSocket: socket as any,
    });

    // Listen for Twilio's start message to get custom parameters
    twilioTransport.on("twilioMessage", async (data: any) => {
      try {
        const message = typeof data === "string" ? JSON.parse(data) : data;

        // Check if this is Twilio's start message with custom parameters
        if (message.event === "start" && message.start?.customParameters?.sessionId && !setupComplete) {
          sessionId = message.start.customParameters.sessionId;
          console.log(`🔑 Session ID from Twilio: ${sessionId}`);

          // Now set up the session
          sessionData = sessions.get(sessionId);
          if (!sessionData) {
            sessionData = {
              sessionId,
              channelName: `session:${sessionId}`,
              formData: {},
            };
            sessions.set(sessionId, sessionData);
          }

          // Create Ably channel for this session
          ablyChannel = ablyClient.channels.get(sessionData.channelName);
          setupComplete = true;
          console.log(`✅ Session setup complete for ${sessionId}`);

          // NOW create the agent and session with the proper context
          createAgentAndSession();
        }
      } catch (error) {
        // Not a JSON message or error parsing - ignore
        console.error("Error parsing Twilio message:", error);
      }
    });

    // Function to create agent and session AFTER we have sessionId
    const createAgentAndSession = () => {
      console.log(`🤖 Creating agent for session ${sessionId}`);

      // Define tools using the SDK's tool() function
    const updateFieldTool = tool({
      name: "updateField",
      description: "Update a field in the food permit application form. This will broadcast the update to the user's mobile device in real-time.",
      parameters: z.object({
        field: z.enum([
          "establishmentName",
          "streetAddress",
          "establishmentPhone",
          "establishmentEmail",
          "ownerName",
          "ownerPhone",
          "ownerEmail",
          "establishmentType",
          "plannedOpeningDate",
        ]),
        value: z.string(),
      }),
      execute: async (input) => {
        console.log(`🔧 updateField called: ${input.field} = ${input.value}`);

        // Update session data
        if (sessionData) {
          sessionData.formData[input.field] = input.value;
        }

        // Broadcast update via Ably
        await ablyChannel.publish("field-update", {
          field: input.field,
          value: input.value,
          timestamp: Date.now(),
        });

        console.log(`📤 Broadcast field update: ${input.field} = ${input.value}`);

        return `Updated ${input.field} to ${input.value}`;
      },
    });

    const submitApplicationTool = tool({
      name: "submitApplication",
      description: "Submit the completed food permit application to the database and end the call",
      parameters: z.object({
        trackingId: z.string(),
      }),
      execute: async (input) => {
        console.log(`🔧 submitApplication called: ${input.trackingId}`);

        // Broadcast completion via Ably
        await ablyChannel.publish("session-complete", {
          trackingId: input.trackingId,
          timestamp: Date.now(),
        });

        console.log(`✅ Application submitted: ${input.trackingId}`);

        // Clean up session
        sessions.delete(sessionId);

        return "Application submitted successfully";
      },
    });

      // Create OpenAI Realtime Agent with tools
      const agent = new RealtimeAgent({
        name: "Food Permit Assistant",
        instructions: `You are a helpful assistant for the Chelan-Douglas Health District.
Your job is to collect information for a food establishment permit application through a conversational voice call.

You should ask the user for the following information in a natural, friendly way:
1. Establishment name
2. Street address
3. Establishment phone number
4. Establishment email
5. Owner/operator name
6. Owner phone number
7. Owner email
8. Type of establishment (restaurant, food truck, bakery, etc.)
9. Planned opening date

Be conversational and ask one question at a time. Confirm information when needed.
When you collect a piece of information, call the updateField function to send it to the mobile UI.
After collecting all information, call the submitApplication function to complete the process.`,
        tools: [updateFieldTool, submitApplicationTool],
      });

      console.log(`🔗 Agent created with tools for ${sessionId}`);

      // Create realtime session with the transport we created earlier
      const session = new RealtimeSession(agent, {
        transport: twilioTransport,
      });

      console.log(`📦 RealtimeSession created for ${sessionId}`);

      // Add session event listeners for debugging
      session.on("connected", () => {
        console.log(`✅ OpenAI session connected for ${sessionId}`);
      });

      session.on("disconnected", () => {
        console.log(`⚠️ OpenAI session disconnected for ${sessionId}`);
      });

      session.on("error", (error) => {
        console.error(`❌ OpenAI session error for ${sessionId}:`, error);
      });

      // Connect to OpenAI with API key
      console.log(`🔌 Connecting to OpenAI for ${sessionId}...`);
      session.connect({ apiKey: OPENAI_API_KEY }).then(() => {
        console.log(`✨ session.connect() promise resolved for ${sessionId}`);
      }).catch((error) => {
        console.error(`❌ Failed to connect to OpenAI for ${sessionId}:`, error);
      });

      console.log(`🚀 Session started for ${sessionId}`);
    }; // End of createAgentAndSession function

    // Handle disconnection
    socket.on("close", () => {
      console.log(`📴 Call ended - Session: ${sessionId}`);
      // Clean up session
      sessions.delete(sessionId);
    });

    socket.on("error", (error) => {
      console.error(`❌ WebSocket error for session ${sessionId}:`, error);
    });
  });
});

// Health check endpoint
fastify.get("/health", async () => {
  return { status: "ok", sessions: sessions.size };
});

// Proxy all other requests to Next.js
fastify.all("/*", async (request, reply) => {
  try {
    const url = `http://localhost:${NEXTJS_PORT}${request.url}`;

    // Prepare request body based on content type
    let body: string | undefined;
    if (request.method !== "GET" && request.method !== "HEAD" && request.body) {
      const contentType = request.headers["content-type"];
      if (contentType?.includes("application/x-www-form-urlencoded")) {
        // Convert parsed form body back to URL-encoded string
        const params = new URLSearchParams(request.body as Record<string, string>);
        body = params.toString();
      } else if (contentType?.includes("application/json")) {
        body = JSON.stringify(request.body);
      } else {
        // For other content types, try to stringify
        body = typeof request.body === "string" ? request.body : JSON.stringify(request.body);
      }
    }

    const response = await fetch(url, {
      method: request.method,
      headers: request.headers as HeadersInit,
      body,
    });

    const responseContentType = response.headers.get("content-type");
    const responseBody = responseContentType?.includes("application/json")
      ? await response.json()
      : await response.text();

    // Forward all response headers
    const responseHeaders = Object.fromEntries(response.headers.entries());

    reply
      .code(response.status)
      .headers(responseHeaders)
      .send(responseBody);
  } catch (error) {
    console.error("Proxy error:", error);
    reply.code(502).send({ error: "Bad Gateway - Next.js server not available" });
  }
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: Number(PORT), host: "0.0.0.0" });
    console.log(`
🎙️  Voice WebSocket Server is running!
📞 WebSocket endpoint: ws://localhost:${PORT}/media-stream
🏥 Health check: http://localhost:${PORT}/health
🔄 Proxying HTTP requests to Next.js on port ${NEXTJS_PORT}

Configure Twilio Media Streams to point to:
wss://your-ngrok-url.ngrok-free.app/media-stream?sessionId={{sessionId}}

Use ngrok for local development:
ngrok http ${PORT}

IMPORTANT: Point ngrok to port ${PORT} (this server), not ${NEXTJS_PORT}
This server will proxy all web traffic to Next.js while handling WebSocket connections.
    `);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
