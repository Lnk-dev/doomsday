import jwt, { type SignOptions } from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'
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
