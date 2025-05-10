const { logConfig } = require('./env');
const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');

// 处理循环引用的 JSON 序列化
const safeStringify = (obj) => {
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
                return '[Circular]';
            }
            seen.add(value);
        }
        if (typeof value === 'bigint') {
            return value.toString();
        }
        return value;
    });
};

// 创建基础 logger
const baseLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.printf(({ level, message, timestamp }) => {
            let msg = `${timestamp} [${level.toUpperCase()}] `;
            
            // 处理消息内容
            if (typeof message === 'object') {
                msg += safeStringify(message);
            } else {
                msg += message;
            }
            
            return msg;
        })
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

// 创建包装器
class LoggerWrapper {
    constructor(baseLogger) {
        this.baseLogger = baseLogger;
    }

    _getCallerInfo() {
        const err = new Error();
        Error.captureStackTrace(err, this._getCallerInfo);
        const stack = err.stack.split('\n');
        // 跳过 Error 和 _getCallerInfo 的堆栈行
        for (let i = 2; i < stack.length; i++) {
            const line = stack[i];
            const match = line.match(/at\s+(?:\w+\s+)?\(?([^:]+):(\d+):(\d+)\)?/);
            if (match) {
                const [, filePath, line] = match;
                if (!filePath.includes('node_modules') && !filePath.includes('log_utils.js')) {
                    const fileName = path.basename(filePath);
                    return `[${fileName}:${line}]`;
                }
            }
        }
        return '';
    }

    info(message, ...args) {
        const callerInfo = this._getCallerInfo();
        this.baseLogger.info(`${callerInfo}${callerInfo ? ' ' : ''}${message}`, ...args);
    }

    error(message, ...args) {
        const callerInfo = this._getCallerInfo();
        this.baseLogger.error(`${callerInfo}${callerInfo ? ' ' : ''}${message}`, ...args);
    }

    warn(message, ...args) {
        const callerInfo = this._getCallerInfo();
        this.baseLogger.warn(`${callerInfo}${callerInfo ? ' ' : ''}${message}`, ...args);
    }

    debug(message, ...args) {
        const callerInfo = this._getCallerInfo();
        this.baseLogger.debug(`${callerInfo}${callerInfo ? ' ' : ''}${message}`, ...args);
    }
}

// 导出包装后的 logger
module.exports = new LoggerWrapper(baseLogger);