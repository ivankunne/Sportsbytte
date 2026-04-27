const store = new Map<string, { count: number; resetAt: number }>();

interface RateLimitOptions {
  /** Max requests allowed in the window */
  limit: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

export function rateLimit(key: string, opts: RateLimitOptions): boolean {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + opts.windowMs });
    return false; // not limited
  }
  if (entry.count >= opts.limit) return true; // limited
  entry.count++;
  return false;
}

export function ipKey(req: Request, prefix: string): string {
  const fwd = (req.headers as Headers).get("x-forwarded-for");
  const real = (req.headers as Headers).get("x-real-ip");
  const ip = fwd?.split(",")[0].trim() ?? real ?? "unknown";
  return `${prefix}:${ip}`;
}
