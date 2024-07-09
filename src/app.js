const express = require('express');
const { exec } = require('child_process');

const app = express();

app.use(express.json());

const execShellCommand = (cmd) => {
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                reject({ error, stdout, stderr });
            } else {
                resolve({ stdout, stderr });
            }
        });
    });
};


// Route to restart LXC container 'layer'
app.post('/run-report', async (req, res) => {
    try {
        const { stdout, stderr } = await execShellCommand('lxc restart layer');
        console.log('Restarting container, stdout:', stdout);
        console.log('Restarting container, stderr:', stderr);
        res.status(200).send('Container restarted successfully.');
    } catch (e) {
        console.error('Error restarting container:', e.stderr);
        res.status(500).send('Failed to restart container.');
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
