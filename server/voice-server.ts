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
import Ably from "ably";
import { config } from "dotenv";
import * as path from "path";
import OpenAI from "openai";
import WebSocket from "ws";
import { ConversationSession } from "./braintrust-logger";
import { createApplication } from "../src/lib/db";

// Load environment variables
config({ path: path.join(__dirname, "..", ".env.local") });

// Railway provides PORT, fallback to VOICE_SERVER_PORT for local development
const PORT = process.env.PORT || process.env.VOICE_SERVER_PORT || 5050;
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

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

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
 * URL: ws://localhost:5050/media-stream
 */
fastify.register(async (fastify) => {
  fastify.get("/media-stream", { websocket: true }, async (twilioWs, req) => {
    console.log(`📞 New WebSocket connection from Twilio`);

    let sessionId = "unknown";
    let sessionData: any = null;
    let ablyChannel: any = null;
    let openaiWs: WebSocket | null = null;
    let streamSid: string | null = null;
    let braintrustSession: ConversationSession | null = null;

    // Listen for messages from Twilio
    twilioWs.on("message", async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());

        // Handle start event - this is when we set up the OpenAI connection
        if (message.event === "start") {
          streamSid = message.start.streamSid;
          sessionId = message.start.customParameters?.sessionId || "unknown";

          console.log(`🔑 Session ID: ${sessionId}`);
          console.log(`📡 Stream SID: ${streamSid}`);

          // Set up session data
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
          console.log(`📡 Ably channel name: ${sessionData.channelName}`);

          // Initialize Braintrust session tracking
          braintrustSession = new ConversationSession(sessionId);

          console.log(`🤖 Creating OpenAI Realtime session for ${sessionId}...`);

          // Create OpenAI Realtime session
          const session = await openai.beta.realtime.sessions.create({
            model: "gpt-4o-realtime-preview-2024-12-17",
            voice: "alloy",
            instructions: `You are a helpful assistant for the Riverside County Health District.
Your job is to collect information for a food establishment permit application through a conversational voice call.

You should greet the caller and ask for the following information in a natural, friendly way:
1. Establishment name
2. Street address
3. Establishment phone number
4. Establishment email
5. Owner/operator name
6. Owner phone number
7. Owner email
8. Type of establishment (restaurant, food truck, bakery, etc.)
9. Planned opening date

IMPORTANT INSTRUCTIONS:
- Ask ONE question at a time
- After the user answers, IMMEDIATELY acknowledge their answer and ask the next question - do NOT wait for them to prompt you
- When you collect a piece of information, call the updateField function AND then continue the conversation by asking the next question
- Keep the conversation flowing naturally - don't leave long pauses
- After collecting all information, call the submitApplication function to complete the process`,
            input_audio_format: "g711_ulaw",
            output_audio_format: "g711_ulaw",
            turn_detection: {
              type: "server_vad",
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500,
            },
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
                    },
                    value: {
                      type: "string",
                    },
                  },
                  required: ["field", "value"],
                },
              },
              {
                type: "function",
                name: "submitApplication",
                description: "Submit the completed food permit application",
                parameters: {
                  type: "object",
                  properties: {
                    trackingId: {
                      type: "string",
                    },
                  },
                  required: ["trackingId"],
                },
              },
            ],
          });

          console.log(`✅ OpenAI session created`);

          // Connect to OpenAI Realtime WebSocket
          const url = `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`;
          openaiWs = new WebSocket(url, {
            headers: {
              "Authorization": `Bearer ${OPENAI_API_KEY}`,
              "OpenAI-Beta": "realtime=v1",
            },
          });

          // Handle OpenAI WebSocket connection
          openaiWs.on("open", () => {
            console.log(`🔌 Connected to OpenAI Realtime API`);

            // Send session update to configure the session
            openaiWs!.send(JSON.stringify({
              type: "session.update",
              session: {
                turn_detection: {
                  type: "server_vad",
                  threshold: 0.5,
                  prefix_padding_ms: 300,
                  silence_duration_ms: 1000,  // Wait 1000ms of silence before assuming user is done
                },
                input_audio_format: "g711_ulaw",
                output_audio_format: "g711_ulaw",
                input_audio_transcription: {
                  model: "whisper-1",  // Enable transcription of user speech
                },
                voice: "alloy",
                instructions: session.instructions,
                tools: session.tools,
                tool_choice: "auto",
                temperature: 0.8,
                modalities: ["text", "audio"],
              },
            }));

            console.log(`📝 Session configured`);

            // Send an initial message to trigger the agent to greet the caller
            setTimeout(() => {
              console.log(`👋 Triggering initial greeting`);
              openaiWs!.send(JSON.stringify({
                type: "response.create",
                response: {
                  modalities: ["text", "audio"],
                  instructions: "Greet the caller and start the conversation by asking for the establishment name.",
                },
              }));
            }, 500);  // Small delay to ensure session.update is processed first
          });

          // Handle messages from OpenAI
          openaiWs.on("message", async (data: Buffer) => {
            try {
              const message = JSON.parse(data.toString());

              // Log important events for debugging and Braintrust
              if (message.type === "response.done" || message.type === "response.created" ||
                  message.type === "input_audio_buffer.speech_started" || message.type === "input_audio_buffer.speech_stopped") {
                console.log(`📡 OpenAI event: ${message.type}`);
              }

              // Track conversation turns in Braintrust with transcripts
              if (message.type === "conversation.item.input_audio_transcription.completed") {
                // User speech transcript
                const transcript = message.transcript;
                braintrustSession?.logUserTurn(transcript);
                console.log(`📝 User transcript: ${transcript}`);
              }

              // Track agent text from audio transcript
              if (message.type === "response.audio_transcript.done") {
                const transcript = message.transcript;
                braintrustSession?.logAgentTurn(transcript);
                console.log(`📝 Agent transcript: ${transcript}`);
              }

              if (message.type === "response.done") {
                // Try to extract text from the response
                const response = message.response;
                let agentText = "";

                // Check all output items for text or audio transcripts
                if (response?.output) {
                  for (const item of response.output) {
                    if (item.content) {
                      for (const content of item.content) {
                        if (content.type === "text" && content.text) {
                          agentText += content.text + " ";
                        } else if (content.type === "audio" && content.transcript) {
                          agentText += content.transcript + " ";
                        }
                      }
                    }
                  }
                }

                if (agentText.trim()) {
                  console.log(`📝 Agent text from response.done: ${agentText.trim()}`);
                }
              }

              // Forward audio from OpenAI to Twilio
              if (message.type === "response.audio.delta" && message.delta) {
                const audioPayload = {
                  event: "media",
                  streamSid: streamSid,
                  media: {
                    payload: message.delta,
                  },
                };
                twilioWs.send(JSON.stringify(audioPayload));
              }

              // When speech is detected as stopped, the server VAD will automatically trigger a response
              // No manual intervention needed due to turn_detection configuration

              // Handle function calls
              if (message.type === "response.function_call_arguments.done") {
                const functionName = message.name;
                const args = JSON.parse(message.arguments);

                console.log(`🔧 Function call: ${functionName}`, args);

                if (functionName === "updateField") {
                  // Update session data
                  if (sessionData) {
                    sessionData.formData[args.field] = args.value;
                  }

                  // Broadcast update via Ably
                  try {
                    console.log(`📡 Publishing to channel: ${sessionData.channelName}, event: field-update`);
                    await ablyChannel?.publish("field-update", {
                      field: args.field,
                      value: args.value,
                      timestamp: Date.now(),
                    });
                    console.log(`📤 Broadcast field update: ${args.field} = ${args.value}`);

                    // Track in Braintrust
                    braintrustSession?.logFunctionCall("updateField", args, { success: true });
                  } catch (error) {
                    console.error(`❌ Failed to broadcast update:`, error);
                    braintrustSession?.logFunctionCall("updateField", args, { success: false, error: String(error) });
                  }

                  // Send function call result back to OpenAI
                  openaiWs!.send(JSON.stringify({
                    type: "conversation.item.create",
                    item: {
                      type: "function_call_output",
                      call_id: message.call_id,
                      output: JSON.stringify({ success: true, field: args.field, value: args.value }),
                    },
                  }));

                  // Trigger a new response to continue the conversation
                  openaiWs!.send(JSON.stringify({
                    type: "response.create",
                  }));
                  console.log(`🔄 Triggered new response after updateField`);
                } else if (functionName === "submitApplication") {
                  // Save application to database and broadcast completion
                  try {
                    // Get the form data from session
                    const formData = sessionData?.formData || {};

                    // Prepare application data for database
                    const applicationData = {
                      sessionId: sessionId,
                      establishmentName: formData.establishmentName as string,
                      streetAddress: formData.streetAddress as string,
                      establishmentPhone: formData.establishmentPhone as string,
                      establishmentEmail: formData.establishmentEmail as string,
                      ownerName: formData.ownerName as string,
                      ownerPhone: formData.ownerPhone as string,
                      ownerEmail: formData.ownerEmail as string,
                      establishmentType: formData.establishmentType as string,
                      plannedOpeningDate: new Date(formData.plannedOpeningDate as string),
                      submissionChannel: "voice" as const,
                    };

                    // Save to database
                    const savedApplication = await createApplication(applicationData);
                    console.log(`💾 Application saved to database: ${savedApplication.trackingId}`);

                    // Broadcast completion via Ably with the actual tracking ID
                    await ablyChannel?.publish("session-complete", {
                      trackingId: savedApplication.trackingId,
                      timestamp: Date.now(),
                    });
                    console.log(`✅ Application submitted: ${savedApplication.trackingId}`);

                    // Mark session as completed in Braintrust
                    braintrustSession?.markCompleted();
                    braintrustSession?.logFunctionCall("submitApplication", args, {
                      success: true,
                      trackingId: savedApplication.trackingId
                    });

                    // Send function call result back to OpenAI with the real tracking ID
                    openaiWs!.send(JSON.stringify({
                      type: "conversation.item.create",
                      item: {
                        type: "function_call_output",
                        call_id: message.call_id,
                        output: JSON.stringify({
                          success: true,
                          trackingId: savedApplication.trackingId
                        }),
                      },
                    }));
                  } catch (error) {
                    console.error(`❌ Failed to submit application:`, error);
                    braintrustSession?.logFunctionCall("submitApplication", args, {
                      success: false,
                      error: String(error)
                    });

                    // Send error back to OpenAI
                    openaiWs!.send(JSON.stringify({
                      type: "conversation.item.create",
                      item: {
                        type: "function_call_output",
                        call_id: message.call_id,
                        output: JSON.stringify({
                          success: false,
                          error: "Failed to save application"
                        }),
                      },
                    }));
                  }

                  // Clean up session
                  sessions.delete(sessionId);
                }
              }

              // Log other important events
              if (message.type === "error") {
                console.error(`❌ OpenAI error:`, message);
              }
            } catch (error) {
              console.error(`Error processing OpenAI message:`, error);
            }
          });

          openaiWs.on("error", (error) => {
            console.error(`❌ OpenAI WebSocket error:`, error);
          });

          openaiWs.on("close", () => {
            console.log(`📴 OpenAI WebSocket closed`);
          });
        }

        // Handle media event - forward audio to OpenAI
        if (message.event === "media" && openaiWs && openaiWs.readyState === WebSocket.OPEN) {
          const audioPayload = {
            type: "input_audio_buffer.append",
            audio: message.media.payload,
          };
          openaiWs.send(JSON.stringify(audioPayload));
        }

        // Handle stop event
        if (message.event === "stop") {
          console.log(`⏹️  Stream stopped`);
          if (openaiWs) {
            openaiWs.close();
          }
        }
      } catch (error) {
        // Not a JSON message or error parsing - ignore
      }
    });

    // Handle Twilio WebSocket close
    twilioWs.on("close", async () => {
      console.log(`📴 Twilio WebSocket closed - Session: ${sessionId}`);
      if (openaiWs) {
        openaiWs.close();
      }
      sessions.delete(sessionId);

      // Flush Braintrust session data
      if (braintrustSession) {
        await braintrustSession.flush();
      }
    });

    twilioWs.on("error", (error) => {
      console.error(`❌ Twilio WebSocket error:`, error);
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
wss://your-production-url.railway.app/media-stream

Use ngrok for local development:
ngrok http ${PORT}
    `);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
