const recent = new Map<string, number>();

export function markAfk(userId: string) {
  recent.set(userId, Date.now() + 3_000);
}

export function justSetAfk(userId: string) {
  const until = recent.get(userId) ?? 0;
  if (until <= Date.now()) recent.delete(userId);
  return until > Date.now();
}
