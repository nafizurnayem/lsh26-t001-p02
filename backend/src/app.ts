import express, { type NextFunction, type Request, type Response } from "express";
import { config } from "./config.js";
import {
  getActiveMedicines,
  getDashboard,
  getReturnedMedicines,
  returnMedicine,
} from "./inventory/service.js";
import type { ExpiryStatus } from "./inventory/types.js";

const validStatuses = new Set<ExpiryStatus>([
  "expired",
  "expiring_30",
  "expiring_90",
  "safe",
]);

const allowedOrigins = config.corsOrigin
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function resolveAllowedOrigin(requestOrigin: string | undefined): string {
  if (allowedOrigins.includes("*")) return "*";
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }
  return allowedOrigins[0] ?? "*";
}

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json());
  app.use((request, response, next) => {
    const allowOrigin = resolveAllowedOrigin(request.headers.origin);
    response.header("Access-Control-Allow-Origin", allowOrigin);
    if (allowOrigin !== "*") response.header("Vary", "Origin");
    response.header("Access-Control-Allow-Methods", "GET,PATCH,OPTIONS");
    response.header("Access-Control-Allow-Headers", "Content-Type");
    if (request.method === "OPTIONS") return response.sendStatus(204);
    next();
  });

  app.get("/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.get("/api/medicines", async (request, response, next) => {
    try {
    const rawStatus = typeof request.query.status === "string" ? request.query.status : undefined;
    if (rawStatus && !validStatuses.has(rawStatus as ExpiryStatus)) {
      return response.status(400).json({
        error: "Invalid status. Use expired, expiring_30, expiring_90, or safe.",
      });
    }

    const medicines = await getActiveMedicines({
      status: rawStatus as ExpiryStatus | undefined,
      search: typeof request.query.search === "string" ? request.query.search : undefined,
      company: typeof request.query.company === "string" ? request.query.company : undefined,
    });
    response.json({ count: medicines.length, medicines });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/dashboard", async (_request, response, next) => {
    try {
      response.json(await getDashboard());
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/returns", async (_request, response, next) => {
    try {
      const medicines = await getReturnedMedicines();
      response.json({ count: medicines.length, medicines });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/medicines/:id/return", async (request, response, next) => {
    try {
    const medicine = await returnMedicine(request.params.id);
    if (!medicine) {
      return response.status(404).json({
        error: "Medicine not found or already returned.",
      });
    }
    response.json({ message: "Medicine marked as returned.", medicine });
    } catch (error) {
      next(error);
    }
  });

  app.use((_request, response) => {
    response.status(404).json({ error: "Route not found." });
  });

  app.use(
    (error: unknown, _request: Request, response: Response, _next: NextFunction) => {
      console.error(error);
      response.status(500).json({ error: "Internal server error." });
    },
  );

  return app;
}
