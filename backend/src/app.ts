import "dotenv/config";
import "./register-paths";
import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import routes from "./routes/index";
import { AppError, errorHandler } from "./middlewares/error.middleware";

const parseOrigins = (raw?: string): string[] => {
  if (!raw) return [];
  return raw
    .split(",")
    .map((item) => item.trim().replace(/\/+$/, ""))
    .filter(Boolean)
    .map((item) => {
      try {
        return new URL(item).origin;
      } catch {
        return item;
      }
    });
};

const getAllowedOrigins = (isProduction: boolean): Set<string> => {
  const siteOrigins = parseOrigins(process.env.NEXT_PUBLIC_SITE_URL).filter(
    (origin) =>
      !isProduction ||
      (!origin.includes("localhost") && !origin.includes("127.0.0.1")),
  );

  return new Set<string>([
    "https://temanpilah.com",
    "https://www.temanpilah.com",
    "https://teman-pilahfe-main.vercel.app",
    ...parseOrigins(process.env.CLIENT_URL),
    ...siteOrigins,
  ]);
};

const app: Application = express();

app.set("trust proxy", 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
  origin: (origin, callback) => {
    // Izinkan permintaan tanpa origin (seperti mobile app, cURL, server-to-server)
    if (!origin) return callback(null, true);

    const isProduction = process.env.NODE_ENV === "production";
    const normalizedOrigin = origin.trim().replace(/\/+$/, "");
    const allowedOrigins = getAllowedOrigins(isProduction);

    if (allowedOrigins.has(normalizedOrigin)) {
      return callback(null, true);
    }

    if (!isProduction) {
      if (
        /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(normalizedOrigin) ||
        /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(normalizedOrigin) ||
        /^http:\/\/localhost(:\d+)?$/.test(normalizedOrigin) ||
        /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(normalizedOrigin)
      ) {
        return callback(null, true);
      }
      // Izinkan semua origin hanya di non-production untuk kemudahan pengujian perangkat lokal
      return callback(null, true);
    }

    return callback(new AppError("Origin tidak diizinkan oleh CORS", 403));
  },
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api", routes);

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    message: "Server is running",
    env: process.env.NODE_ENV ?? "development",
  });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    status: "error",
    message: "Route tidak ditemukan",
  });
});

app.use(errorHandler);

export default app;
