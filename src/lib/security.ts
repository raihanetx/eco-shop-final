/**
 * Security Utilities
 * - API Key Encryption (AES-256)
 * - Audit Logging
 * - Rate Limiting (Persistent)
 */

import { db } from '@/db'
import { sql } from 'drizzle-orm'
import crypto from 'crypto'

// ============================================
// ENCRYPTION (AES-256-GCM)
// ============================================

// Cache the encryption key
let _cachedEncryptionKey: Buffer | null = null

/**
 * Get encryption key - derived from SESSION_SECRET (no hardcoded fallback!)
 * 
 * Option 1: Set ENCRYPTION_KEY directly (64 hex chars = 32 bytes)
 * Option 2: Derive from SESSION_SECRET (must be 32+ chars)
 * 
 * SECURITY: No hardcoded fallbacks!
 */
function getEncryptionKey(): Buffer {
  // Return cached key if available
  if (_cachedEncryptionKey) return _cachedEncryptionKey
  
  // Option 1: Direct encryption key (preferred for production)
  const directKey = process.env.ENCRYPTION_KEY
  if (directKey && directKey.length === 64) {
    try {
      _cachedEncryptionKey = Buffer.from(directKey, 'hex')
      return _cachedEncryptionKey
    } catch {
      console.error('Invalid ENCRYPTION_KEY format - must be 64 hex characters')
    }
  }
  
  // Option 2: Derive from SESSION_SECRET (must be configured!)
  const sessionSecret = process.env.SESSION_SECRET
  
  if (!sessionSecret || sessionSecret.length < 32) {
    throw new Error(
      '❌ Encryption key not configured!\n' +
      'Either set ENCRYPTION_KEY (64 hex chars) or SESSION_SECRET (32+ chars) in .env\n' +
      '\n' +
      'Generate ENCRYPTION_KEY: openssl rand -hex 32\n' +
      'Generate SESSION_SECRET: openssl rand -base64 32'
    )
  }
  
  // Derive key from session secret using SHA-256
  _cachedEncryptionKey = crypto.createHash('sha256').update(sessionSecret).digest()
  return _cachedEncryptionKey
}

// Encrypt sensitive data (API keys, secrets)
export function encrypt(text: string): string {
  if (!text) return ''
  
  // Don't re-encrypt if already encrypted
  if (text.startsWith('enc:')) return text
  
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  // Format: enc:iv:authTag:encrypted
  return `enc:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

// Decrypt sensitive data
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return ''
  
  // Return as-is if not encrypted
  if (!encryptedText.startsWith('enc:')) return encryptedText
  
  const key = getEncryptionKey()
  const parts = encryptedText.split(':')
  
  if (parts.length !== 4) {
    console.error('Decryption failed: Invalid format')
    return ''
  }
  
  const iv = Buffer.from(parts[1], 'hex')
  const authTag = Buffer.from(parts[2], 'hex')
  const encrypted = parts[3]
  
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Decryption failed - encryption key may have changed:', error)
    return ''
  }
}

// Safe decrypt that returns null on failure (for cases where you need to know if decryption failed)
export function safeDecrypt(encryptedText: string): string | null {
  if (!encryptedText) return null
  
  // Return as-is if not encrypted (plain text value)
  if (!encryptedText.startsWith('enc:')) return encryptedText
  
  const key = getEncryptionKey()
  const parts = encryptedText.split(':')
  
  if (parts.length !== 4) {
    console.error('Safe decrypt failed: Invalid format')
    return null
  }
  
  const iv = Buffer.from(parts[1], 'hex')
  const authTag = Buffer.from(parts[2], 'hex')
  const encrypted = parts[3]
  
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Safe decrypt failed - encryption key may have changed:', error)
    return null
  }
}

// Check if value is encrypted
export function isEncrypted(value: string): boolean {
  return value?.startsWith('enc:') || false
}

// ============================================
// AUDIT LOGGING
// ============================================

export interface AuditLogEntry {
  action: 'login_success' | 'login_failed' | 'credential_change' | 'logout' | 'rate_limited'
  category: 'auth' | 'admin' | 'courier' | 'cloudinary'
  field?: string
  oldValue?: string
  newValue?: string
  ipAddress?: string
  userAgent?: string
  details?: string
}

// Create audit_logs table if not exists
async function ensureAuditTable(): Promise<void> {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        action TEXT NOT NULL,
        category TEXT NOT NULL,
        field TEXT,
        old_value TEXT,
        new_value TEXT,
        ip_address TEXT,
        user_agent TEXT,
        details TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)
  } catch (error) {
    // Table might already exist
  }
}

// Log an audit event
export async function auditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await ensureAuditTable()
    
    // Mask sensitive values for logging
    const maskValue = (value: string | undefined): string | null => {
      if (!value) return null
      if (value.length <= 4) return '••••'
      return value.substring(0, 2) + '••••' + value.substring(value.length - 2)
    }
    
    // Use explicit null handling for SQL
    const field = entry.field || null
    const oldValue = maskValue(entry.oldValue)
    const newValue = maskValue(entry.newValue)
    const ipAddress = entry.ipAddress || null
    const userAgent = entry.userAgent || null
    const details = entry.details || null
    
    await db.execute(sql`
      INSERT INTO audit_logs (action, category, field, old_value, new_value, ip_address, user_agent, details)
      VALUES (${entry.action}, ${entry.category}, ${field}, 
              ${oldValue}, ${newValue}, 
              ${ipAddress}, ${userAgent}, ${details})
    `)
  } catch (error) {
    console.error('Failed to write audit log:', error)
  }
}

// Get recent audit logs
export async function getAuditLogs(limit: number = 50): Promise<any[]> {
  try {
    const result = await db.execute(sql`
      SELECT * FROM audit_logs 
      ORDER BY created_at DESC 
      LIMIT ${limit}
    `) as any[]
    return result || []
  } catch (error) {
    console.error('Failed to fetch audit logs:', error)
    return []
  }
}

// ============================================
// PERSISTENT RATE LIMITING
// ============================================

// Store failed attempts in database
export async function recordFailedAttemptDB(ip: string): Promise<{ count: number; lockedUntil: Date | null }> {
  try {
    // Create table if not exists
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS login_attempts (
        ip TEXT PRIMARY KEY,
        count INTEGER DEFAULT 0,
        first_attempt TIMESTAMP DEFAULT NOW(),
        last_attempt TIMESTAMP DEFAULT NOW(),
        locked_until TIMESTAMP
      )
    `)
    
    // Clean old entries (older than 1 hour)
    await db.execute(sql`
      DELETE FROM login_attempts 
      WHERE last_attempt < NOW() - INTERVAL '1 hour'
      AND locked_until IS NULL
    `)
    
    // Check if currently locked
    const existing = await db.execute(sql`
      SELECT count, locked_until FROM login_attempts WHERE ip = ${ip}
    `) as any[]
    
    if (existing && existing.length > 0) {
      const row = existing[0] as any
      
      // Check if lockout has expired
      if (row.locked_until && new Date(row.locked_until) < new Date()) {
        // Reset after lockout expires
        await db.execute(sql`
          UPDATE login_attempts 
          SET count = 1, last_attempt = NOW(), locked_until = NULL 
          WHERE ip = ${ip}
        `)
        return { count: 1, lockedUntil: null }
      }
      
      // Increment attempt
      await db.execute(sql`
        UPDATE login_attempts 
        SET count = count + 1, last_attempt = NOW()
        WHERE ip = ${ip}
      `)
      
      // Lock if too many attempts
      const newCount = row.count + 1
      if (newCount >= 5) {
        const lockedUntil = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
        await db.execute(sql`
          UPDATE login_attempts SET locked_until = ${lockedUntil.toISOString()} WHERE ip = ${ip}
        `)
        return { count: newCount, lockedUntil }
      }
      
      return { count: newCount, lockedUntil: null }
    }
    
    // New entry
    await db.execute(sql`
      INSERT INTO login_attempts (ip, count, last_attempt) VALUES (${ip}, 1, NOW())
    `)
    
    return { count: 1, lockedUntil: null }
  } catch (error) {
    console.error('Rate limit DB error:', error)
    return { count: 0, lockedUntil: null }
  }
}

