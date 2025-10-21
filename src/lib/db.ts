/**
 * Database Utilities
 *
 * Helper functions for database operations using Vercel Postgres / Neon
 * These functions provide a clean interface for CRUD operations on:
 * - Applications (permit applications)
 * - Sessions (voice + mobile sync sessions)
 */

import { sql } from "@vercel/postgres";

import {
  type ApplicationRecord,
  type CreateApplication,
  type SessionRecord,
  type CreateSession,
  type SessionStatus,
  generateTrackingId,
} from "./schema";

// ============================================================================
// Database Connection
// ============================================================================

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await sql`SELECT NOW()`;
    return !!result;
  } catch (error) {
    console.error("Database connection error:", error);
    return false;
  }
}

// ============================================================================
// Application CRUD Operations
// ============================================================================

/**
 * Create a new permit application
 */
export async function createApplication(
  data: CreateApplication
): Promise<ApplicationRecord> {
  try {
    const trackingId = generateTrackingId();
    const now = new Date();

    const result = await sql`
      INSERT INTO applications (
        tracking_id,
        session_id,
        establishment_name,
        street_address,
        establishment_phone,
        establishment_email,
        owner_name,
        owner_phone,
        owner_email,
        establishment_type,
        planned_opening_date,
        submission_channel,
        submitted_at,
        raw_data
      ) VALUES (
        ${trackingId},
        ${data.sessionId || null},
        ${data.establishmentName},
        ${data.streetAddress},
        ${data.establishmentPhone},
        ${data.establishmentEmail},
        ${data.ownerName},
        ${data.ownerPhone},
        ${data.ownerEmail},
        ${data.establishmentType},
        ${data.plannedOpeningDate.toISOString()},
        ${data.submissionChannel || "web"},
        ${now.toISOString()},
        ${JSON.stringify(data)}
      )
      RETURNING *
    `;

    return result.rows[0] as ApplicationRecord;
  } catch (error) {
    console.error("Error creating application:", error);
    throw new Error("Failed to create application");
  }
}

/**
 * Get a single application by ID
 */
export async function getApplication(id: string): Promise<ApplicationRecord | null> {
  try {
    const result = await sql`
      SELECT * FROM applications
      WHERE id = ${id}
      LIMIT 1
    `;

    return result.rows.length > 0 ? (result.rows[0] as ApplicationRecord) : null;
  } catch (error) {
    console.error("Error getting application:", error);
    throw new Error("Failed to retrieve application");
  }
}

/**
 * Get application by tracking ID
 */
export async function getApplicationByTrackingId(
  trackingId: string
): Promise<ApplicationRecord | null> {
  try {
    const result = await sql`
      SELECT * FROM applications
      WHERE tracking_id = ${trackingId}
      LIMIT 1
    `;

    return result.rows.length > 0 ? (result.rows[0] as ApplicationRecord) : null;
  } catch (error) {
    console.error("Error getting application by tracking ID:", error);
    throw new Error("Failed to retrieve application");
  }
}

/**
 * Get all applications with optional filtering
 */
export async function getAllApplications(filters?: {
  limit?: number;
  offset?: number;
  establishmentName?: string;
  submissionChannel?: string;
}): Promise<{ applications: ApplicationRecord[]; total: number }> {
  try {
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    // Build WHERE conditions
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filters?.establishmentName) {
      conditions.push(`establishment_name ILIKE $${params.length + 1}`);
      params.push(`%${filters.establishmentName}%`);
    }

    if (filters?.submissionChannel) {
      conditions.push(`submission_channel = $${params.length + 1}`);
      params.push(filters.submissionChannel);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get applications
    const applicationsResult = await sql.query(`
      SELECT * FROM applications
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `, [...params, limit, offset]);

    // Get total count
    const countResult = await sql.query(`
      SELECT COUNT(*) as count FROM applications
      ${whereClause}
    `, params);

    return {
      applications: applicationsResult.rows as ApplicationRecord[],
      total: parseInt(countResult.rows[0].count),
    };
  } catch (error) {
    console.error("Error getting applications:", error);
    throw new Error("Failed to retrieve applications");
  }
}

// ============================================================================
// Session CRUD Operations
// ============================================================================

/**
 * Create a new session for voice + mobile sync
 */
export async function createSession(
  data: CreateSession
): Promise<SessionRecord> {
  try {
    const sessionId = crypto.randomUUID();
    const channelName = `session:${sessionId}`;

    const result = await sql`
      INSERT INTO sessions (
        id,
        phone_number,
        status,
        channel_name
      ) VALUES (
        ${sessionId},
        ${data.phoneNumber || null},
        'active',
        ${channelName}
      )
      RETURNING *
    `;

    return result.rows[0] as SessionRecord;
  } catch (error) {
    console.error("Error creating session:", error);
    throw new Error("Failed to create session");
  }
}

/**
 * Get a session by ID
 */
export async function getSession(id: string): Promise<SessionRecord | null> {
  try {
    const result = await sql`
      SELECT * FROM sessions
      WHERE id = ${id}
      LIMIT 1
    `;

    return result.rows.length > 0 ? (result.rows[0] as SessionRecord) : null;
  } catch (error) {
    console.error("Error getting session:", error);
    throw new Error("Failed to retrieve session");
  }
}

/**
 * Update session status
 */
export async function updateSessionStatus(
  id: string,
  status: SessionStatus
): Promise<SessionRecord | null> {
  try {
    const result = await sql`
      UPDATE sessions
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    return result.rows.length > 0 ? (result.rows[0] as SessionRecord) : null;
  } catch (error) {
    console.error("Error updating session status:", error);
    throw new Error("Failed to update session");
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a tracking ID exists
 */
export async function trackingIdExists(_trackingId: string): Promise<boolean> {
  try {
    const result = await sql`
      SELECT 1 FROM applications
      WHERE tracking_id = ${_trackingId}
      LIMIT 1
    `;

    return result.rows.length > 0;
  } catch (error) {
    console.error("Error checking tracking ID:", error);
    return false;
  }
}

/**
 * Get applications by session ID
 */
export async function getApplicationsBySession(
  sessionId: string
): Promise<ApplicationRecord[]> {
  try {
    const result = await sql`
      SELECT * FROM applications
      WHERE session_id = ${sessionId}
      ORDER BY created_at DESC
    `;

    return result.rows as ApplicationRecord[];
  } catch (error) {
    console.error("Error getting applications by session:", error);
    throw new Error("Failed to retrieve applications");
  }
}
