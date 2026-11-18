import "dotenv/config";
import "./register-paths";
import app from "./app";
import { pool, prisma } from "./lib/prisma";

const PORT: number = Number(process.env.PORT) || 2000;

const server = app.listen(PORT, () => {
  console.log("Server running in port : ", PORT);
});

let isShuttingDown = false;

const shutdown = (signal: string): void => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n[${signal}] Shutting down gracefully...`);

  const forceTimer = setTimeout(() => {
    console.error("Forced shutdown after timeout.");
    process.exit(1);
  }, 10_000);
  forceTimer.unref();

  server.close(async () => {
    try {
      await prisma.$disconnect();
      await pool.end();
      console.log("Server and database connections closed. Exiting process.");
      process.exit(0);
    } catch (err) {
      console.error("Error during database shutdown:", err);
      process.exit(1);
    }
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason: unknown) => {
  console.error("Unhandled Rejection:", reason);
  shutdown("unhandledRejection");
});

process.on("uncaughtException", (error: Error) => {
  console.error("Uncaught Exception:", error.message);
  shutdown("uncaughtException");
});
