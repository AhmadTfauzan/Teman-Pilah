import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import productRoutes from "../modules/product/product.routes";
import newsRoutes from "../modules/news/news.routes";
import educationRoutes from "../modules/education/education.routes";
import galleryRoutes from "../modules/gallery/gallery.routes";
import ecoEnzymeRoutes from "../modules/eco-enzyme/eco-enzyme.routes";
import heroRoutes from "../modules/hero/hero.routes";
import videoRoutes from "../modules/video/video.routes";

const router: Router = Router();

router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/news", newsRoutes);
router.use("/education", educationRoutes);
router.use("/gallery", galleryRoutes);
router.use("/eco-enzyme", ecoEnzymeRoutes);
router.use("/hero", heroRoutes);
router.use("/videos", videoRoutes);

console.log("Routes registered: auth, products, news, education, gallery, eco-enzyme, hero, videos");

export default router;