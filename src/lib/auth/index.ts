import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { env } from "@/env";
import { count } from "drizzle-orm";
import { sendPasswordResetEmail } from "@/lib/mail";

function parseTrustedOriginsEnv(): string[] {
  const raw = process.env.BETTER_AUTH_TRUSTED_ORIGINS;
  if (!raw) return [];

  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function getRequestOriginFromHost(request?: Request): string | undefined {
  if (!request) return undefined;

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return undefined;

  const protocol = request.headers.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.NEXT_PUBLIC_APP_URL,
  trustedOrigins: async (request) => {
    const configured = [
      env.NEXT_PUBLIC_APP_URL,
      env.NEXT_PUBLIC_DOCS_URL,
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3001",
      ...parseTrustedOriginsEnv(),
    ].filter(Boolean) as string[];

    const requestHostOrigin = getRequestOriginFromHost(request);
    if (requestHostOrigin) configured.push(requestHostOrigin);

    return Array.from(new Set(configured));
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail({
        email: user.email,
        name: user.name,
        url,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: false,
    sendOnSignIn: false,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "member",
        input: false,
      },
      bio: {
        type: "string",
        required: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const [{ count: userCount }] = await db
            .select({ count: count() })
            .from(schema.users);

          const role = userCount === 0 ? "super_admin" : "member";

          return { data: { ...user, role } };
        },
      },
    },
  },
  session: {
    expiresIn: 60 * 60, // 1 hour
    updateAge: 60 * 15, // refresh if older than 15 minutes
  },
});

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
