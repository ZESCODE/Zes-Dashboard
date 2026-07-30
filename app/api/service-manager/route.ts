import { NextRequest, NextResponse } from "next/server";

const SERVICE_MAP: Record<string, { cmd: string; port?: number; label: string }> = {
  "codex": { cmd: "npx codexapp", port: 5900, label: "Codex Web UI" },
  "hermes": { cmd: "hermes", port: 0, label: "Hermes Agent" },
  "hermes-dashboard": { cmd: "hermes dashboard", port: 9119, label: "Hermes Dashboard" },
  "bitrouter": { cmd: "bitrouter-start", port: 4356, label: "BitRouter Gateway" },
  "claude-proxy": { cmd: "sv start claude-proxy", port: 5905, label: "Claude Proxy" },
  "memory-sync": { cmd: "sv start zes-memory-sync", port: 0, label: "Memory Sync" },
};

async function checkPort(host: string, port: number): Promise<boolean> {
  try {
    const net = await import("net");
    return new Promise((resolve) => {
      const s = net.connect(port, host, () => { s.destroy(); resolve(true); });
      s.on("error", () => resolve(false));
      s.setTimeout(2000, () => { s.destroy(); resolve(false); });
    });
  } catch { return false; }
}

export async function GET() {
  const statuses: Record<string, any> = {};
  for (const [name, svc] of Object.entries(SERVICE_MAP)) {
    const alive = svc.port ? await checkPort("127.0.0.1", svc.port) : false;
    statuses[name] = { name, port: svc.port, alive, cmd: svc.cmd, label: svc.label };
  }
  return NextResponse.json({ services: statuses });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, service } = body;

    if (!service || !SERVICE_MAP[service]) {
      return NextResponse.json({ error: `Unknown service: ${service}` }, { status: 400 });
    }

    const svc = SERVICE_MAP[service];
    const { execSync } = await import("child_process");

    const run = (cmd: string) => {
      try {
        return execSync(cmd, { timeout: 10000, encoding: "utf-8", shell: "/data/data/com.termux/files/usr/bin/bash" }).toString().trim();
      } catch (e: any) {
        return e.stderr?.toString().trim() || e.message;
      }
    };

    switch (action) {
      case "start":
        run(`cd ~ && ${svc.cmd} > /dev/null 2>&1 &`);
        return NextResponse.json({ status: "ok", action: "start", service });

      case "stop":
        if (svc.port) run(`fuser -k ${svc.port}/tcp 2>/dev/null`);
        return NextResponse.json({ status: "ok", action: "stop", service });

      case "restart":
        if (svc.port) run(`fuser -k ${svc.port}/tcp 2>/dev/null`);
        run(`cd ~ && ${svc.cmd} > /dev/null 2>&1 &`);
        return NextResponse.json({ status: "ok", action: "restart", service });

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
