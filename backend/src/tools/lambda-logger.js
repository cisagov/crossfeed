// logger.js
import { createLogger, transports, format } from 'winston';

/**
 * Initializes custom logger for Cloudwatch
 */

// Define a custom format to uppercase the level
const uppercaseLevelFormat = format((info) => {
  info.level = info.level.toUpperCase();
  return info;
});

// Middleware function to add RequestId
const addRequestId = format((info) => {
  // Extract requestId from the context
  const requestId = info.context?.awsRequestId;
  if (requestId) {
    info.requestId = requestId;
  }
  return info;
});

// Configure Winston logger
const logger = createLogger({
  format: format.combine(
    format.timestamp(),
    uppercaseLevelFormat(),
    addRequestId(),
    format.printf(
      (info) =>
        `${info.level} RequestId: ${info.requestId || 'undefined'} ${
          info.timestamp
        } ${info.message}`
    )
  ),
  transports: [new transports.Console()]
});

export default logger;
