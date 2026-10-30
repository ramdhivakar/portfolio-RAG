import { NextResponse } from "next/server";

export const runtime = "nodejs";

const backendBaseUrl = (process.env.BACKEND_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

export async function GET() {
  try {
    const response = await fetch(`${backendBaseUrl}/api/v1/profile`, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(
        {
          error: response.status === 404
            ? "The FastAPI profile endpoint is not installed yet. Follow backend-integration/README.md in the downloaded ZIP."
            : `The portfolio backend returned HTTP ${response.status}.`,
        },
        { status: response.status >= 500 ? 502 : response.status },
      );
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Cannot reach the FastAPI backend. Start it and check BACKEND_API_URL." },
      { status: 503 },
    );
  }
}
