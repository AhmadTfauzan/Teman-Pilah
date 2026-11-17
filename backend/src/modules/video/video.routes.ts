import { Router } from "express";
import { prisma } from "@/lib/prisma";
import { VideoRepository } from "./video.repository";
import { VideoService } from "./video.service";
import { VideoController } from "./video.controller";
import { createUpload } from "@/middlewares/upload.middleware";
import { authenticate } from "@/middlewares/auth.middleware";

const upload = createUpload("videos", "video");

const router: Router = Router();

const videoRepository = new VideoRepository(prisma);
const videoService = new VideoService(videoRepository);
const videoController = new VideoController(videoService);

router.get("/", (req, res, next) => {
  videoController.getAll(req as any, res, next);
});

router.get("/:id", (req, res, next) => {
  videoController.getById(req as any, res, next);
});

router.post(
  "/",
  authenticate,
  upload.single("thumbnail"),
  (req, res, next) => {
    videoController.create(req as any, res, next);
  }
);

router.patch(
  "/:id",
  authenticate,
  upload.single("thumbnail"),
  (req, res, next) => {
    videoController.update(req as any, res, next);
  }
);

router.delete("/:id", authenticate, (req, res, next) => {
  videoController.delete(req as any, res, next);
});

export default router;

