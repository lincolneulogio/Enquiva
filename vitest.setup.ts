/**
 * Minimal env for unit tests — avoids @t3-oss/env validation failures in CI/local without .env.
 */
const testEnv: Record<string, string> = {
  DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  BETTER_AUTH_SECRET: "test-better-auth-secret-min-32-chars!!",
  TICKET_SIGNING_KEY: "test-ticket-signing-key-min-32-chars!!",
  SMTP_HOST: "localhost",
  SMTP_PORT: "2525",
  SMTP_USER: "test",
  SMTP_PASS: "test",
  MAIL_FROM_EMAIL: "test@example.com",
  MAIL_FROM_NAME: "Test",
  PUSHER_APP_ID: "test-app-id",
  PUSHER_SECRET: "test-pusher-secret",
  UPLOADTHING_SECRET: "sk_test_secret",
  UPSTASH_REDIS_REST_URL: "https://test.upstash.io",
  UPSTASH_REDIS_REST_TOKEN: "test-redis-token",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  NEXT_PUBLIC_PUSHER_KEY: "test-pusher-key",
  NEXT_PUBLIC_PUSHER_CLUSTER: "us2",
  NEXT_PUBLIC_UPLOADTHING_APP_ID: "test-uploadthing-app",
};

for (const [key, value] of Object.entries(testEnv)) {
  if (process.env[key] === undefined) {
    process.env[key] = value;
  }
}
