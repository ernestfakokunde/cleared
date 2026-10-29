import type { ErrorRequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(public readonly statusCode: number, message: string) { super(message); this.name = "HttpError"; }
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) return res.status(400).json({ error: "Invalid request.", details: error.flatten() });
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") return res.status(404).json({ error: "Record not found." });
    if (error.code === "P2002") return res.status(409).json({ error: "That record already exists." });
  }
  if (error instanceof HttpError) return res.status(error.statusCode).json({ error: error.message });
  console.error(error);
  return res.status(500).json({ error: "Something went wrong. Please try again." });
};
