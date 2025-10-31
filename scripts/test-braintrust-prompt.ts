/**
 * Test script to verify Braintrust prompt loading
 * Run with: npx tsx scripts/test-braintrust-prompt.ts
 */

import { loadPrompt } from "braintrust";
import { config } from "dotenv";
import * as path from "path";

// Load environment variables
config({ path: path.join(__dirname, "..", ".env.local") });

const BRAINTRUST_PROJECT_ID = process.env.BRAINTRUST_PROJECT_ID;
const BRAINTRUST_PROMPT_SLUG = process.env.BRAINTRUST_PROMPT_SLUG || "food-permit-voice-agent-v1-ed67";
const BRAINTRUST_API_KEY = process.env.BRAINTRUST_API_KEY;

async function testPromptLoading() {
  console.log("🔍 Testing Braintrust Prompt Loading");
  console.log("=====================================");
  console.log(`Project ID: ${BRAINTRUST_PROJECT_ID}`);
  console.log(`Prompt Slug: ${BRAINTRUST_PROMPT_SLUG}`);
  console.log(`API Key: ${BRAINTRUST_API_KEY ? `${BRAINTRUST_API_KEY.substring(0, 10)}...` : "NOT SET"}`);
  console.log("");

  if (!BRAINTRUST_API_KEY) {
    console.error("❌ BRAINTRUST_API_KEY not set");
    process.exit(1);
  }

  if (!BRAINTRUST_PROJECT_ID) {
    console.error("❌ BRAINTRUST_PROJECT_ID not set");
    process.exit(1);
  }

  try {
    console.log("📥 Loading prompt from Braintrust...");
    const prompt = await loadPrompt({
      projectId: BRAINTRUST_PROJECT_ID,
      slug: BRAINTRUST_PROMPT_SLUG,
    });

    console.log("✅ Prompt loaded successfully!");
    console.log("");
    console.log("📄 Full prompt structure:");
    console.log(JSON.stringify(prompt, null, 2));
    console.log("");

    // Extract system message
    const systemMessage = (prompt.prompt as any)?.messages?.find(
      (msg: any) => msg.role === "system"
    );

    if (systemMessage?.content) {
      console.log("✅ System message found!");
      console.log("");
      console.log("📝 System message content:");
      console.log("=".repeat(80));
      console.log(systemMessage.content);
      console.log("=".repeat(80));
      console.log("");

      // Check for the specific intro text
      if (systemMessage.content.includes("También hablo español")) {
        console.log("✅ Found bilingual intro - this is the correct prompt!");
      } else {
        console.log("⚠️  Bilingual intro NOT found - this might be an old version");
      }
    } else {
      console.log("❌ No system message found in prompt");
      console.log("Prompt structure:", JSON.stringify(prompt, null, 2));
    }
  } catch (error) {
    console.error("❌ Failed to load prompt:");
    console.error(error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    process.exit(1);
  }
}

testPromptLoading();
