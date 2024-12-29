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
const generateCSV = async (orgs = null, code = null, period = null, startRec = 1, endRec = 20000) => {
  const filePath = path.join(__dirname, 'report.csv');
  const currentTime = Date.now();

  const cacheKey = JSON.stringify({ orgs, code, period });
  // Extract start date from the period object
  const startDate = period ? period.start : null;
  const endDate = period ? period.end : null;

  // Extract orgunit (could be multiple values, so array handling is needed)
  const orgunits = Array.isArray(orgs) ? orgs : [orgs];
  const orgUnit = orgunits[0];
  // const startRec = 1;
  // const endRec = 20000;

  // Check if the cached file is still valid
  if (cache.filePath && cache.key === cacheKey && currentTime - cache.timestamp < 300000) { // 5 minutes
    console.log('Serving cached CSV file:', cache.filePath);
    return cache.filePath;
  }

  try {

    //`SELECT x.* 
    //FROM program_instance_base_view x 
    //WHERE x."Beneficiary ID" IN (
    //   'KM-02/KD-6975-01', 
    //    'KM-04/ND-7436-02', 
    //   'KM-04/ND-5519-02', 
    //   'KM-04/ND-1519-04', 
    //    'KM-04/ND-7564-02', 
    //    'KM-04/ND-7754-02', 
    //    'KM-04/ND-7638-05', 
    //    'KM-04/ND-9513-05', 
    //    'KM-04/ND-6263-02', 
    //    'KM-04/ND-6558-02'
    //)`;


    const queryParams = [];
    const conditions = [];

    console.log({ Org_Unit: orgUnit, Start_Date: startDate});
    console.log({ orgs: orgunits, code, period });

    let query;

      // Check if orgunit contains the word 'division'
        if (orgUnit.toLowerCase().includes('division')) {
          // Check if startRec and endRec are set
          if (startRec && endRec) {
              query = `
                  SELECT * FROM get_indicators(${startRec}, ${endRec}, '"''${startDate}'' AND ''${endDate}''', '"subcounty/division" IN (''${orgUnit}'')')
              `;
          } else {
              // Alert message for missing startRec and endRec
              alert("Start Record and End Record not set");
              // Use default values if startRec and endRec are not set
              query = `
                  SELECT * FROM get_indicators(1, 100000, '"''2024-10-01'' AND ''2024-12-31''', '"subcounty/division" IN (''${orgUnit}'')')
              `;
          }
      } else {
          // Check if startRec and endRec are set
          if (startRec && endRec) {
              query = `
                  SELECT * FROM get_indicators(${startRec}, ${endRec}, '"''${startDate}'' AND ''${endDate}''', '"parish" IN (''${orgUnit}'')')
              `;
          } else {
              // Alert message for missing startRec and endRec
              alert("Start Record and End Record not set");
              // Use default values if startRec and endRec are not set
              query = `
                  SELECT * FROM get_indicators(1, 10000, '"''2024-10-01'' AND ''2024-12-31''', '"parish" IN (''${orgUnit}'')')
              `;
          }
      }

      // let query = //`
      // SELECT x.*
      // FROM program_instance_base_table x`;
      // `SELECT x.* FROM get_indicators(1, 1000, '"Enrollment Date" >= '2024-07-06' AND "Parish" = 'Bukesa'') x`;
      // `SELECT * FROM get_indicators(0, 1000, '"''2024-01-01'' AND ''2024-12-31''', '"parish" IN (''Bukesa'')')` ;
      // `SELECT *
      //   FROM get_indicators(
      //       0,
      //       1000,
      //       '''2024-01-01'' AND ''2024-12-31''', '"subcounty/division" = ''Nakawa Division'''
      //   )`;
        // `SELECT * FROM get_indicators(0, 1000)`

    //    if (!!orgunits && orgunits.length > 0) {
    //      const placeholders = orgunits.map((_, index) => `$${index + 1}`).join(', ');
    //query += ` WHERE "subcounty/division_uid" IN (${placeholders})`;
    //      query += ` WHERE "subcounty/division_uid" IN (${placeholders})`;
    //	queryParams.push(...orgunits);
    //    }

    //    if (!!code) {
    //      conditions.push(`"beneficiaryid" = $${queryParams.length + 1}`);
    //      queryParams.push(code);
    //    }

    //    if (!!period && period.start && period.end) {
    //      conditions.push(`"enrollment_date" >= $${queryParams.length + 1}`);
    //      conditions.push(`"enrollment_date" <= $${queryParams.length + 2}`);
    //      queryParams.push(period.start);
    //      queryParams.push(period.end);
    //    }

    //    if (conditions.length > 0) {
    //      query += queryParams.length > 0 ? ' AND' : ' WHERE';
    //      query += ` ${conditions.join(' AND ')}`;
    //    }

    //    query += ` LIMIT 10000`;

    console.log("Query: ", query);

    const result = await client.query(query);

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
    cache.timestamp = 0; //currentTime;
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
