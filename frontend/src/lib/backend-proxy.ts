import { createHash, createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function proxyToBackend(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to use this feature." }, { status: 401 });
  const secret = process.env.BACKEND_API_SECRET;
  if (!secret) return NextResponse.json({ error: "Backend authentication is not configured." }, { status: 503 });
  const backendUrl = (process.env.BACKEND_API_URL ?? "http://localhost:4000").replace(/\/$/, "");
  const userId = session.user.id; const timestamp = String(Date.now()); const source = new URL(request.url);
  const body = request.method === "GET" || request.method === "HEAD" ? undefined : Buffer.from(await request.arrayBuffer());
  const bodyHash = createHash("sha256").update(body ?? Buffer.alloc(0)).digest("hex");
  const signature = createHmac("sha256", secret).update(`${userId}:${timestamp}:${request.method}:${source.pathname}${source.search}:${bodyHash}`).digest("hex");
  const headers = new Headers({ "x-cleared-user-id": userId, "x-cleared-timestamp": timestamp, "x-cleared-signature": signature, accept: "application/json" });
  const contentType = request.headers.get("content-type"); if (contentType) headers.set("content-type", contentType);
  try {
    const response = await fetch(`${backendUrl}${source.pathname}${source.search}`, { method: request.method, headers, ...(body ? { body } : {}), cache: "no-store", signal: AbortSignal.timeout(50000) });
    return new Response(response.body, { status: response.status, headers: { "content-type": response.headers.get("content-type") ?? "application/json" } });
  } catch {
    return NextResponse.json({ error: "The Cleared backend is unavailable. Start the Express service and try again." }, { status: 503 });
  }
}
