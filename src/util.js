const util = require('util');
const exec = util.promisify(require('child_process').exec);

// Utility function to execute shell commands and log output
export const execShellCommand = async (cmd) => {
    try {
        const { stdout, stderr } = await exec(cmd);
        return { stdout, stderr };
    } catch (error) {
        return { stdout: error.stdout, stderr: error.stderr, error: error.message };
    }
};