const buckets = new Map<string, number[]>();

export function reachesLimit(
  scope: string,
  limit: number,
  windowSeconds: number,
): boolean {
  const now = Date.now();
  const cutoff = now - windowSeconds * 1_000;
  const recent = (buckets.get(scope) ?? []).filter((time) => time > cutoff);
  recent.push(now);

  if (recent.length >= limit) buckets.delete(scope);
  else buckets.set(scope, recent);

  return recent.length >= limit;
}

export function clearLimits(scopePrefix: string): void {
  for (const key of buckets.keys()) {
    if (key.startsWith(scopePrefix)) buckets.delete(key);
  }
}
