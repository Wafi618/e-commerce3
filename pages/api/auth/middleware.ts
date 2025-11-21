import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './[...nextauth]';

export interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

/**
 * Middleware to verify session and attach user to request
 */
export function withAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      const session = await getServerSession(req, res, authOptions);

      if (!session || !session.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      // Attach user to request (mapping id to userId for compatibility)
      req.user = {
        userId: session.user.id,
        email: session.user.email || '',
        role: session.user.role || 'CUSTOMER',
      };

      // Call the actual handler
      return handler(req, res);
    } catch (error) {
      console.error('Auth Middleware Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Authentication failed',
      });
    }
  };
}

/**
 * Middleware to verify user has admin role
 */
export function withAdminAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) {
  return withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
    }

    return handler(req, res);
  });
}

/**
 * Optional auth - doesn't fail if no token, but adds user if present
 */
export function withOptionalAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      const session = await getServerSession(req, res, authOptions);

      if (session && session.user) {
        req.user = {
          userId: session.user.id,
          email: session.user.email || '',
          role: session.user.role || 'CUSTOMER',
        };
      }
    } catch (error) {
      // Silently fail for optional auth
      console.log('Optional auth failed, continuing without user');
    }

    return handler(req, res);
  };
}
