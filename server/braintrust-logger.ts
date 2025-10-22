/**
 * Braintrust Logging Utilities for Voice Agent
 *
 * Provides observability and evaluation capabilities for:
 * - Full conversation transcripts
 * - Function calls and outcomes
 * - Session-level metrics (latency, completion rate)
 * - Agent performance evaluation
 */

import { init, initLogger, traced, currentSpan } from "braintrust";

// Get API key - will be loaded by dotenv in voice-server.ts before this module is imported
function getBraintrustApiKey(): string | undefined {
  return process.env.BRAINTRUST_API_KEY;
}

// Initialize the logger lazily
let logger: ReturnType<typeof initLogger> | null = null;

function getLogger() {
  if (logger === null) {
    const apiKey = getBraintrustApiKey();
    if (apiKey) {
      logger = initLogger({
        projectName: "food-permit-voice-agent",
        apiKey,
      });
      console.log("✅ Braintrust logger initialized");
    } else {
      console.warn("⚠️ BRAINTRUST_API_KEY not set - Braintrust logging disabled");
      logger = null;
    }
  }
  return logger;
}

/**
 * Session tracking for conversation-level metrics
 */
export class ConversationSession {
  private sessionId: string;
  private startTime: number;
  private turns: Array<{
    timestamp: number;
    speaker: "user" | "agent";
    text?: string;
    audio?: boolean;
    functionCall?: {
      name: string;
      arguments: any;
      result?: any;
    };
  }> = [];
  private fieldsCollected: Set<string> = new Set();
  private completed: boolean = false;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
    this.startTime = Date.now();
    console.log(`📊 Braintrust session started: ${sessionId}`);
  }

  /**
   * Log a user turn (speech detected)
   */
  logUserTurn(text?: string) {
    this.turns.push({
      timestamp: Date.now(),
      speaker: "user",
      text,
      audio: true,
    });
    console.log(`📊 User turn logged (session: ${this.sessionId})`);
  }

  /**
   * Log an agent turn (response generated)
   */
  logAgentTurn(text?: string) {
    this.turns.push({
      timestamp: Date.now(),
      speaker: "agent",
      text,
      audio: true,
    });
    console.log(`📊 Agent turn logged (session: ${this.sessionId})`);
  }

  /**
   * Log a function call
   */
  logFunctionCall(name: string, args: any, result?: any) {
    this.turns.push({
      timestamp: Date.now(),
      speaker: "agent",
      functionCall: {
        name,
        arguments: args,
        result,
      },
    });

    // Track fields collected
    if (name === "updateField" && args.field) {
      this.fieldsCollected.add(args.field);
    }

    console.log(`📊 Function call logged: ${name} (session: ${this.sessionId})`);
  }

  /**
   * Mark session as completed
   */
  markCompleted() {
    this.completed = true;
    console.log(`📊 Session marked as completed: ${this.sessionId}`);
  }

  /**
   * Calculate session metrics
   */
  private getMetrics() {
    const duration = Date.now() - this.startTime;
    const userTurns = this.turns.filter(t => t.speaker === "user").length;
    const agentTurns = this.turns.filter(t => t.speaker === "agent").length;
    const functionCalls = this.turns.filter(t => t.functionCall).length;

    // Required fields for a complete application
    const requiredFields = [
      "establishmentName",
      "streetAddress",
      "establishmentPhone",
      "establishmentEmail",
      "ownerName",
      "ownerPhone",
      "ownerEmail",
      "establishmentType",
      "plannedOpeningDate",
    ];

    const completionRate = this.fieldsCollected.size / requiredFields.length;

    return {
      duration_ms: duration,
      duration_seconds: Math.round(duration / 1000),
      user_turns: userTurns,
      agent_turns: agentTurns,
      function_calls: functionCalls,
      fields_collected: Array.from(this.fieldsCollected),
      fields_collected_count: this.fieldsCollected.size,
      completion_rate: completionRate,
      completed: this.completed,
    };
  }

  /**
   * Flush session to Braintrust
   */
  async flush() {
    const logger = getLogger();
    if (!logger) {
      console.log("⚠️ Braintrust logger not initialized - skipping flush");
      return;
    }

    const metrics = this.getMetrics();

    try {
      // Log the full conversation directly to the logger
      logger.log({
        input: {
          session_id: this.sessionId,
          started_at: new Date(this.startTime).toISOString(),
        },
        output: {
          completed: this.completed,
          fields_collected: Array.from(this.fieldsCollected),
          conversation: this.turns,
        },
        metadata: {
          ...metrics,
          project: "food-permit-voice-agent",
          experiment: "voice-conversation",
        },
        metrics: {
          duration: metrics.duration_seconds,
          completion_rate: metrics.completion_rate,
          turns: metrics.user_turns + metrics.agent_turns,
          function_calls: metrics.function_calls,
        },
        scores: {
          // Score based on completion rate
          completion: metrics.completion_rate,
          // Score based on efficiency (fewer turns = better)
          efficiency: Math.max(0, 1 - (metrics.user_turns + metrics.agent_turns) / 30),
        },
      });

      // Flush the logger to send data to Braintrust
      await logger.flush();

      console.log(`📊 Flushed session to Braintrust: ${this.sessionId}`, metrics);
    } catch (error) {
      console.error(`❌ Failed to flush Braintrust session:`, error);
    }
  }
}

/**
 * Track an individual OpenAI event
 */
export async function logOpenAIEvent(
  sessionId: string,
  eventType: string,
  data: any
) {
  const logger = getLogger();
  if (!logger) return;

  try {
    logger.log({
      input: { session_id: sessionId, event_type: eventType },
      output: data,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Failed to log OpenAI event:", error);
  }
}

/**
 * Export Braintrust init for evals
 */
export { init as initBraintrust };
