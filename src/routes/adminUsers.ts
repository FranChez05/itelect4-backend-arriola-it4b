import { Router, type Response } from "express";
import { UserModel } from "../models";
import { authMiddleware, type AuthenticatedRequest } from "../middleware/auth";

const router = Router();
router.use(authMiddleware, (req: AuthenticatedRequest, res: Response, next) => {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Admin access is required" });
    return;
  }
  next();
});

router.get("/", async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const users = await UserModel.find({}, "name email role isActive createdAt")
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json(users);
  } catch (error) {
    console.error("Fetch admin users error:", error);
    res.status(500).json({ error: "Failed to fetch player accounts" });
  }
});

export default router;
