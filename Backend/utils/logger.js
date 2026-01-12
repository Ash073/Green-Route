import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');
try {
  fs.mkdirSync(logsDir, { recursive: true });
} catch {}

// Define log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Get log level from environment
const logLevelEnv = process.env.LOG_LEVEL || 'info';
const logLevel = LOG_LEVELS[logLevelEnv.toUpperCase()] || LOG_LEVELS.INFO;

// Logger class
class Logger {
  constructor(name) {
    this.name = name;
    this.logFile = path.join(logsDir, `${new Date().toISOString().split('T')[0]}.log`);
  }

  log(level, message, data = null) {
    if (LOG_LEVELS[level] > logLevel) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${this.name}] [${level}] ${message}`;
    const logEntry = data ? `${logMessage}\n${JSON.stringify(data, null, 2)}` : logMessage;

    // Console log
    const consoleMethod = level === 'ERROR' ? 'error' : level === 'WARN' ? 'warn' : 'log';
    console[consoleMethod](logEntry);

    // File log
    if (process.env.NODE_ENV === 'production') {
      fs.appendFileSync(this.logFile, logEntry + '\n');
    }
  }

  error(message, data) {
    this.log('ERROR', message, data);
  }

  warn(message, data) {
    this.log('WARN', message, data);
  }

  info(message, data) {
    this.log('INFO', message, data);
  }

  debug(message, data) {
    this.log('DEBUG', message, data);
  }
}

// Export logger factory
export const createLogger = (name) => new Logger(name);

// Setup Morgan HTTP logger
export const setupMorganLogger = () => {
  // Morgan format
  morgan.token('user-id', (req) => req.user?.userId || 'anonymous');
  
  const morganFormat =
    ':remote-addr - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    return morgan(morganFormat);
  }

  // Log to file in production
  const accessLogStream = fs.createWriteStream(
    path.join(logsDir, 'access.log'),
    { flags: 'a' }
  );

  return morgan(morganFormat, { stream: accessLogStream });
};

// Request logger middleware
export const requestLogger = (req, res, next) => {
  const logger = createLogger('HTTP');
  logger.debug(`${req.method} ${req.path}`, {
    headers: req.headers,
    query: req.query,
    userId: req.user?.userId
  });
  next();
};

export default Logger;
