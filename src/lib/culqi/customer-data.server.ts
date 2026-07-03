import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { CulqiUserProfile } from "@/lib/culqi/customer-data";

export async function getUserCulqiProfile(userId: string): Promise<CulqiUserProfile> {
  const [user] = await db
    .select({
      name: users.name,
      email: users.email,
      phone: users.phone,
      address: users.address,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.email) {
    throw new Error("No se encontró el perfil del usuario para el pago");
  }

  return {
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: user.address,
  };
}
