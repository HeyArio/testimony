// In-memory fixed-window rate limiter. Fine for a single pm2 process at MVP
// scale (see CLAUDE.md — no Redis); swap for a DB-backed one if we cluster.

type Window = { count: number; resetAt: number };
const windows = new Map<string, Window>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const w = windows.get(key);
  if (!w || w.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  w.count += 1;
  if (windows.size > 10_000) {
    for (const [k, v] of windows) if (v.resetAt <= now) windows.delete(k);
  }
  return w.count <= limit;
}

export function clientIp(req: Request): string {
  // Behind nginx with $proxy_add_x_forwarded_for, which APPENDS the real
  // client IP to whatever the client sent — so only the LAST hop is
  // trustworthy. Taking the first hop would let anyone reset their rate
  // limit per request with a spoofed X-Forwarded-For header.
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const hops = xff.split(",");
    return hops[hops.length - 1].trim();
  }
  return req.headers.get("x-real-ip") ?? "unknown";
}
