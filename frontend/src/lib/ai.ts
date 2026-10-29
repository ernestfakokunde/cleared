import { prisma } from "@/lib/prisma";
export { callAiModel as askModel, parseAiJson as jsonFromAi } from "../../../backend/src/ai";

export function isAiConfigured() {
  const provider = process.env.AI_PROVIDER ?? "gemini";
  return provider === "anthropic" ? Boolean(process.env.ANTHROPIC_API_KEY) : Boolean(process.env.GEMINI_API_KEY);
}

export async function recordAiUsage(userId: string, feature: string) {
  const limit = Math.max(1, Number(process.env.AI_DAILY_LIMIT ?? 20));
  const start = new Date(); start.setUTCHours(0, 0, 0, 0);
  const count = await prisma.aiUsage.count({ where: { userId, createdAt: { gte: start } } });
  if (count >= limit) return false;
  await prisma.aiUsage.create({ data: { userId, feature } });
  return true;
}

