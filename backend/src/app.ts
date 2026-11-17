import "dotenv/config";
import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import routes from "./routes/index";
import { errorHandler } from "./middlewares/error.middleware";

const app: Application = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
  origin: (origin, callback) => {
    // Izinkan permintaan tanpa origin (seperti mobile app, cURL, server-to-server)
    if (!origin) return callback(null, true);
    if (
      origin === process.env.CLIENT_URL ||
      origin === "http://localhost:3000" ||
      origin === "https://temanpilah.com" ||
      origin === "https://www.temanpilah.com" ||
      /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin) ||
      /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin) ||
      /^http:\/\/localhost(:\d+)?$/.test(origin) ||
      /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)
    ) {
      return callback(null, true);
    }
    // Izinkan semua origin di development untuk kemudahan pengujian HP lokal
    return callback(null, true);
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
