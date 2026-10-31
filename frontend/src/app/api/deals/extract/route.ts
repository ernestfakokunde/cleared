import pdfParse from "pdf-parse";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { proxyToBackend } from "@/lib/backend-proxy";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to use this feature." }, { status: 401 });
  if (!(request.headers.get("content-type") ?? "").includes("multipart/form-data")) {
    return proxyToBackend(request);
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a PDF or text file first." }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Files must be 10 MB or smaller." }, { status: 413 });

  let text: string;
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const isText = file.type.startsWith("text/") || /\.(txt|md)$/i.test(file.name);
  if (isPdf) {
    try {
      const parsed = await pdfParse(Buffer.from(await file.arrayBuffer()));
      text = parsed.text;
    } catch {
      return NextResponse.json({ error: "This PDF could not be read. Try a text-based PDF or paste its text." }, { status: 400 });
    }
  } else if (isText) {
    text = await file.text();
  } else {
    return NextResponse.json({ error: "Upload a PDF, TXT, or Markdown file." }, { status: 415 });
  }

  text = text.replace(/\s+/g, " ").trim();
  if (text.length < 40) return NextResponse.json({ error: "No readable contract text was found. Scanned PDFs need OCR; you can paste the text instead." }, { status: 422 });
  if (text.length > 30_000) return NextResponse.json({ error: "This file contains too much text. Upload a shorter document or paste the relevant section." }, { status: 413 });

  const extractionRequest = new Request(request.url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text }),
  });
  return proxyToBackend(extractionRequest);
}
