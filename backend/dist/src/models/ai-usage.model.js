import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
export async function consumeDailyAiQuota(userId, feature) {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    return prisma.$transaction(async (tx) => {
        const used = await tx.aiUsage.count({ where: { userId, createdAt: { gte: start } } });
        if (used >= env.AI_DAILY_LIMIT)
            return false;
        await tx.aiUsage.create({ data: { userId, feature } });
        return true;
    }, { isolationLevel: "Serializable" });
}