// Clear attempts after successful login
export async function clearFailedAttemptsDB(ip: string): Promise<void> {
  try {
    // Ensure table exists (in case clear is called before any failed attempts)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS login_attempts (
        ip TEXT PRIMARY KEY,
        count INTEGER DEFAULT 0,
        first_attempt TIMESTAMP DEFAULT NOW(),
        last_attempt TIMESTAMP DEFAULT NOW(),
        locked_until TIMESTAMP
      )
    `)
    
    await db.execute(sql`
      DELETE FROM login_attempts WHERE ip = ${ip}
    `)
  } catch (error) {
    console.error('Failed to clear attempts:', error)
  }
}

// Clear ALL rate limits (for testing/admin use)
export async function clearAllRateLimits(): Promise<void> {
  try {
    await db.execute(sql`DELETE FROM login_attempts`)
    console.log('✅ All rate limits cleared')
  } catch (error) {
    console.error('Failed to clear all rate limits:', error)
  }
}

// Check rate limit status
export async function checkRateLimitDB(ip: string): Promise<{ allowed: boolean; remaining: number; lockedMinutes: number }> {
  try {
    // Ensure table exists
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS login_attempts (
        ip TEXT PRIMARY KEY,
        count INTEGER DEFAULT 0,
        first_attempt TIMESTAMP DEFAULT NOW(),
        last_attempt TIMESTAMP DEFAULT NOW(),
        locked_until TIMESTAMP
      )
    `)
    
    const result = await db.execute(sql`
      SELECT count, locked_until FROM login_attempts WHERE ip = ${ip}
    `) as any[]
    
    if (!result || result.length === 0) {
      return { allowed: true, remaining: 5, lockedMinutes: 0 }
    }
    
    const row = result[0] as any
    
    // Check if locked
    if (row.locked_until) {
      const lockedUntil = new Date(row.locked_until)
      if (lockedUntil > new Date()) {
        const minutesLeft = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000)
        return { allowed: false, remaining: 0, lockedMinutes: minutesLeft }
      }
    }
    
    return { allowed: true, remaining: Math.max(0, 5 - (row.count || 0)), lockedMinutes: 0 }
  } catch (error) {
    console.error('Rate limit check error:', error)
    return { allowed: true, remaining: 5, lockedMinutes: 0 }
  }
}

// ============================================
// SECURITY STATUS
// ============================================

export async function getSecurityStatus(): Promise<{
  score: number
  features: { name: string; status: boolean; score: number }[]
}> {
  const features = [
    { name: 'Password Hashing (bcrypt)', status: true, score: 9 },
    { name: 'Rate Limiting', status: true, score: 8 },
    { name: 'API Key Encryption', status: true, score: 9 },
    { name: 'Audit Logging', status: true, score: 8 },
    { name: 'Secure Sessions', status: true, score: 9 },
    { name: 'HTTP-Only Cookies', status: true, score: 9 },
  ]
  
  const avgScore = Math.round(features.reduce((sum, f) => sum + f.score, 0) / features.length)
  
  return { score: avgScore, features }
}
