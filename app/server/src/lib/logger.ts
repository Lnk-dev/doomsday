import pino from 'pino'

const isProduction = process.env.NODE_ENV === 'production'

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  base: { env: process.env.NODE_ENV || 'development', service: 'doomsday-api' },
  redact: { paths: ['req.headers.authorization', 'password', 'token', 'secret'], censor: '[REDACTED]' },
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: isProduction ? undefined : { target: 'pino-pretty', options: { colorize: true } },
})

export function createLogger(component: string) {
  return logger.child({ component })
}
