const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const env = require('../config/env');

const queryClient = postgres(env.DATABASE_URL);
const db = drizzle(queryClient);

module.exports = {
  db,
  queryClient
};
