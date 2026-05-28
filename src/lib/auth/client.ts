import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";
import { env } from "@/env";

export const authClient = createAuthClient({
  baseURL: typeof window === "undefined" ? env.NEXT_PUBLIC_APP_URL : window.location.origin,
  plugins: [
    inferAdditionalFields<typeof auth>()
  ]
});

export const {
  signIn,
  signOut,
  signUp,
  useSession,
  getSession,
} = authClient;
