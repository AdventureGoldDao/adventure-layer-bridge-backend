const { logConfig } = require('./env');
const winston = require('winston');
require('winston-daily-rotate-file');

// create logger instance
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.DailyRotateFile({
            filename: logConfig.errorFilename || 'logs/error-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxFiles: logConfig.maxFiles
        }),
        new winston.transports.DailyRotateFile({
            filename: logConfig.combinedFilename || 'logs/combined-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxFiles: logConfig.maxFiles
        })
    ]
});

module.exports = logger;