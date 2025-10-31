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
import { createApplication, createOrUpdateDraftApplication } from "../src/lib/db";
import { loadPrompt } from "braintrust";

// Load environment variables
config({ path: path.join(__dirname, "..", ".env.local") });

// Railway provides PORT, fallback to VOICE_SERVER_PORT for local development
const PORT = process.env.PORT || process.env.VOICE_SERVER_PORT || 5050;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ABLY_API_KEY = process.env.ABLY_API_KEY;
const BRAINTRUST_PROMPT_SLUG = process.env.BRAINTRUST_PROMPT_SLUG || "food-permit-voice-agent-v1-ed67";
const BRAINTRUST_PROJECT_ID = process.env.BRAINTRUST_PROJECT_ID;

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
  shouldEndCall?: boolean;
}>();

/**
 * Fetch the voice agent prompt from Braintrust
 * Falls back to hardcoded prompt if fetch fails
 */
async function getVoiceAgentInstructions(): Promise<string> {
  const fallbackInstructions = `You are a helpful assistant for the Riverside County Health District.
Your job is to collect information for a food establishment permit application through a conversational voice call.

You should greet the caller, then introduce yourself with the following:
"I am an AI assistant from the Riverside County Health District. I’m going to help you prepare your food establishment permit application today. También hablo español, así que si prefiere, puede responder con ‘español’ para continuar en español. I’ll ask you a series of questions, and you can ask me questions or correct any of your responses at any time. Are you ready to get started?"

Once the user confirms, proceed to ask for the following information in a natural, friendly way:
1. Establishment name
2. Street address (must include city, state, zip)
3. Establishment phone number (must include area code. format as 000-000-0000)
4. Establishment email
5. Type of establishment (must be one of: Restaurant, Food Truck, Catering, Bakery, Cafe, Other) - values are case sensitive
6. Owner/operator name
7. Owner phone number
8. Owner email
9. Planned opening date

IMPORTANT INSTRUCTIONS:
- If the user at any point says 'Espaňol', respond in Spanish for the rest of the session unless explicitly requested to return to english. If the user requests to use Spanish during the introduction, repeat the introduction fully in spanish
- Ask ONE question at a time
- After the user answers, IMMEDIATELY acknowledge their answer and ask the next question - do NOT wait for them to prompt you
- When you collect a piece of information, call the updateField function AND then continue the conversation by asking the next question
- If any of the updateField functions fail, attempt to fix the input until they succeed
- Keep the conversation flowing naturally - don't leave long pauses
- After collecting all information, call the submitApplication function to complete the process
- If the submitApplication function fails, work with the caller to fix any invalid fields until it succeeds. Do not end the call until the application has successfully been submitted
- Once the application is successfully submitted, read the tracking ID to the user, then end the call

IMPORTANT DATE FORMATTING:
- When submitting the planned opening date, you MUST format it as YYYY-MM-DD (year-month-day with leading zeros)
- Examples: 2025-03-15, 2025-12-01, 2026-01-30
- If the caller says "March 15th, 2025", you should convert it to "2025-03-15"
- If the caller says "next month", ask them for a specific date

ENDING THE CALL:
- After you have submitted the application and told the caller their tracking ID, have a proper closing conversation
- Ask if they have any questions
- Once the caller says goodbye or indicates they're done, respond with a friendly goodbye
- Then call the endCall() function to terminate the call
- IMPORTANT: Only call endCall() after the caller has acknowledged your goodbye - don't abruptly end the call
`;

  try {
    // Load prompt from Braintrust
    console.log(`🔍 Loading prompt from Braintrust: projectId="${BRAINTRUST_PROJECT_ID}", slug="${BRAINTRUST_PROMPT_SLUG}"`);

    const prompt = await loadPrompt({
      projectId: BRAINTRUST_PROJECT_ID,
      slug: BRAINTRUST_PROMPT_SLUG,
    });

    console.log(`🔍 Prompt loaded successfully`);

    // Extract the system message content
    // Try both possible structures:
    // 1. prompt.metadata.prompt_data.prompt.messages (new structure)
    // 2. prompt.prompt.messages (old structure)
    let systemMessage: any = null;

    // Try new structure first
    if ((prompt as any).metadata?.prompt_data?.prompt?.messages) {
      systemMessage = (prompt as any).metadata.prompt_data.prompt.messages.find(
        (msg: any) => msg.role === "system"
      );
      console.log(`🔍 Found system message in metadata.prompt_data.prompt.messages`);
    }
    // Fall back to old structure
    else if ((prompt as any).prompt?.messages) {
      systemMessage = (prompt as any).prompt.messages.find(
        (msg: any) => msg.role === "system"
      );
      console.log(`🔍 Found system message in prompt.messages`);
    }

    if (systemMessage?.content) {
      console.log("✅ Loaded prompt from Braintrust");
      console.log(`📝 Prompt content preview: ${systemMessage.content.substring(0, 150)}...`);

      // Verify it has the bilingual intro
      if (systemMessage.content.includes("También hablo español")) {
        console.log("✅ Confirmed: Bilingual intro present in loaded prompt");
      } else {
        console.warn("⚠️  Warning: Bilingual intro NOT found in loaded prompt");
      }

      return systemMessage.content;
    }

    console.warn("⚠️  No system message in Braintrust prompt, using fallback");
    console.warn("⚠️  Prompt structure:", JSON.stringify(prompt, null, 2));
    return fallbackInstructions;
  } catch (error) {
    console.warn("⚠️  Failed to load prompt from Braintrust, using fallback:", error);
    console.warn("⚠️  Error details:", error instanceof Error ? error.message : String(error));
    return fallbackInstructions;
  }
}

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

          // Fetch prompt from Braintrust
          const instructions = await getVoiceAgentInstructions();

          // Log the instructions being used for this session
          console.log(`📋 Instructions being sent to OpenAI (first 300 chars):`);
          console.log(`"${instructions.substring(0, 300)}..."`);
          console.log(`📏 Total instruction length: ${instructions.length} characters`);

          // Verify bilingual intro is in the instructions
          if (instructions.includes("También hablo español")) {
            console.log(`✅ VERIFIED: Bilingual intro IS in instructions being sent to OpenAI`);
          } else {
            console.error(`❌ ERROR: Bilingual intro is NOT in instructions being sent to OpenAI`);
          }

          // Create OpenAI Realtime session
          const session = await openai.beta.realtime.sessions.create({
            model: "gpt-4o-realtime-preview-2024-12-17",
            voice: "alloy",
            instructions,
            input_audio_format: "g711_ulaw",
            output_audio_format: "g711_ulaw",
            turn_detection: {
              type: "server_vad",
              threshold: 0.6, // Increased from 0.5 to reduce background noise sensitivity
              prefix_padding_ms: 300,
              silence_duration_ms: 700, // Increased from 500ms to give users more time to speak
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
                description: "Submit the completed food permit application. Call this only when all required fields have been collected.",
                parameters: {
                  type: "object",
                  properties: {},
                  required: [],
                },
              },
              {
                type: "function",
                name: "endCall",
                description: "End the phone call gracefully. Call this after you have finished the conversation, said goodbye to the caller, and they have acknowledged. This will terminate the call.",
                parameters: {
                  type: "object",
                  properties: {},
                  required: [],
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

            // Log what we're sending in session.update
            const instructionsToSend = session.instructions || instructions;
            console.log(`📤 Sending session.update to OpenAI with instructions (first 300 chars):`);
            console.log(`"${instructionsToSend.substring(0, 300)}..."`);

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

                // Check if we should end the call after this response
                if (sessionData?.shouldEndCall) {
                  console.log(`📞 Final message delivered, ending call in 3 seconds...`);
                  setTimeout(() => {
                    console.log(`📞 Closing Twilio WebSocket to end call`);
                    twilioWs.close();
                  }, 3000); // Give 3 seconds for audio to finish playing
                }
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
                  const { field, value } = args;
                  let normalizedValue = value;
                  let validationError: string | null = null;

                  // Validate and normalize establishmentType
                  if (field === "establishmentType") {
                    const validTypes = ["Restaurant", "Food Truck", "Catering", "Bakery", "Cafe", "Other"];
                    // Find case-insensitive match
                    const matchedType = validTypes.find(
                      (type) => type.toLowerCase() === value.toLowerCase()
                    );

                    if (matchedType) {
                      normalizedValue = matchedType;
                      console.log(`✅ Normalized establishment type: "${value}" → "${normalizedValue}"`);
                    } else {
                      validationError = `Invalid establishment type "${value}". Valid types are: ${validTypes.join(", ")}. Please ask the caller to choose one of these types.`;
                      console.log(`❌ Invalid establishment type: "${value}"`);
                    }
                  }

                  // If validation failed, return error to agent
                  if (validationError) {
                    braintrustSession?.logFunctionCall("updateField", args, { success: false, error: validationError });

                    openaiWs!.send(JSON.stringify({
                      type: "conversation.item.create",
                      item: {
                        type: "function_call_output",
                        call_id: message.call_id,
                        output: JSON.stringify({ success: false, error: validationError }),
                      },
                    }));

                    // Trigger response so agent can ask for valid value
                    openaiWs!.send(JSON.stringify({
                      type: "response.create",
                    }));
                    console.log(`🔄 Triggered response after validation error`);
                  } else {
                    // Update session data with normalized value
                    if (sessionData) {
                      sessionData.formData[field] = normalizedValue;
                    }

                    // Broadcast update via Ably
                    try {
                      console.log(`📡 Publishing to channel: ${sessionData.channelName}, event: field-update`);
                      await ablyChannel?.publish("field-update", {
                        field: field,
                        value: normalizedValue,
                        timestamp: Date.now(),
                      });
                      console.log(`📤 Broadcast field update: ${field} = ${normalizedValue}`);

                      // Save draft application to database (incomplete applications)
                      try {
                        await createOrUpdateDraftApplication(sessionId, sessionData.formData);
                      } catch (draftError) {
                        console.error(`⚠️  Failed to save draft application:`, draftError);
                        // Don't fail the field update if draft save fails
                      }

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
                        output: JSON.stringify({ success: true, field: field, value: normalizedValue }),
                      },
                    }));

                    // Trigger a new response to continue the conversation
                    openaiWs!.send(JSON.stringify({
                      type: "response.create",
                    }));
                    console.log(`🔄 Triggered new response after updateField`);
                  }
                } else if (functionName === "submitApplication") {
                  // Save application to database and broadcast completion
                  try {
                    // Get the form data from session
                    const formData = sessionData?.formData || {};
                    console.log(`📝 Form data to save:`, formData);

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
                      establishmentType: formData.establishmentType as "Restaurant" | "Food Truck" | "Catering" | "Bakery" | "Cafe" | "Bar" | "Food Cart" | "Other",
                      plannedOpeningDate: new Date(formData.plannedOpeningDate as string),
                      submissionChannel: "voice" as const,
                    };

                    // Save to database
                    console.log(`💾 Saving application to database...`);
                    const savedApplication = await createApplication(applicationData);
                    console.log(`✅ Application saved to database with tracking ID: ${savedApplication.trackingId}`);

                    // Broadcast completion via Ably with the actual tracking ID
                    await ablyChannel?.publish("session-complete", {
                      trackingId: savedApplication.trackingId,
                      timestamp: Date.now(),
                    });
                    console.log(`📡 Broadcast session-complete for: ${savedApplication.trackingId}`);

                    // Mark session as completed in Braintrust
                    braintrustSession?.markCompleted();
                    braintrustSession?.logFunctionCall("submitApplication", {}, {
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
                          trackingId: savedApplication.trackingId,
                          message: `Your application has been submitted successfully. Your tracking ID is ${savedApplication.trackingId}. You will receive a confirmation email shortly.`
                        }),
                      },
                    }));

                    // Trigger a response so the agent can tell the user the tracking ID
                    openaiWs!.send(JSON.stringify({
                      type: "response.create",
                    }));
                  } catch (error) {
                    console.error(`❌ Failed to submit application:`, error);
                    braintrustSession?.logFunctionCall("submitApplication", {}, {
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
                          error: "Failed to save application. Please try again or submit via our website."
                        }),
                      },
                    }));

                    // Trigger a response so the agent can tell the user about the error
                    openaiWs!.send(JSON.stringify({
                      type: "response.create",
                    }));
                  }

                  // Clean up session
                  sessions.delete(sessionId);
                } else if (functionName === "endCall") {
                  // End the call gracefully
                  console.log(`📞 Agent requested to end call`);

                  // Log in Braintrust
                  braintrustSession?.logFunctionCall("endCall", {}, { success: true });

                  // Send function call result back to OpenAI
                  openaiWs!.send(JSON.stringify({
                    type: "conversation.item.create",
                    item: {
                      type: "function_call_output",
                      call_id: message.call_id,
                      output: JSON.stringify({ success: true }),
                    },
                  }));

                  // Trigger final response
                  openaiWs!.send(JSON.stringify({
                    type: "response.create",
                  }));

                  // Set flag to end call after final response
                  sessionData.shouldEndCall = true;
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
