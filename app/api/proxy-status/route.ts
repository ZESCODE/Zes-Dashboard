import { NextResponse } from "next/server";

const TOR_HTTP_PROXY = "http://127.0.0.1:8118";
const TOR_SOCKS = "127.0.0.1:9050";
const IP_ECHO = "https://httpbin.org/ip";
const TIMEOUT = 8000;

async function fetchViaProxy(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT),
      // Node 18+ fetch doesn't support http_proxy natively — we use the
      // system-level HTTPS_PROXY env var set in 9router's .env instead.
      // For this check we connect directly since we're in the same process.
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.origin || null;
  } catch {
    return null;
  }
}

async function checkPort(host: string, port: number): Promise<boolean> {
  try {
    const { connect } = await import("net");
    return new Promise((resolve) => {
      const s = connect(port, host, () => { s.destroy(); resolve(true); });
      s.on("error", () => resolve(false));
      s.setTimeout(2000, () => { s.destroy(); resolve(false); });
    });
  } catch {
    return false;
  }
}

export async function GET() {
  // Get Tor exit IP via httpbin (direct — works because the server's
  // outbound might or might not route through Tor depending on env)
  const directIp = await fetchViaProxy(IP_ECHO);

  // Check if Tor SOCKS5 and HTTP proxy are listening
  const [torSocks, torHttpProxy] = await Promise.all([
    checkPort("127.0.0.1", 9050),
    checkPort("127.0.0.1", 8118),
  ]);

  // Count running services (quick check via r9 service)
  const r9Ok = await checkPort("127.0.0.1", 20128);

  return NextResponse.json({
    tor: {
      socks5: torSocks,
      httpProxy: torHttpProxy,
      exitIp: directIp || null,
    },
    rotator: {
      interval: "900s (15 min)",
      service: "zes-ip-rotator",
      running: torSocks, // implied by SOCKS being up
    },
    gateway: {
      r9: r9Ok,
      port: 20128,
    },
    model: {
      id: "deepseek-v4",
      full: "deepseek-v4-flash-free",
    },
    proxyUrl: TOR_HTTP_PROXY,
  });
}
