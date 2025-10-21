/**
 * Database Initialization Script
 *
 * Runs the SQL schema to create tables in Neon Postgres
 */

import { config } from 'dotenv';
import { sql } from '@vercel/postgres';
import * as fs from 'fs';
import * as path from 'path';

// Load .env.local
config({ path: path.join(__dirname, '..', '.env.local') });

async function initDatabase() {
  try {
    console.log('🚀 Initializing database...');
    console.log('📡 Using database:', process.env.POSTGRES_URL?.substring(0, 30) + '...');

    // Read the schema SQL file
    const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Execute the schema
    console.log('📝 Running schema.sql...');
    await sql.query(schema);

    console.log('✅ Database initialized successfully!');
    console.log('');
    console.log('Tables created:');
    console.log('  - sessions');
    console.log('  - applications');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

initDatabase();
