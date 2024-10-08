// require('dotenv').config();
const express = require('express');
const { exec } = require('child_process');
const { execShellCommand, connectDB, generateCSV, parseOrgQueryString } = require('./util');

const app = express();

app.use(express.json());

connectDB().catch(err => {
    console.error('Failed to connect to the database');
    process.exit(1);  
});


app.get('/download-report', (req, res, next) => {
    req.setTimeout(1200000);  // 20 minutes
    next();
}, async (req, res) => {
    const orgQueryString = req.query.org || "[]";
    const codeQueryString = req.query.code;
    const periodQueryString = req.query.period;

    console.log({periodQueryString});
    try {
        const orgArray = parseOrgQueryString(orgQueryString);
        const period = !!periodQueryString ? JSON.parse(periodQueryString) : null;
        const filePath = await generateCSV(orgArray, codeQueryString, period);
        res.download(filePath);
      } catch (err) {
        console.error("Error: ", err);
        res.status(500).send('Error generating report');
      }
});

// Route to check the status of the container
app.post('/check-report', async (req, res) => {
    try {
        const { stdout, stderr } = await execShellCommand('lxc list layer --format json');
        const containers = JSON.parse(stdout);
        const layerContainer = containers.find(container => container.name === 'layer');
        
        if (layerContainer && layerContainer.status === 'Running') {
            res.json({ status: 'running' });
        } else {
            res.json({ status: 'stopped' });
        }
    } catch (e) {
        console.error('Error checking container status:', e);
        res.status(500).send('Failed to check container status.');
    }
});


// Route to restart LXC container 'layer'
app.post('/run-report', async (req, res) => {
    try {
        const { stdout, stderr } = await execShellCommand('lxc start layer');
        console.log('Starting container, stdout:', stdout);
        console.log('Starting container, stderr:', stderr);
        res.status(200).send('Container restarted successfully.');
    } catch (e) {
        console.error('Error starting container:', e.stderr);
        res.status(500).send('Failed to start container.');
    }
});

// Route to stop LXC container 'layer'
app.post('/stop-report', async (req, res) => {
    try {
        const { stdout, stderr } = await execShellCommand('lxc stop layer');
        console.log('Stopping container, stdout:', stdout);
        console.log('Stopping container, stderr:', stderr);
        res.status(200).send('Container stopped successfully.');
    } catch (e) {
        console.error('Error stopping container:', e.stderr);
        res.status(500).send('Failed to stop container.');
    }
});

// Route to run script 'insert.js'
app.post('/run-update', async (req, res) => {
    try {
        // Run script 'insert.js'
        const { stdout, stderr, error } = await execShellCommand('lxc exec layer -- bash -c "source /root/.nvm/nvm.sh && cd /root/icyd-app && pm2 start insert.js"');
        console.log('Running insert script, stdout:', stdout);
        console.log('Running insert script, stderr:', stderr);
        if (error) {
            console.error('Error running insert script:', error);
            res.status(500).send('Failed to execute script.');
        } else {
            res.status(200).send('Script executed successfully.');
        }
    } catch (e) {
        console.error('Error running insert script:', e);
        res.status(500).send('Failed to execute script.');
    }
});

app.get('/', (req, res) => {
    res.send('Hello, World!');
});


const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
