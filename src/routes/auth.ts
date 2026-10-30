import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserModel } from "../models";

const router = Router();

// POST /api/auth/register - Register once per database. Email uniqueness enforced.
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" || name.trim().length < 2 || name.trim().length > 50 ||
      typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email.trim()) ||
      typeof password !== "string" || password.length < 6
    ) {
      res.status(400).json({ error: "Name must be 2-50 characters, email must be valid, and password must have at least 6 characters" });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await UserModel.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(409).json({ error: "That email is already registered" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await UserModel.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      // Public registration must never grant administrator privileges.
      role: "player",
    });

    res.status(201).json({
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    });
  } catch (error: any) {
    console.error("Register error:", error);

    if (error?.name === "ValidationError") {
      res.status(400).json({ error: error.message || "Invalid registration payload" });
      return;
    }

    if (error?.code === 11000) {
      res.status(409).json({ error: "That email is already registered" });
      return;
    }

    const message = process.env.NODE_ENV === "development" ? error?.message || "Internal server error during registration" : "Internal server error during registration";
    res.status(500).json({ error: message });
  }
});

// POST /api/auth/login - Log in and obtain JWT Bearer token
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (typeof email !== "string" || !email.trim() || typeof password !== "string" || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const user = await UserModel.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    if (user.isActive === false) {
      res.status(403).json({ error: "This account is inactive. Contact an administrator." });
      return;
    }

    const secret = process.env.JWT_SECRET || "badminton_secret_jwt_key_2026";
    const token = jwt.sign(
      { id: user._id.toString(), userId: user._id.toString(), role: user.role },
      secret,
      { expiresIn: "2h" }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        role: user.role,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error during login" });
  }
});

export default router;
