const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'portal',
  user: process.env.DB_USER || 'portal',
  password: process.env.PORTAL_DB_PASSWORD,
});

module.exports = pool;
