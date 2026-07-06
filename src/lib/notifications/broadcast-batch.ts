/**
 * Utilidades de envío masivo (emails, in-app, Pusher).
 */

export const DEFAULT_BROADCAST_BATCH_SIZE = 8;

export function chunkRecipients<T>(items: readonly T[], batchSize: number): T[][] {
  if (batchSize < 1) throw new Error("batchSize must be >= 1");
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize) as T[]);
  }
  return batches;
}

export function resolveBroadcastBatchSize(envValue?: number): number {
  if (envValue == null || Number.isNaN(envValue)) return DEFAULT_BROADCAST_BATCH_SIZE;
  return Math.min(50, Math.max(1, Math.floor(envValue)));
}
