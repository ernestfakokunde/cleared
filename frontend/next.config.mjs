/** @type {import('next').NextConfig} */
import dotenv from "dotenv";
import path from "node:path";

// Keep one root .env shared by the frontend and Express backend.
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

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
