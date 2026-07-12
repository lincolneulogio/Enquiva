export type CulqiKeyEnv = "test" | "live";

const PUBLIC_RE = /^(pk)_(test|live)_[A-Za-z0-9]+$/;
const SECRET_RE = /^(sk)_(test|live)_[A-Za-z0-9]+$/;

export function parseCulqiPublicKey(raw: string):
  | { ok: true; env: CulqiKeyEnv; value: string }
  | { ok: false; error: string } {
  const value = raw.trim();
  if (!value) {
    return { ok: false, error: "La llave pública Culqi es obligatoria." };
  }
  const match = value.match(PUBLIC_RE);
  if (!match) {
    return {
      ok: false,
      error: "Llave pública inválida. Debe empezar por pk_test_ o pk_live_.",
    };
  }
  return { ok: true, env: match[2] as CulqiKeyEnv, value };
}

export function parseCulqiSecretKey(raw: string):
  | { ok: true; env: CulqiKeyEnv; value: string }
  | { ok: false; error: string } {
  const value = raw.trim();
  if (!value) {
    return { ok: false, error: "La llave secreta Culqi es obligatoria." };
  }
  const match = value.match(SECRET_RE);
  if (!match) {
    return {
      ok: false,
      error: "Llave secreta inválida. Debe empezar por sk_test_ o sk_live_.",
    };
  }
  return { ok: true, env: match[2] as CulqiKeyEnv, value };
}

/** Valida par de llaves y que ambas sean test o ambas live. */
export function assertOrganizerCulqiKeys(publicKey: string, secretKey: string): {
  publicKey: string;
  secretKey: string;
  env: CulqiKeyEnv;
} {
  const pub = parseCulqiPublicKey(publicKey);
  if (!pub.ok) throw new Error(pub.error);

  const sec = parseCulqiSecretKey(secretKey);
  if (!sec.ok) throw new Error(sec.error);

  if (pub.env !== sec.env) {
    throw new Error(
      `Las llaves Culqi deben ser del mismo entorno (${pub.env} vs ${sec.env}). Usa pk_${pub.env}_ con sk_${pub.env}_.`,
    );
  }

  return { publicKey: pub.value, secretKey: sec.value, env: pub.env };
}
