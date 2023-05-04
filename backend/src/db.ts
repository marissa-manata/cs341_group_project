/*
db.ts
Initialize and expose a connection to the database
*/

import { Pool } from 'pg';

// Initialize a new Pool instance pointing to the database
const db = new Pool({
  user: 'backend',
  host: '15.204.174.153',
  database: 'amaze',
  password: 'password',
  port: 5432,
});

export default db;
