import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { env } from "@/env";
import { sendPasswordResetEmail } from "@/lib/mail";
import { resolveSignupRole } from "@/lib/auth/platform-bootstrap";

function parseTrustedOriginsEnv(): string[] {
  const raw = process.env.BETTER_AUTH_TRUSTED_ORIGINS;
  if (!raw) return [];

  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

/** Solo allowlist fija — nunca el Host del request (spoofable vía x-forwarded-host). */
function getTrustedOrigins(): string[] {
  return Array.from(
    new Set(
      [
        env.NEXT_PUBLIC_APP_URL,
        env.NEXT_PUBLIC_DOCS_URL,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        ...parseTrustedOriginsEnv(),
      ].filter(Boolean) as string[],
    ),
  );
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
  trustedOrigins: getTrustedOrigins(),
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
      isActive: {
        type: "boolean",
        defaultValue: true,
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const role = await resolveSignupRole();

          return { data: { ...user, role } };
        },
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 8, // 8 hours — jornadas largas de eventos
    updateAge: 60 * 10, // renueva cookie si pasaron 10 min desde la última actualización
  },
});

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
