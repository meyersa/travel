import { pino } from "pino"

const LOG_LEVEL = process.env.LOG_LEVEL || 'debug'

export const logger = pino({ level: LOG_LEVEL })

logger.info(`Initialized Pino Logger with level ${LOG_LEVEL}`)