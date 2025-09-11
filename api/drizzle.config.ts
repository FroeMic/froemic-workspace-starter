const { defineConfig } = require('drizzle-kit');
const dotenv = require('dotenv');
const { join } = require('path');

// Load environment variables from root .env file
dotenv.config({ path: join(__dirname, '../.env') });

module.exports = defineConfig({
  schema: './src/db/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});