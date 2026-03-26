/**
 * Password Strength Validation
 * 
 * WHY: Weak passwords are the #1 security vulnerability
 * - "123456" and "password" are still common
 * - Brute force attacks can crack simple passwords in seconds
 * - Password cracking tools use dictionaries of common passwords
 * 
 * REQUIREMENTS:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * 
 * WHAT MAKES THIS SMART:
 * - Returns detailed feedback, not just pass/fail
 * - Checks against common password list
 * - Doesn't reject but warns about sequential/repeated characters
 */

// Common passwords to reject (top 100 most used)
const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', '123456', '12345678', '123456789',
  'qwerty', 'qwerty123', 'abc123', 'letmein', 'monkey', 'master',
  'dragon', '111111', 'baseball', 'iloveyou', 'trustno1', 'sunshine',
  'princess', 'welcome', 'shadow', 'superman', 'michael', 'football',
  'admin', 'admin123', 'login', 'passw0rd', 'hello', 'charlie',
  'donald', 'password!', 'qwertyuiop', '1q2w3e4r', '1234567890',
])

export interface PasswordStrengthResult {
  valid: boolean
  score: number          // 0-100
  level: 'weak' | 'fair' | 'good' | 'strong'
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

/**
 * Validate password strength
 * Returns detailed feedback for UX
 */
export function validatePasswordStrength(password: string): PasswordStrengthResult {
  const errors: string[] = []
  const warnings: string[] = []
  const suggestions: string[] = []
  let score = 0
  
  // === LENGTH CHECKS ===
  if (!password || password.length === 0) {
    return {
      valid: false,
      score: 0,
      level: 'weak',
      errors: ['Password is required'],
      warnings: [],
      suggestions: ['Enter a password'],
    }
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters')
  } else if (password.length < 12) {
    warnings.push('Consider using 12+ characters for better security')
    score += 15
  } else if (password.length < 16) {
    score += 25
  } else {
    score += 30
  }
  
  // === CHARACTER TYPE CHECKS ===
  const hasLowercase = /[a-z]/.test(password)
  const hasUppercase = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  
  if (!hasLowercase) {
    errors.push('Password must contain at least one lowercase letter')
  } else {
    score += 10
  }
  
  if (!hasUppercase) {
    errors.push('Password must contain at least one uppercase letter')
  } else {
    score += 10
  }
  
  if (!hasNumber) {
    errors.push('Password must contain at least one number')
  } else {
    score += 10
  }
  
  if (!hasSpecial) {
    errors.push('Password must contain at least one special character (!@#$%^&*)')
  } else {
    score += 15
  }
  
  // === PATTERN CHECKS ===
  
  // Check for common passwords
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push('This password is too common. Please choose a unique password.')
    score = 0
  }
  
  // Check for sequential characters
  const sequentialPatterns = [
    'abc', 'bcd', 'cde', 'def', 'efg', 'fgh', 'ghi', 'hij', 'ijk', 'jkl',
    'klm', 'lmn', 'mno', 'nop', 'opq', 'pqr', 'qrs', 'rst', 'stu', 'tuv',
    'uvw', 'vwx', 'wxy', 'xyz', '012', '123', '234', '345', '456', '567',
    '678', '789', '890', 'qwe', 'wer', 'ert', 'rty', 'tyu', 'yui', 'uio',
    'iop', 'asd', 'sdf', 'dfg', 'fgh', 'ghj', 'hjk', 'jkl', 'zxc', 'xcv',
    'cvb', 'vbn', 'bnm',
  ]
  
  const lowerPassword = password.toLowerCase()
  for (const pattern of sequentialPatterns) {
    if (lowerPassword.includes(pattern)) {
      warnings.push('Avoid sequential characters like "abc" or "123"')
      score -= 5
      break
    }
  }
  
  // Check for repeated characters
  if (/(.)\1{2,}/.test(password)) {
    warnings.push('Avoid repeated characters like "aaa" or "111"')
    score -= 5
  }
  
  // Check for keyboard patterns
  const keyboardPatterns = ['qwerty', 'asdfgh', 'zxcvbn', 'qazwsx']
  for (const pattern of keyboardPatterns) {
    if (lowerPassword.includes(pattern)) {
      warnings.push('Avoid keyboard patterns like "qwerty"')
      score -= 5
      break
    }
  }
  
  // Check for common substitutions (p@ssw0rd, etc.)
  const commonSubstitutions: Record<string, string> = {
    '@': 'a', '3': 'e', '1': 'i', '0': 'o', '$': 's', '4': 'a',
  }
  let normalizedPassword = lowerPassword
  for (const [sub, letter] of Object.entries(commonSubstitutions)) {
    normalizedPassword = normalizedPassword.replace(new RegExp(sub, 'g'), letter)
  }
  if (COMMON_PASSWORDS.has(normalizedPassword)) {
    warnings.push('Common substitutions like @ for a are easy to guess')
    score -= 10
  }
  
  // === BONUS POINTS ===
  
  // Bonus for variety
  const uniqueChars = new Set(password).size
  if (uniqueChars >= password.length * 0.7) {
    score += 10
    suggestions.push('Great! Using varied characters')
  }
  
  // Bonus for length beyond minimum
  if (password.length >= 16) {
    score += 10
    suggestions.push('Excellent length!')
  }
  
  // === FINALIZE SCORE ===
  score = Math.max(0, Math.min(100, score))
  
  // Determine level
  let level: 'weak' | 'fair' | 'good' | 'strong'
  if (score < 40) {
    level = 'weak'
  } else if (score < 60) {
    level = 'fair'
  } else if (score < 80) {
    level = 'good'
  } else {
    level = 'strong'
  }
  
  // Generate suggestions if score is low
  if (errors.length === 0 && score < 60) {
    suggestions.push('Try adding more characters or special symbols')
  }
  
  return {
    valid: errors.length === 0 && score >= 40,
    score,
    level,
    errors,
    warnings,
    suggestions,
  }
}

/**
 * Quick password validation (returns only valid/invalid)
 * Use this for API routes
 */
export function isPasswordStrongEnough(password: string): { valid: boolean; error?: string } {
  const result = validatePasswordStrength(password)
  
  if (!result.valid) {
    return {
      valid: false,
      error: result.errors[0] || 'Password is too weak',
    }
  }
  
  return { valid: true }
}
