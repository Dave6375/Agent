const config = require('../config/config');

class Logger {
  constructor() {
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
    this.currentLevel = this.levels[config.app.logLevel] || this.levels.info;
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const baseLog = {
      timestamp,
      level: level.toUpperCase(),
      message
    };

    if (Object.keys(meta).length > 0) {
      baseLog.meta = meta;
    }

    return config.isDevelopment
      ? `[${timestamp}] ${level.toUpperCase()}: ${message} ${Object.keys(meta).length > 0 ? JSON.stringify(meta, null, 2) : ''}`
      : JSON.stringify(baseLog);
  }

  log(level, message, meta = {}) {
    if (this.levels[level] <= this.currentLevel) {
      if (level === 'error') {
        console.error(this.formatMessage(level, message, meta));
      } else if (level === 'warn') {
        console.warn(this.formatMessage(level, message, meta));
      } else {
        console.log(this.formatMessage(level, message, meta));
      }
    }
  }

  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }
}

module.exports = new Logger();
