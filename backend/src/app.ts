import express from "express";
import cors from "cors";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { requireInternalIdentity } from "./middleware/internal-auth.js";
import { errorHandler } from "./middleware/error-handler.js";
import { aiRouter, aiUtilityRouter } from "./routes/ai.routes.js";
import { workRouter } from "./routes/work.routes.js";

export const app = express();
app.disable("x-powered-by");
if (env.NODE_ENV === "production") app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_ORIGIN, methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], allowedHeaders: ["Content-Type", "Authorization"] }));
app.use(express.json({ limit: "1mb", verify: (req, _res, buffer) => { (req as typeof req & { rawBody?: Buffer }).rawBody = Buffer.from(buffer); } }));
app.use(pinoHttp({ redact: ["req.headers.authorization", "req.headers.cookie", "req.headers.x-cleared-signature"] }));
app.get("/health", (_req, res) => res.json({ status: "ok", service: "cleared-api", version: "1" }));

const apiLimiter = rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: "draft-8", legacyHeaders: false, message: { error: "Too many requests. Please try again shortly." } });
app.use("/api", apiLimiter, requireInternalIdentity);
app.use("/api/ai", aiRouter);
app.use("/api", aiUtilityRouter);
app.use("/api", workRouter);
app.use((_req, res) => res.status(404).json({ error: "Route not found." }));
app.use(errorHandler);
