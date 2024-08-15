const util = require('util');
const exec = util.promisify(require('child_process').exec);
const { Client } = require('pg');
const fs = require('fs');
const { format } = require('fast-csv');
const path = require('path');
const Papa = require('papaparse');
// const result = require('./sample');

// PostgreSQL client configuration
const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  statement_timeout: 300000, // 2 minutes
  // connectionTimeoutMillis: 5000 // 5 seconds for initial connection
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

// Preprocess rows to handle date fields
const preprocessRow = (row) => {
  const processedRow = { ...row };
  // Convert date fields to string with quotes
  if (processedRow.enrollment_date) {
    processedRow.enrollment_date = row.enrollment_date.toISOString();
  }
  if (processedRow.date_of_assessment) {
    processedRow.date_of_assessment = row.date_of_assessment.toISOString();
  }
  return processedRow;
};



// Fetch data and generate CSV
const generateCSV = async () => {
  const filePath = path.join(__dirname, 'report.csv');
  
  try {
    // const result = await client.query(`
    //   SELECT x.* 
    //   FROM public.program_instance_base_view x
    //   LIMIT 2
    // `);


    // result.rows.forEach(row => {
    //   if (row.enrollment_date) {
    //     row.enrollment_date = row.enrollment_date.toISOString();
    //   }
    //   if (row.date_of_assessment) {
    //     row.date_of_assessment = row.date_of_assessment.toISOString();
    //   }

    //   row.segments = "";
    //   console.log(row)
    // });

    const dummyData = [
      { id: 1, name: 'John Doe', enrollment_date: '2022-03-22T05:00:00.000Z', primarycaregiver: 0 },
      { id: 2, name: 'Jane Doe', enrollment_date: '2024-04-22T05:00:00.000Z', primarycaregiver: 1 }
    ];
    // Convert query result to CSV using PapaParse
    const csv = Papa.unparse(dummyData, {
      quotes: true, // Automatically wrap fields in quotes if necessary
    });

    // Write the CSV to a file
    fs.writeFileSync(filePath, csv);

    console.log('CSV file created successfully:', filePath);

    
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
        return { stdout: error.stdout, stderr: error.stderr, error: error.message };
    }
};

module.exports = { execShellCommand, connectDB, generateCSV };
