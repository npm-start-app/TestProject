import fs from 'fs'

class Loger {
    static logRequest(req, res, next) {
        res.on('finish', async () => {
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Status: ${res.statusCode}`);
        });

        return next()
    }

    static logError(error, req, statusCode) {
        try {
            const logMessage = `[${new Date().toISOString()}] ${req.method} ${req.url} - Status: ${statusCode} \n    ERROR: ${error}\n\n`;
            fs.appendFile('./Loger/runtime_logs.txt', logMessage, (err) => {
                if (err) throw error;
            });
        } catch (error) {
            console.log(error)
        }
    }
}

export default Loger