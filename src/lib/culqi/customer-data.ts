export type CulqiUserProfile = {
  name?: string | null;
  email: string;
  phone?: string | null;
  address?: string | null;
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

/** Culqi espera 9 dígitos locales sin prefijo +51. */
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

const CULQI_DEFAULT_LOCAL_PHONE = "999999999";

export function formatCulqiLocalPhone(phone?: string | null): string {
  const local = formatCulqiPhone(phone);
  return local && /^9\d{8}$/.test(local) ? local : CULQI_DEFAULT_LOCAL_PHONE;
}

/** 9 dígitos locales como string (ej. 986765435). Formato que exige Culqi en clientes y cargos. */
export function formatCulqiPhoneNumberForApi(phone?: string | null): string {
  return formatCulqiLocalPhone(phone);
}

const CULQI_DEFAULT_ADDRESS = "Av. Javier Prado 150, Lima, Perú";

export function buildCulqiAddress(profile: CulqiUserProfile): string {
  const savedAddress = (profile.address ?? "").trim();
  if (savedAddress.length >= 6 && savedAddress.length <= 100) {
    return savedAddress;
  }

  const displayName = (profile.name ?? "").trim() || profile.email.split("@")[0] || "Cliente";
  const phone = formatCulqiPhone(profile.phone);

  let line: string;
  if (phone) {
    line = `${displayName}, tel. ${phone}, Lima, Perú`;
  } else {
    line = `${displayName}, Lima, Perú`;
  }

  if (line.length > 100) {
    line = line.slice(0, 100).trimEnd();
  }
  if (line.length >= 6) {
    return line;
  }

  return CULQI_DEFAULT_ADDRESS;
}

export function resolveCulqiCustomerData(profile: CulqiUserProfile) {
  const nameSource = (profile.name ?? "").trim() || profile.email.split("@")[0] || "Cliente";
  const { firstName, lastName } = parseFullName(nameSource);
  const localPhone = formatCulqiLocalPhone(profile.phone);
  const apiPhone = formatCulqiPhoneNumberForApi(profile.phone);

  return {
    firstName: firstName.slice(0, 50),
    lastName: lastName.slice(0, 50),
    phone: localPhone,
    email: profile.email,
    antifraud: {
      first_name: firstName.slice(0, 50),
      last_name: lastName.slice(0, 50),
      address: buildCulqiAddress(profile),
      address_city: "Lima",
      country_code: "PE",
      phone_number: apiPhone,
    },
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
    address: dbProfile.address,
  };
}
