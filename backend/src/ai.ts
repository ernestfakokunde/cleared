// Backwards-compatible server-side adapter while Next's API layer is migrated to Express.
import { generateText, parseJson } from "./services/ai-provider.service.js";
import type { GenerationOptions } from "./services/ai-provider.service.js";
export const callAiModel = (system: string, prompt: string, options: Omit<GenerationOptions, "system" | "prompt"> = {}) => generateText({ system, prompt, ...options });
export const parseAiJson = parseJson;
