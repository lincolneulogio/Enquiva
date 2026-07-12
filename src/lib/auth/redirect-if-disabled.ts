import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { cache } from "react";

const isUserActive = cache(async (userId: string, sessionFlag?: boolean | null) => {
  if (sessionFlag === false) return false;
  if (sessionFlag === true) return true;

  const [row] = await db
    .select({ isActive: users.isActive })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return row?.isActive !== false;
});

/** Redirige a login si la cuenta está suspendida (layouts de dashboard). */
export async function redirectIfAccountDisabled(user: {
  id: string;
  isActive?: boolean | null;
}) {
  const active = await isUserActive(user.id, user.isActive);
  if (!active) {
    redirect("/login?error=account_disabled");
  }
}
