import { NextResponse } from "next/server";

const AMUX_URL = "http://127.0.0.1:8822";

export async function GET() {
  try {
    const res = await fetch(AMUX_URL, { signal: AbortSignal.timeout(10000) });
    const html = await res.text();

    // Strip X-Frame-Options so the iframe can embed from any origin
    const stripped = html.replace(
      /<meta\s+http-equiv=["']X-Frame-Options["'][^>]*>/gi,
      ""
    );

    return new NextResponse(stripped, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Frame-Options": "",       // explicitly removed
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e: any) {
    return new NextResponse(
      `<!DOCTYPE html><html><body><h1>Service Unreachable</h1><p>Could not connect to amux on :8822.</p><p>${e.message}</p></body></html>`,
      {
        status: 502,
        headers: { "Content-Type": "text/html" },
      }
    );
  }
}
