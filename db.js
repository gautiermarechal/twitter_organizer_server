const Pool = require("pg").Pool;

const pool = new Pool({
  user: "postgres",
  password: "bdsjhbsdj",
  host: "localhost",
  port: 5432,
  database: "twitter_organizer",
});

module.exports = pool;
