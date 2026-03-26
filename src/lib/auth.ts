import { db } from '@/db'
import { settings } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { 
  auditLog, 
  checkRateLimitDB, 
  recordFailedAttemptDB, 
  clearFailedAttemptsDB 
} from './security'
import { isPasswordStrongEnough } from './password-strength'

// ============================================
// SECURITY: Session configuration - NO HARDCODED SECRETS!
// ============================================

const SESSION_COOKIE = 'admin_session'
const SESSION_DURATION = 7 * 24 * 60 * 60 // 7 days

// Cache the secret key after first retrieval
let _cachedSecret: string | null = null

/**
 * Get session secret - MUST be configured in environment
 * No hardcoded fallbacks!
 */
async function getSessionSecret(): Promise<string> {
  // Return cached if available
  if (_cachedSecret) return _cachedSecret
  
  const envSecret = process.env.SESSION_SECRET
  
  if (!envSecret || envSecret.length < 32) {
    throw new Error(
      '❌ SESSION_SECRET not configured or too short (min 32 chars).\n' +
      'Please set SESSION_SECRET in your .env file.\n' +
      'Generate with: openssl rand -base64 32'
    )
  }
  
  _cachedSecret = envSecret
  return envSecret
}

// Get secret key for JWT operations
async function getSecretKey(): Promise<Uint8Array> {
  const secret = await getSessionSecret()
  return new TextEncoder().encode(secret)
}

// ============================================
// PASSWORD HASHING
// ============================================

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12)
  return bcrypt.hash(password, salt)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  if (hashedPassword.startsWith('$2')) {
    return bcrypt.compare(password, hashedPassword)
  }
  // Legacy support: plain text (migrate on next login)
  return password === hashedPassword
}

export function isHashed(password: string): boolean {
  return password.startsWith('$2a$') || password.startsWith('$2b$') || password.startsWith('$2y$')
}

// ============================================
// SESSION MANAGEMENT
// ============================================

export async function createSession(username: string): Promise<string> {
  const key = await getSecretKey()
  const token = await new SignJWT({ 
    username, 
    role: 'admin',
    iat: Math.floor(Date.now() / 1000)
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // 7 days
    .sign(key)
  
  return token
}

export async function verifySession(token: string): Promise<{ username: string; role: string } | null> {
  try {
    const key = await getSecretKey()
    const { payload } = await jwtVerify(token, key)
    return payload as { username: string; role: string }
  } catch {
    return null
  }
}

export async function refreshSession(token: string): Promise<string | null> {
  const session = await verifySession(token)
  if (!session) return null
  return createSession(session.username)
}

// ============================================
// AUTHENTICATION
// ============================================

/**
 * Get admin credentials from database
 * SECURITY: No default password - must be set in database!
 */
async function getAdminCredentials(): Promise<{ username: string; password: string } | null> {
  try {
    const result = await db.select().from(settings).where(eq(settings.id, 1)).limit(1)
    if (result.length > 0 && result[0].adminPassword) {
      return {
        username: result[0].adminUsername || 'admin',
        password: result[0].adminPassword,
      }
    }
  } catch (error) {
    console.error('Error fetching admin credentials:', error)
  }
  return null // SECURITY: No default credentials!
}

export async function authenticateAdmin(
  username: string, 
  password: string, 
  ip: string = 'unknown',
  userAgent: string = 'unknown'
): Promise<{ 
  success: boolean
  token?: string
  error?: string
  remainingAttempts?: number 
  lockedMinutes?: number
}> {
  // Check rate limit (persistent, database-backed)
  const rateCheck = await checkRateLimitDB(ip)
  
  if (!rateCheck.allowed) {
    await auditLog({
      action: 'rate_limited',
      category: 'auth',
      ipAddress: ip,
      userAgent,
      details: `Login blocked for ${rateCheck.lockedMinutes} minutes`
    })
    
    return { 
      success: false, 
      error: `Too many failed attempts. Try again in ${rateCheck.lockedMinutes} minutes.`,
      remainingAttempts: 0,
      lockedMinutes: rateCheck.lockedMinutes
    }
  }
  
  // SECURITY: Check if credentials are configured
  const creds = await getAdminCredentials()
  
  if (!creds) {
    console.error('❌ Admin credentials not configured in database!')
    await auditLog({
      action: 'login_failed',
      category: 'auth',
      ipAddress: ip,
      userAgent,
      details: 'Admin credentials not configured'
    })
    
    return { 
      success: false, 
      error: 'System not configured. Please set up admin credentials.',
      remainingAttempts: 5
    }
  }
  
  // Check username
  // SECURITY: Use SAME error message for wrong username AND wrong password
  // This prevents username enumeration attacks
  if (username !== creds.username) {
    const attempt = await recordFailedAttemptDB(ip)
    await auditLog({
      action: 'login_failed',
      category: 'auth',
      ipAddress: ip,
      userAgent,
      details: 'Invalid credentials' // Don't log which was wrong
    })
    
    return { 
      success: false, 
      error: 'Invalid credentials', // Generic - don't reveal "username not found"
      remainingAttempts: attempt.count >= 5 ? 0 : 5 - attempt.count
    }
  }
  
  // Verify password
  const isValid = await verifyPassword(password, creds.password)
  
  if (!isValid) {
    const attempt = await recordFailedAttemptDB(ip)
    await auditLog({
      action: 'login_failed',
      category: 'auth',
      ipAddress: ip,
      userAgent,
      details: 'Invalid credentials' // Don't log "wrong password"
    })
    
    return { 
      success: false, 
      error: 'Invalid credentials', // Same message as wrong username
      remainingAttempts: attempt.count >= 5 ? 0 : 5 - attempt.count
    }
  }
  
  // SUCCESS
  await clearFailedAttemptsDB(ip)
  await auditLog({
    action: 'login_success',
    category: 'auth',
    ipAddress: ip,
    userAgent,
    details: `User: ${username}`
  })
  
  // Auto-migrate plain text to hash
  if (!isHashed(creds.password)) {
    try {
      const hashedPassword = await hashPassword(password)
      await db.update(settings)
        .set({ adminPassword: hashedPassword })
        .where(eq(settings.id, 1))
      console.log('✅ Password auto-migrated to secure hash')
    } catch (error) {
      console.error('Failed to migrate password hash:', error)
    }
  }
  
  const token = await createSession(username)
  return { success: true, token }
}

// Get current session
export async function getSession() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value
    if (!token) return null
    return verifySession(token)
  } catch {
    return null
  }
}

// Check if authenticated
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession()
  return session !== null
}

// Logout
export async function logout(ip: string = 'unknown'): Promise<void> {
  const session = await getSession()
  if (session) {
    await auditLog({
      action: 'logout',
      category: 'auth',
      ipAddress: ip,
      details: `User: ${session.username}`
    })
  }
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE
export const SESSION_DURATION_SECONDS = SESSION_DURATION
