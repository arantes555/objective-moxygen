'use strict'

const winston = require('winston')

// Create the global logger object
const logger = winston.createLogger({ level: 'info' })

module.exports = {
  init (options, defaultOptions) {
    // Create log console transport
    const logterm = new winston.transports.Console({
      consoleWarnLevels: ['warn', 'debug'],
      stderrLevels: ['error'],
      silent: options.quiet,
      format: winston.format.simple()
    })

    logger.add(logterm)

    // User defined log file?
    if (typeof options.logfile !== 'undefined') {
      // Use default log file name?
      if (options.logfile === true) {
        options.logfile = defaultOptions.logfile
      }
      // Create log file transport
      const logfile = new winston.transports.File({
        filename: options.logfile,
        level: 'silly'
      })

      logger.add(logfile)
    }

    // Set the logging level
    if (!options.quiet) {
      this.setLevel('verbose')
    }
  },

  getLogger () {
    return logger
  },

  setLevel (level) {
    logger.level = level
  }
}
