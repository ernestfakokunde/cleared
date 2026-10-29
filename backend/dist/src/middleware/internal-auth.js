import { createHash, createHmac, timingSafeEqual } from "node:crypto";
export function requireInternalIdentity(req, res, next) {
    const secret = process.env.BACKEND_API_SECRET;
    const userId = req.header("x-cleared-user-id");
    const timestamp = req.header("x-cleared-timestamp");
    const signature = req.header("x-cleared-signature");
    if (!secret || !userId || !timestamp || !signature || !/^\d+$/.test(timestamp))
        return res.status(401).json({ error: "Unauthorized." });
    const issuedAt = Number(timestamp);
    if (!Number.isSafeInteger(issuedAt) || Math.abs(Date.now() - issuedAt) > 5 * 60 * 1000)
        return res.status(401).json({ error: "Expired request." });
    const bodyHash = createHash("sha256").update(req.rawBody ?? Buffer.alloc(0)).digest("hex");
    const expected = createHmac("sha256", secret).update(`${userId}:${timestamp}:${req.method}:${req.originalUrl}:${bodyHash}`).digest("hex");
    const supplied = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");
    if (supplied.length !== expectedBuffer.length || !timingSafeEqual(supplied, expectedBuffer))
        return res.status(401).json({ error: "Unauthorized." });
    req.userId = userId;
    return next();
}
