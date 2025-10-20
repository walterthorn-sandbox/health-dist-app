/**
 * Database Utilities
 *
 * Helper functions for database operations using Vercel Postgres
 * These functions provide a clean interface for CRUD operations on:
 * - Applications (permit applications)
 * - Sessions (voice + mobile sync sessions)
 *
 * Note: Connection functions are ready but commented out until Vercel Postgres is available
 */

// Uncomment when Vercel Postgres is available
// import { sql } from "@vercel/postgres";

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
 * Uncomment when Vercel Postgres is available
 */
export async function testConnection(): Promise<boolean> {
  try {
    // TODO: Uncomment when Vercel Postgres is set up
    // const result = await sql`SELECT NOW()`;
    // return !!result;

    console.warn("Database not connected - Vercel Postgres pending setup");
    return false;
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

    // TODO: Replace with real database insert when Vercel Postgres is available
    /*
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
        ${data.plannedOpeningDate},
        ${data.submissionChannel || "web"},
        ${now},
        ${JSON.stringify(data)}
      )
      RETURNING *
    `;

    return result.rows[0] as ApplicationRecord;
    */

    // Mock response for development
    const mockApplication: ApplicationRecord = {
      id: crypto.randomUUID(),
      trackingId,
      sessionId: data.sessionId,
      createdAt: now,
      submittedAt: now,
      establishmentName: data.establishmentName,
      streetAddress: data.streetAddress,
      establishmentPhone: data.establishmentPhone,
      establishmentEmail: data.establishmentEmail,
      ownerName: data.ownerName,
      ownerPhone: data.ownerPhone,
      ownerEmail: data.ownerEmail,
      establishmentType: data.establishmentType,
      plannedOpeningDate: data.plannedOpeningDate,
      submissionChannel: data.submissionChannel || "web",
      rawData: data as any,
    };

    console.log("Mock application created:", mockApplication);
    return mockApplication;
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
    // TODO: Replace with real database query when Vercel Postgres is available
    /*
    const result = await sql`
      SELECT * FROM applications
      WHERE id = ${id}
      LIMIT 1
    `;

    return result.rows.length > 0 ? (result.rows[0] as ApplicationRecord) : null;
    */

    // Mock response for development
    console.log("Mock: Getting application:", id);
    return null; // No mock data for single application yet
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
    // TODO: Replace with real database query when Vercel Postgres is available
    /*
    const result = await sql`
      SELECT * FROM applications
      WHERE tracking_id = ${trackingId}
      LIMIT 1
    `;

    return result.rows.length > 0 ? (result.rows[0] as ApplicationRecord) : null;
    */

    // Mock response for development
    console.log("Mock: Getting application by tracking ID:", trackingId);
    return null;
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

    // TODO: Replace with real database query when Vercel Postgres is available
    /*
    let query = sql`SELECT * FROM applications`;

    const conditions = [];
    if (filters?.establishmentName) {
      conditions.push(sql`establishment_name ILIKE ${'%' + filters.establishmentName + '%'}`);
    }
    if (filters?.submissionChannel) {
      conditions.push(sql`submission_channel = ${filters.submissionChannel}`);
    }

    if (conditions.length > 0) {
      query = sql`${query} WHERE ${sql.join(conditions, sql` AND `)}`;
    }

    query = sql`${query} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const result = await query;
    const countResult = await sql`SELECT COUNT(*) FROM applications`;

    return {
      applications: result.rows as ApplicationRecord[],
      total: parseInt(countResult.rows[0].count),
    };
    */

    // Mock response for development
    const mockApplications: ApplicationRecord[] = [
      {
        id: crypto.randomUUID(),
        trackingId: "APP-20251020-A3F9",
        sessionId: undefined,
        createdAt: new Date("2025-10-20T10:30:00Z"),
        submittedAt: new Date("2025-10-20T10:35:00Z"),
        establishmentName: "Joe's Pizza",
        streetAddress: "123 Main Street, Wenatchee, WA 98801",
        establishmentPhone: "5095551234",
        establishmentEmail: "joe@joespizza.com",
        ownerName: "Joe Smith",
        ownerPhone: "5095555678",
        ownerEmail: "joesmith@gmail.com",
        establishmentType: "Restaurant",
        plannedOpeningDate: new Date("2025-12-01"),
        submissionChannel: "web",
      },
      {
        id: crypto.randomUUID(),
        trackingId: "APP-20251020-B7K2",
        sessionId: undefined,
        createdAt: new Date("2025-10-20T11:15:00Z"),
        submittedAt: new Date("2025-10-20T11:18:00Z"),
        establishmentName: "Taco Truck Express",
        streetAddress: "456 Apple Lane, East Wenatchee, WA 98802",
        establishmentPhone: "5095559999",
        establishmentEmail: "contact@tacotruck.com",
        ownerName: "Maria Garcia",
        ownerPhone: "5095558888",
        ownerEmail: "maria@example.com",
        establishmentType: "Food Truck",
        plannedOpeningDate: new Date("2025-11-15"),
        submissionChannel: "web",
      },
      {
        id: crypto.randomUUID(),
        trackingId: "APP-20251020-C9M4",
        sessionId: undefined,
        createdAt: new Date("2025-10-20T14:22:00Z"),
        submittedAt: new Date("2025-10-20T14:28:00Z"),
        establishmentName: "Sweet Dreams Bakery",
        streetAddress: "789 Cherry Street, Chelan, WA 98816",
        establishmentPhone: "5095557777",
        establishmentEmail: "hello@sweetdreamsbakery.com",
        ownerName: "Sarah Johnson",
        ownerPhone: "5095556666",
        ownerEmail: "sarah@sweetdreams.com",
        establishmentType: "Bakery",
        plannedOpeningDate: new Date("2025-10-30"),
        submissionChannel: "web",
      },
    ];

    console.log("Mock: Getting all applications");
    return {
      applications: mockApplications.slice(offset, offset + limit),
      total: mockApplications.length,
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
    const now = new Date();

    // TODO: Replace with real database insert when Vercel Postgres is available
    /*
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
    */

    // Mock response for development
    const mockSession: SessionRecord = {
      id: sessionId,
      createdAt: now,
      phoneNumber: data.phoneNumber,
      status: "active",
      channelName,
    };

    console.log("Mock session created:", mockSession);
    return mockSession;
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
    // TODO: Replace with real database query when Vercel Postgres is available
    /*
    const result = await sql`
      SELECT * FROM sessions
      WHERE id = ${id}
      LIMIT 1
    `;

    return result.rows.length > 0 ? (result.rows[0] as SessionRecord) : null;
    */

    // Mock response for development
    console.log("Mock: Getting session:", id);
    return null;
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
    // TODO: Replace with real database update when Vercel Postgres is available
    /*
    const result = await sql`
      UPDATE sessions
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    return result.rows.length > 0 ? (result.rows[0] as SessionRecord) : null;
    */

    // Mock response for development
    console.log("Mock: Updating session status:", id, status);
    return null;
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
export async function trackingIdExists(trackingId: string): Promise<boolean> {
  try {
    // TODO: Replace with real database query when Vercel Postgres is available
    /*
    const result = await sql`
      SELECT 1 FROM applications
      WHERE tracking_id = ${trackingId}
      LIMIT 1
    `;

    return result.rows.length > 0;
    */

    // Mock response for development
    return false;
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
    // TODO: Replace with real database query when Vercel Postgres is available
    /*
    const result = await sql`
      SELECT * FROM applications
      WHERE session_id = ${sessionId}
      ORDER BY created_at DESC
    `;

    return result.rows as ApplicationRecord[];
    */

    // Mock response for development
    console.log("Mock: Getting applications by session:", sessionId);
    return [];
  } catch (error) {
    console.error("Error getting applications by session:", error);
    throw new Error("Failed to retrieve applications");
  }
}
