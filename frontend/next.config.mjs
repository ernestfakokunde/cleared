/** @type {import('next').NextConfig} */
import dotenv from "dotenv";
import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Prefer the documented root .env, while supporting existing backend/.env setups.
const frontendRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(frontendRoot, "..");
const rootEnv = path.resolve(repoRoot, ".env");
dotenv.config({ path: existsSync(rootEnv) ? rootEnv : path.resolve(repoRoot, "backend/.env") });

const nextConfig = {
  // Keep production builds from replacing assets used by a running dev server.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  webpack(config) {
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      ".js": [".ts", ".tsx", ".js"],
    };
    return config;
  },
};

export default nextConfig;
