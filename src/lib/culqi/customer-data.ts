import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type CulqiUserProfile = {
  name?: string | null;
  email: string;
  phone?: string | null;
};

export function parseFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: "Cliente", lastName: "Usuario" };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: parts[0] };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

/** Culqi espera 9 dígitos sin prefijo +51 en phone_number. */
export function formatCulqiPhone(phone?: string | null): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.startsWith("51") && digits.length === 11) {
    return digits.slice(2);
  }
  if (digits.length >= 9) {
    return digits.slice(-9);
  }
  return "";
}

export function buildCulqiAddress(profile: CulqiUserProfile): string {
  const displayName = (profile.name ?? "").trim() || profile.email.split("@")[0] || "Cliente";
  const phone = formatCulqiPhone(profile.phone);

  if (phone) {
    const line = `${displayName}, tel. ${phone}, Lima, Perú`;
    if (line.length >= 6 && line.length <= 100) return line;
  }

  const fallback = `${displayName}, Lima, Perú`;
  return fallback.length <= 100 ? fallback : fallback.slice(0, 100);
}

export function resolveCulqiCustomerData(profile: CulqiUserProfile) {
  const nameSource = (profile.name ?? "").trim() || profile.email.split("@")[0] || "Cliente";
  const { firstName, lastName } = parseFullName(nameSource);
  const phone = formatCulqiPhone(profile.phone);

  return {
    firstName: firstName.slice(0, 50),
    lastName: lastName.slice(0, 50),
    phone: phone || "999999999",
    email: profile.email,
    antifraud: {
      first_name: firstName.slice(0, 50),
      last_name: lastName.slice(0, 50),
      address: buildCulqiAddress(profile),
      address_city: "Lima",
      country_code: "PE",
      phone_number: (phone || "999999999").slice(0, 15),
    },
  };
}

export async function getUserCulqiProfile(userId: string): Promise<CulqiUserProfile> {
  const [user] = await db
    .select({
      name: users.name,
      email: users.email,
      phone: users.phone,
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
  };
}

export function mergeSessionCulqiProfile(
  sessionUser: { name?: string | null; email?: string | null },
  dbProfile: CulqiUserProfile,
): CulqiUserProfile {
  return {
    name: dbProfile.name ?? sessionUser.name ?? null,
    email: dbProfile.email || sessionUser.email || "",
    phone: dbProfile.phone,
  };
}
