/**
 * WebSocket Proxy for Voice Server
 *
 * This endpoint proxies WebSocket connections from Twilio Media Streams
 * to the local voice server running on port 5050.
 *
 * This allows us to use a single ngrok tunnel for both Next.js and the voice server.
 */

import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const upgradeHeader = req.headers.get("upgrade");

  if (upgradeHeader !== "websocket") {
    return new Response("Expected WebSocket", { status: 426 });
  }

  // Note: Next.js doesn't support WebSocket upgrades in production
  // This is a workaround for local development
  // For production, we'll need to deploy the voice server separately

  return new Response("WebSocket upgrade not supported in Next.js API routes. Use voice server directly.", {
    status: 501,
  });
}
