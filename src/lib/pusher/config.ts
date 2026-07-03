function isPlaceholder(value: string): boolean {
  return (
    !value ||
    value.startsWith("your-") ||
    value.startsWith("replace-") ||
    value.startsWith("local-dev") ||
    value.includes("placeholder") ||
    value === "000000"
  );
}

export function isPusherClientConfigured(): boolean {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY ?? "";
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? "";
  return !isPlaceholder(key) && !isPlaceholder(cluster);
}

export function isPusherServerConfigured(): boolean {
  if (!isPusherClientConfigured()) return false;
  const appId = process.env.PUSHER_APP_ID ?? "";
  const secret = process.env.PUSHER_SECRET ?? "";
  return !isPlaceholder(appId) && !isPlaceholder(secret);
}
