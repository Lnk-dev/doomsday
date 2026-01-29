import jwt, { type SignOptions } from 'jsonwebtoken'

const isProduction = process.env.NODE_ENV === 'production'

// Enforce JWT_SECRET in production - fail fast if not configured
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret && isProduction) {
    throw new Error('JWT_SECRET environment variable must be set in production')
  }
  if (!secret) {
    console.warn('[SECURITY WARNING] Using default JWT secret - only acceptable in development')
    return 'dev-secret-do-not-use-in-production'
  }
  // Warn if secret is too short (should be at least 32 characters)
  if (secret.length < 32) {
    console.warn('[SECURITY WARNING] JWT_SECRET should be at least 32 characters for security')
  }
  return secret
}

const JWT_SECRET = getJwtSecret()
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn']

export interface JwtPayload { userId: string; walletAddress?: string }
export interface AdminJwtPayload { adminId: string; pending2FA?: boolean }

export function generateToken(payload: JwtPayload | AdminJwtPayload, expiresIn?: string): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: (expiresIn || JWT_EXPIRES_IN) as SignOptions['expiresIn'] })
}

export function verifyToken(token: string): JwtPayload | null {
  try { return jwt.verify(token, JWT_SECRET) as JwtPayload } catch { return null }
}

export function verifyAdminToken(token: string): AdminJwtPayload | null {
  try { return jwt.verify(token, JWT_SECRET) as AdminJwtPayload } catch { return null }
}

export function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' as SignOptions['expiresIn'] })
}
