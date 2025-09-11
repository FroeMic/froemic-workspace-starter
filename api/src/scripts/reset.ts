import { sql } from 'drizzle-orm';
import { db, connection } from '../db/index.js';

async function resetDatabase() {
  console.log('Resetting database...');
  
  try {
    // Drop all tables
    await db.execute(sql`DROP TABLE IF EXISTS sessions CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS jokes CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS users CASCADE`);
    
    console.log('Database reset completed!');
    console.log('Run migrations to recreate tables.');
  } catch (error) {
    console.error('Database reset failed:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

resetDatabase();