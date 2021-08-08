// Instantiate postgre pool
const Pool = require('pg').Pool;

// Import db credentials
const { db_credentials } = require('./.password.js');

// New DB connection
const pool = new Pool(db_credentials);

module.exports = pool;