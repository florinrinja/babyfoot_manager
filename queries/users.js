module.exports = (function () {
  const self = {};

  const pool = require('../db');
  const formatQuery = require('../utils/query');

  // Get all users from database
  self.allUsers = async (options) => {
    // General query
    const query = {
      text: `
        SELECT 
          *
        FROM
          users
        `
    };

    // Get array of where statements from query
    const where = formatQuery(options);
    // If criteria were added, append to query text
    if (where.length > 0) {
      query.text += ` where ${where.join(' and ')}`;
    };

    // Add order to the query 
    query.text += ` ORDER BY id ASC`;

    // Query and return results or error
    try {
      const results = await pool.query(query);

      return results.rows;
    } catch (error) {
      console.log(error);

      return error;
    }
  }

  return self;
})();
