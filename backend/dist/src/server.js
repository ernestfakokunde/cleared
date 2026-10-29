import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
if (env.NODE_ENV === "production" && (!env.DATABASE_URL || !env.BACKEND_API_SECRET)) {
    throw new Error("Production startup requires DATABASE_URL and BACKEND_API_SECRET.");
}
const server = app.listen(env.BACKEND_PORT, () => {
    console.info(`Cleared Express API listening on port ${env.BACKEND_PORT} (${env.NODE_ENV})`);
});
let shuttingDown = false;
async function shutdown(signal) {
    if (shuttingDown)
        return;
    shuttingDown = true;
    console.info(`Received ${signal}; closing HTTP server.`);
    server.close(async (error) => {
        if (error)
            console.error("HTTP server shutdown failed", error);
        await prisma.$disconnect();
        process.exit(error ? 1 : 0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
}
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
