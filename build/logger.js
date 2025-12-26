export function log(message, level = 'info') {
    const logMessage = {
        jsonrpc: '2.0',
        method: 'log',
        params: {
            level,
            message
        }
    };
    process.stdout.write(JSON.stringify(logMessage) + '\n');
}
export function info(message) {
    log(message, 'info');
}
export function error(message) {
    log(message, 'error');
}
