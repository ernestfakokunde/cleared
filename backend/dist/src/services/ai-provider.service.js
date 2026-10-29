import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";
import { HttpError } from "../middleware/error-handler.js";
export async function generateText({ system, prompt, json = false, temperature = 0.3, maxTokens = 2048 }) {
    const systemPrompt = json ? `${system}\nReturn only valid JSON. Do not wrap it in Markdown fences.` : system;
    try {
        if (env.AI_PROVIDER === "anthropic") {
            if (!env.ANTHROPIC_API_KEY)
                throw new HttpError(503, "Claude is not configured. Add ANTHROPIC_API_KEY.");
            const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
            const response = await client.messages.create({
                model: env.ANTHROPIC_MODEL,
                max_tokens: maxTokens,
                system: systemPrompt,
                messages: [{ role: "user", content: prompt }],
            });
            const text = response.content.filter(block => block.type === "text").map(block => block.text).join("\n");
            if (!text)
                throw new Error("Claude returned an empty response.");
            return text;
        }
        if (!env.GEMINI_API_KEY)
            throw new HttpError(503, "Gemini is not configured. Add GEMINI_API_KEY.");
        const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
        const response = await client.models.generateContent({
            model: env.GEMINI_MODEL,
            contents: prompt,
            config: { systemInstruction: systemPrompt, temperature, maxOutputTokens: maxTokens, ...(json ? { responseMimeType: "application/json" } : {}) },
        });
        if (!response.text)
            throw new Error("Gemini returned an empty response.");
        return response.text;
    }
    catch (error) {
        if (error instanceof HttpError)
            throw error;
        console.error("AI provider request failed", { provider: env.AI_PROVIDER, error });
        throw new HttpError(503, "The AI service is temporarily unavailable. Please try again.");
    }
}
export function parseJson(text) {
    return JSON.parse(text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""));
}
