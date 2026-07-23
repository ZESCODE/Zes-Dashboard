import { useState, useEffect } from "react";

export function useServiceStatus(port: number) {
  const [status, setStatus] = useState<"online" | "offline" | "checking">("checking");

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`/api/service-check?port=${port}`, {
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
          const data = await res.json();
          setStatus(data.status === "online" ? "online" : "offline");
        } else {
          setStatus("offline");
        }
      } catch {
        // Use health API as fallback
        try {
          const res = await fetch("http://127.0.0.1:5002/api/health");
          if (res.ok) {
            const data = await res.json();
            const match = (data as any[]).find((h: any) => h.port === port);
            setStatus(match?.alive ? "online" : "offline");
          } else {
            setStatus("offline");
          }
        } catch {
          setStatus("offline");
        }
      }
    };

    check();
    const iv = setInterval(check, 30000);
    return () => clearInterval(iv);
  }, [port]);

  return status;
}
