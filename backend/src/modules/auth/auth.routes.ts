import { Router } from "express";
import rateLimit from "express-rate-limit";
import { AuthController } from "./auth.controller";
import { AuthRepository } from "./auth.repository";
import { AuthService } from "./auth.service";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/middlewares/auth.middleware";

const router: Router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: {
    status: "error",
    message: "Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit.",
  },
});

// Dependency injection
const authRepository = new AuthRepository(prisma);
const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

/**
 * @route   POST /api/auth/login
 * @desc    Login admin dan mendapatkan JWT token
 * @access  ADMIN
 * @body    { email: string, password: string }
 */
router.post("/login", loginLimiter, authController.login);

/**
 * @route   GET /api/auth/me
 * @desc    Mengambil profil admin yang sedang login
 */
router.get("/me", authenticate, authController.getProfile);

/**
 * @route   PATCH /api/auth/me
 * @desc    Mengupdate profil admin (nama dan/atau email)
 * @body    { name?: string, email?: string }
 */
router.patch("/me", authenticate, authController.updateProfile);

/**
 * @route   PATCH /api/auth/change-password
 * @desc    Mengganti password admin
 * @body    { currentPassword: string, newPassword: string, confirmPassword: string }
 */
router.patch("/change-password", authenticate, authController.changePassword);

export default router;
