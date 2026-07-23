import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const port = searchParams.get("port");
  const rawUrl = searchParams.get("url");

  // Determine the target URL to check
  let target: string;
  if (rawUrl) {
    target = rawUrl;
  } else if (port) {
    target = `http://127.0.0.1:${port}`;
  } else {
    return NextResponse.json(
      { status: "offline", error: "Provide ?port= or ?url=" },
      { status: 400 }
    );
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(target, {
      method: "HEAD",
      signal: controller.signal,
      // No mode:"no-cors" — this is a server-side fetch, no CORS restrictions
    });

    clearTimeout(timeout);

    // Any response (even 404, 500) means the service is listening
    return NextResponse.json({
      status: "online",
      port: port ? parseInt(port, 10) : undefined,
      url: rawUrl || undefined,
      code: res.status,
    });
  } catch {
    return NextResponse.json({
      status: "offline",
      port: port ? parseInt(port, 10) : undefined,
      url: rawUrl || undefined,
    });
  }
}
