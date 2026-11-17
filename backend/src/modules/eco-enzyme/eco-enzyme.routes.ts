import { Router } from "express";
import rateLimit from "express-rate-limit";
import { prisma } from "@/lib/prisma";
import { EcoEnzymeRepository } from "./eco-enzyme.repository";
import { EcoEnzymeService } from "./eco-enzyme.service";
import { EcoEnzymeController } from "./eco-enzyme.controller";
import { EcoEnzymeVideoRepository } from "./eco-enzyme-video.repository";
import { EcoEnzymeVideoService } from "./eco-enzyme-video.service";
import { EcoEnzymeVideoController } from "./eco-enzyme-video.controller";
import { authenticate } from "@/middlewares/auth.middleware";
import { createUpload } from "@/middlewares/upload.middleware";

const router: Router = Router();

const repository = new EcoEnzymeRepository(prisma);
const service = new EcoEnzymeService(repository);
const controller = new EcoEnzymeController(service);

const videoUpload = createUpload("videos", "eco-enzyme");
const videoRepository = new EcoEnzymeVideoRepository(prisma);
const videoService = new EcoEnzymeVideoService(videoRepository);
const videoController = new EcoEnzymeVideoController(videoService);

const publicCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

// ─── Video Edukasi Eco Enzyme (Publik) ───
router.get("/videos", (req, res, next) => {
  videoController.getAll(req as any, res, next);
});
router.get("/videos/:id", (req, res, next) => {
  videoController.getById(req as any, res, next);
});

// ─── Video Edukasi Eco Enzyme (Admin) ───
router.post(
  "/videos",
  authenticate,
  videoUpload.single("thumbnail"),
  (req, res, next) => {
    videoController.create(req as any, res, next);
  }
);
router.patch(
  "/videos/:id",
  authenticate,
  videoUpload.single("thumbnail"),
  (req, res, next) => {
    videoController.update(req as any, res, next);
  }
);
router.delete("/videos/:id", authenticate, (req, res, next) => {
  videoController.delete(req as any, res, next);
});

// Publik
router.get("/public/:code", publicCodeLimiter, controller.getByPublicCode);
router.get("/stats", controller.getStats);
router.get("/batches", (req, res, next) => {
  controller.getAll(req as any, res, next);
});
router.get("/batches/:id", controller.getById);

// Admin (Membutuhkan autentikasi)
router.get("/products", authenticate, controller.getProducts);
router.post("/batches", authenticate, controller.create);
router.patch("/batches/:id", authenticate, controller.update);

// Soft delete & Operasional QR
router.patch("/batches/:id/archive", authenticate, controller.archive);
router.patch("/batches/:id/restore", authenticate, controller.restore);
router.post("/batches/:id/qr-printed", authenticate, controller.markQrPrinted);

// Route delete diarahkan ke soft delete
router.delete("/batches/:id", authenticate, controller.delete);
router.post("/batches/:id/harvest", authenticate, controller.harvest);

// Log Inspeksi
router.post("/batches/:id/logs", authenticate, controller.addLog);
router.delete("/logs/:logId", authenticate, controller.deleteLog);

export default router;
