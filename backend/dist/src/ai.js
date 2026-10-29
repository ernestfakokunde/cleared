// Backwards-compatible server-side adapter while Next's API layer is migrated to Express.
import { generateText, parseJson } from "./services/ai-provider.service.js";
export const callAiModel = (system, prompt, options = {}) => generateText({ system, prompt, ...options });
export const parseAiJson = parseJson;
