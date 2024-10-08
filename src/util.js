const util = require('util');
const exec = util.promisify(require('child_process').exec);
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

// PostgreSQL client configuration
const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  statement_timeout: 960000, // 16 minutes
  connectionTimeoutMillis: 10000 // 10 seconds for initial connection
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

// Cache to store the file path and the timestamp
let cache = {
  filePath: null,
  timestamp: null,
  key: null,
};

// Fetch data and generate CSV
const generateCSV = async (orgs = null, code = null, period = null) => {
  const filePath = path.join(__dirname, 'report.csv');
  const currentTime = Date.now();

  const cacheKey = JSON.stringify({ orgs, code, period });

  // Check if the cached file is still valid
  if (cache.filePath && cache.key === cacheKey && currentTime - cache.timestamp < 300000) { // 5 minutes
    console.log('Serving cached CSV file:', cache.filePath);
    return cache.filePath;
  }

  try {
    let query = `
      SELECT x.* 
      FROM public.program_instance_base_view x`;

    const queryParams = [];
    const conditions = [];

    const orgunits = Array.isArray(orgs) ? orgs : [orgs];
    console.log({ orgs: orgunits, code, period });

    if (!!orgunits && orgunits.length > 0) {
      const placeholders = orgunits.map((_, index) => `$${index + 1}`).join(', ');
      query += ` WHERE "parish_uid" IN (${placeholders})`;
      queryParams.push(...orgunits);
    }

    if (!!code) {
      conditions.push(`"beneficiaryid" = $${queryParams.length + 1}`);
      queryParams.push(code);
    }

    if (!!period && period.start && period.end) {
      conditions.push(`"enrollment_date" >= $${queryParams.length + 1}`);
      conditions.push(`"enrollment_date" <= $${queryParams.length + 2}`);
      queryParams.push(period.start);
      queryParams.push(period.end);
    }

    if (conditions.length > 0) {
      query += queryParams.length > 0 ? ' AND' : ' WHERE';
      query += ` ${conditions.join(' AND ')}`;
    }

    query += ` LIMIT 10000`;

    console.log("Query: ", query);

    const result = await client.query(query, queryParams);

    // Extract headers from result.fields
    const headers = result.fields.map(field => field.name);

    // Convert query result to CSV using PapaParse
    const csv = Papa.unparse(result.rows, {
      header: true, // Use the headers
      quotes: true, // Automatically wrap fields in quotes if necessary
      fields: headers // Ensure fields are ordered correctly
    });

    // Write the CSV to a file
    fs.writeFileSync(filePath, csv);

    console.log('CSV file created successfully:', filePath);

    // Update the cache with the new file path and timestamp
    cache.filePath = filePath;
    cache.timestamp = currentTime;
    cache.key = cacheKey;

    return filePath;
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
		return {
			stdout: error.stdout,
			stderr: error.stderr,
			error: error.message,
		};
	}
};

function parseOrgQueryString(input) {
  const trimmedInput = input.trim();

  // Check if the input is a JSON array by looking for square brackets
  if (trimmedInput.startsWith('[') && trimmedInput.endsWith(']')) {
    return JSON.parse(trimmedInput);
  }

  return [trimmedInput.replace(/^"|"$/g, '')];
}

module.exports = { execShellCommand, connectDB, generateCSV, parseOrgQueryString };
