import { Redis } from "@upstash/redis";

async function main() {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  const pong = await redis.ping();
  await redis.set("Eventia:healthcheck", "ok", { ex: 60 });
  const value = await redis.get("Eventia:healthcheck");

  console.log("Upstash Redis conectado:", pong);
  console.log("Test read/write:", value);
}

main().catch((err) => {
  console.error("Error Upstash:", err.message ?? err);
  process.exit(1);
});
