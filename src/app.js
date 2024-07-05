const express = require('express');
const { exec } = require('child_process');

const app = express();

app.use(express.json());

// Route to restart LXC container 'layer'
app.post('/run-report', async (req, res) => {
    try {
        // Restart LXC container 'layer'
        const { stdout, stderr } = await exec('lxc restart layer');
        console.log('Restarting container:', stdout);
        res.status(200).send('Container restarted successfully.');
    } catch (e) {
        console.error('Error restarting container:', e);
        res.status(500).send('Failed to restart container.');
    }
});

// Route to restart LXC container 'layer'
app.post('/stop-report', async (req, res) => {
    try {
        // Restart LXC container 'layer'
        const { stdout, stderr } = await exec('lxc stop layer');
        console.log('Stopping container:', stdout);
        res.status(200).send('Container stopped successfully.');
    } catch (e) {
        console.error('Error stopping container:', e);
        res.status(500).send('Failed to stop container.');
    }
});

// Route to run script 'insert.js'
app.post('/run-update', async (req, res) => {
    try {
        // Run script 'insert.js'
        const { stdout, stderr } = await exec('lxc exec layer -- node app/insert.js');
        console.log('Running insert script:', stdout);
        res.status(200).send('Script executed successfully.');
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
