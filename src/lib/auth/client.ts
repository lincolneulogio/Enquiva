import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields, twoFactorClient } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";
import { env } from "@/env";

export const authClient = createAuthClient({
  baseURL: typeof window === "undefined" ? env.NEXT_PUBLIC_APP_URL : window.location.origin,
  plugins: [
    inferAdditionalFields<typeof auth>(),
    twoFactorClient({
      onTwoFactorRedirect() {
        if (typeof window !== "undefined") {
          window.location.href = "/two-factor";
        }
      },
    }),
  ],
});

export const {
  signIn,
  signOut,
  signUp,
  useSession,
  getSession,
} = authClient;
