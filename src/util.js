const util = require('util');
const exec = util.promisify(require('child_process').exec);
const { Client } = require('pg');

// PostgreSQL client configuration
const client = new Client({
  host: '204.27.60.226',
  port: 5433,
  user: 'sk',
  password: 'sk123',
  database: 'ovc'
});

// Connect to PostgreSQL
const connectDB = async () => {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');
  } catch (err) {
    console.error('Connection error', err.stack);
    throw err;
  }
};

// Query the view
const fetchReportData = async () => {
  try {
    const result = await client.query('SELECT x.* FROM public.program_instance_base_view x');
    return result.rows;
  } catch (err) {
    console.error('Query error', err.stack);
    throw err;
  }
};

// Utility function to execute shell commands and log output
const execShellCommand = async (cmd) => {
    try {
        const { stdout, stderr } = await exec(cmd);
        return { stdout, stderr };
    } catch (error) {
        return { stdout: error.stdout, stderr: error.stderr, error: error.message };
    }
};

module.exports = { execShellCommand, connectDB, fetchReportData };
