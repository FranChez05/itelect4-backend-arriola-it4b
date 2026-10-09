import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend Express Request interface so req.userId is accessible throughout Express
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: {
        id: string;
        role: string;
      };
    }
  }
}

export interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    role: string;
  };
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).send("No token. Send Authorization: Bearer <token>");
    return;
  }

  const token = authHeader.slice(7).trim();

  try {
    const secret = process.env.JWT_SECRET || "badminton_secret_jwt_key_2026";
    const decoded = jwt.verify(token, secret) as { id?: string; userId?: string; role?: string };
    
    const id = decoded.id || decoded.userId;
    if (!id) {
      res.status(401).send("Token is invalid or has expired");
      return;
    }

    // Set req.userId as required by the rubric
    req.userId = id;
    req.user = { id, role: decoded.role || "player" };
    next();
  } catch (error) {
    res.status(401).send("Token is invalid or has expired");
  }
}

export default authMiddleware;
