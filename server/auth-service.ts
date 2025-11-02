/**
 * Authentication Service
 * 
 * Handles:
 * - Password hashing and verification using scrypt
 * - User authentication
 * - Session management
 */

import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import type { User } from '@shared/schema';
import type { UserRole } from '@shared/auth-roles';

const scryptAsync = promisify(scrypt);

// ===========================
// PASSWORD HASHING
// ===========================

/**
 * Hash a password using scrypt with a random salt
 * Returns: "salt:hashedPassword"
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verify a password against a stored hash
 * Uses constant-time comparison to prevent timing attacks
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  try {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;
    
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
    const storedBuffer = Buffer.from(hash, 'hex');
    
    // Constant-time comparison to prevent timing attacks
    return timingSafeEqual(derivedKey, storedBuffer);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

// ===========================
// SESSION TYPES
// ===========================

/**
 * User data stored in session (minimal payload)
 */
export interface SessionUser {
  id: number;
  username: string;
  fullName: string;
  role: UserRole;
}

/**
 * Safe user data returned to frontend (no password)
 */
export interface SafeUser {
  id: number;
  username: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
}

/**
 * Convert database User to SafeUser (strips password)
 */
export function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName || user.username, // Fallback to username if fullName is null
    role: user.role as UserRole,
    createdAt: user.createdAt,
  };
}

/**
 * Convert database User to SessionUser (minimal for session storage)
 */
export function toSessionUser(user: User): SessionUser {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName || user.username, // Fallback to username if fullName is null
    role: user.role as UserRole,
  };
}

// ===========================
// SESSION HELPERS
// ===========================

/**
 * Check if user is authenticated (has valid session)
 */
export function isAuthenticated(session: any): boolean {
  return !!session?.user?.id;
}

/**
 * Get current user from session
 */
export function getCurrentUser(session: any): SessionUser | null {
  return session?.user || null;
}

/**
 * Check if user has a specific role
 */
export function hasRole(session: any, role: UserRole): boolean {
  const user = getCurrentUser(session);
  return user?.role === role;
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(session: any, roles: UserRole[]): boolean {
  const user = getCurrentUser(session);
  if (!user) return false;
  return roles.includes(user.role);
}
