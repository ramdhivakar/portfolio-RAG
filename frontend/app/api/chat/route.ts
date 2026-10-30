import { NextResponse } from "next/server";

export const runtime = "nodejs";

const backendBaseUrl = (process.env.BACKEND_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { message?: unknown };
    if (typeof body.message !== "string" || !body.message.trim()) {
      return NextResponse.json({ error: "A message is required." }, { status: 400 });
    }

    const response = await fetch(`${backendBaseUrl}/api/v1/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: body.message.trim() }),
      cache: "no-store",
      signal: AbortSignal.timeout(45000),
    });

    const data = (await response.json().catch(() => ({}))) as { answer?: string; detail?: string; error?: string };
    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || data.error || `The portfolio backend returned HTTP ${response.status}.` },
        { status: response.status >= 400 && response.status < 500 ? response.status : 502 },
      );
    }

    if (typeof data.answer !== "string" || !data.answer.trim()) {
      return NextResponse.json({ error: "The backend returned an empty answer." }, { status: 502 });
    }

    return NextResponse.json({ answer: data.answer });
  } catch (error) {
    const message = error instanceof Error && error.name === "TimeoutError"
      ? "The portfolio backend took too long to respond. Please try again."
      : "Cannot reach the FastAPI backend. Make sure it is running at BACKEND_API_URL.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
