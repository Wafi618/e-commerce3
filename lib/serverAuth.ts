import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { getAuthOptions } from '@/pages/api/auth/[...nextauth]';


export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
  phone?: string | null;
  restrictedAccess?: boolean;
}

/**
 * Helper to get user from NextAuth session (primary) or legacy token (fallback)
 */
export async function getServerUser(req: NextApiRequest, res: NextApiResponse): Promise<AuthenticatedUser | null> {
  // 1. Try NextAuth Session
  try {
    const authOptions = getAuthOptions(req, res);
    const session = await getServerSession(req, res, authOptions);
    if (session?.user) {
      return {
        userId: session.user.id,
        email: session.user.email || '',
        role: session.user.role,
        phone: session.user.phone,
        restrictedAccess: session.user.restrictedAccess,
      };
    }
  } catch (error) {
    console.error('Error getting server session:', error);
    // Continue to fallback
  }

  // 2. Fallback to Legacy Token (REMOVED)
  // We strictly use NextAuth session now to avoid identity confusion.

  return null;
}

/**
 * Helper to enforce authentication.
 * Returns user if authenticated, otherwise writes 401 response and returns null.
 */
export async function requireUser(req: NextApiRequest, res: NextApiResponse): Promise<AuthenticatedUser | null> {
  const user = await getServerUser(req, res);

  if (!user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
    return null;
  }

  return user;
}

/**
 * Helper to enforce ADMIN role.
 * Returns user if admin, otherwise writes 403 response and returns null.
 */
export async function requireAdmin(req: NextApiRequest, res: NextApiResponse): Promise<AuthenticatedUser | null> {
  const user = await requireUser(req, res);

  if (!user) return null;

  if (user.role !== 'ADMIN') {
    res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
    return null;
  }

  return user;
}

