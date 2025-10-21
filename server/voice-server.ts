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
import { TwilioRealtimeTransportLayer } from "@openai/agents-extensions";
import { RealtimeAgent, RealtimeSession } from "@openai/agents/realtime";
import Ably from "ably";
import { config } from "dotenv";
import * as path from "path";

// Load environment variables
config({ path: path.join(__dirname, "..", ".env.local") });

const PORT = process.env.VOICE_SERVER_PORT || 5050;
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

// Register WebSocket plugin
fastify.register(FastifyWebSocket);

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
  fastify.get("/media-stream", { websocket: true }, (connection, req) => {
    const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
    const sessionId = searchParams.get("sessionId") || "unknown";

    console.log(`📞 New call connected - Session: ${sessionId}`);

    // Get or create session data
    let sessionData = sessions.get(sessionId);
    if (!sessionData) {
      sessionData = {
        sessionId,
        channelName: `session:${sessionId}`,
        formData: {},
      };
      sessions.set(sessionId, sessionData);
    }

    // Create Ably channel for this session
    const ablyChannel = ablyClient.channels.get(sessionData.channelName);

    // Create OpenAI Realtime Agent with function calling
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
      tools: [
        {
          type: "function",
          name: "updateField",
          description: "Update a field in the food permit application form. This will broadcast the update to the user's mobile device in real-time.",
          parameters: {
            type: "object",
            properties: {
              field: {
                type: "string",
                enum: [
                  "establishmentName",
                  "streetAddress",
                  "establishmentPhone",
                  "establishmentEmail",
                  "ownerName",
                  "ownerPhone",
                  "ownerEmail",
                  "establishmentType",
                  "plannedOpeningDate",
                ],
                description: "The field name to update",
              },
              value: {
                type: "string",
                description: "The value for the field",
              },
            },
            required: ["field", "value"],
          },
        },
        {
          type: "function",
          name: "submitApplication",
          description: "Submit the completed food permit application to the database and end the call",
          parameters: {
            type: "object",
            properties: {
              trackingId: {
                type: "string",
                description: "Generated tracking ID for the application",
              },
            },
            required: ["trackingId"],
          },
        },
      ],
    });

    // Handle function calls from the agent
    agent.on("tool_call", async (toolCall) => {
      console.log(`🔧 Tool call: ${toolCall.name}`, toolCall.parameters);

      if (toolCall.name === "updateField") {
        const { field, value } = toolCall.parameters as { field: string; value: string };

        // Update session data
        if (sessionData) {
          sessionData.formData[field] = value;
        }

        // Broadcast update via Ably
        await ablyChannel.publish("field-update", {
          field,
          value,
          timestamp: Date.now(),
        });

        console.log(`📤 Broadcast field update: ${field} = ${value}`);

        return {
          success: true,
          message: `Updated ${field}`,
        };
      }

      if (toolCall.name === "submitApplication") {
        const { trackingId } = toolCall.parameters as { trackingId: string };

        // Broadcast completion via Ably
        await ablyChannel.publish("session-complete", {
          trackingId,
          timestamp: Date.now(),
        });

        console.log(`✅ Application submitted: ${trackingId}`);

        // Clean up session
        sessions.delete(sessionId);

        return {
          success: true,
          message: "Application submitted successfully",
        };
      }

      return {
        error: "Unknown tool",
      };
    });

    // Create Twilio transport layer
    const twilioTransport = new TwilioRealtimeTransportLayer({
      twilioWebSocket: connection.socket as any,
    });

    // Create realtime session
    const session = new RealtimeSession(agent, {
      transport: twilioTransport,
    });

    // Connect to OpenAI with API key
    session.connect({ apiKey: OPENAI_API_KEY });

    console.log(`🚀 Session started for ${sessionId}`);

    // Handle disconnection
    connection.socket.on("close", () => {
      console.log(`📴 Call ended - Session: ${sessionId}`);
      session.disconnect();
    });

    connection.socket.on("error", (error) => {
      console.error(`❌ WebSocket error for session ${sessionId}:`, error);
      session.disconnect();
    });
  });
});

// Health check endpoint
fastify.get("/health", async () => {
  return { status: "ok", sessions: sessions.size };
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: Number(PORT), host: "0.0.0.0" });
    console.log(`
🎙️  Voice WebSocket Server is running!
📞 WebSocket endpoint: ws://localhost:${PORT}/media-stream
🏥 Health check: http://localhost:${PORT}/health

Configure Twilio Media Streams to point to:
wss://your-domain.com/media-stream?sessionId={{sessionId}}

Use ngrok for local development:
ngrok http ${PORT}
    `);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
