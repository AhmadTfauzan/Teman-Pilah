import { Router } from "express";
import { prisma } from "@/lib/prisma";
import { HeroRepository } from "./hero.repository";
import { HeroService } from "./hero.service";
import { HeroController } from "./hero.controller";
import { createUpload } from "@/middlewares/upload.middleware";
import { authenticate } from "@/middlewares/auth.middleware";

const upload = createUpload("hero", "hero");

const router: Router = Router();

const heroRepository = new HeroRepository(prisma);
const heroService = new HeroService(heroRepository);
const heroController = new HeroController(heroService);

router.get("/", (req, res, next) => {
  heroController.getAll(req as any, res, next);
});

router.get("/:id", heroController.getById);

router.post(
  "/",
  authenticate,
  upload.single("image"),
  heroController.create,
);

router.patch(
  "/:id/toggle",
  authenticate,
  heroController.toggleActive,
);

router.patch(
  "/:id",
  authenticate,
  upload.single("image"),
  heroController.update,
);

router.put(
  "/:id",
  authenticate,
  upload.single("image"),
  heroController.update,
);

router.delete("/:id", authenticate, heroController.delete);

export default router;

