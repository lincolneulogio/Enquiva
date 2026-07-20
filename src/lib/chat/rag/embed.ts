import { normalizeQuery } from "../platform-knowledge";

const DIMS = 256;

/**
 * Embedding local determinista (hashing trick / feature hashing).
 * Suficiente para un corpus cerrado de Enquiva sin depender de API externa.
 * Evolución natural: reemplazar por text-embedding de Gemini/OpenAI + pgvector.
 */
export function embedText(text: string): Float32Array {
  const vec = new Float32Array(DIMS);
  const tokens = tokenize(text);
  if (tokens.length === 0) return vec;

  for (const token of tokens) {
    const h = hashToken(token);
    const idx = Math.abs(h) % DIMS;
    const sign = h < 0 ? -1 : 1;
    vec[idx]! += sign;
    // bigrams ligeros
    const h2 = hashToken(`#${token.length}:${token.slice(0, 3)}`);
    const idx2 = Math.abs(h2) % DIMS;
    vec[idx2]! += (h2 < 0 ? -1 : 1) * 0.5;
  }

  return l2normalize(vec);
}

export function cosineSimilarity(a: Float32Array | number[], b: Float32Array | number[]): number {
  const n = Math.min(a.length, b.length);
  let dot = 0;
  for (let i = 0; i < n; i += 1) dot += (a[i] ?? 0) * (b[i] ?? 0);
  return dot;
}

export function tokenize(text: string): string[] {
  return normalizeQuery(text)
    .split(" ")
    .map((t) => t.trim())
    .filter((t) => t.length > 2 && !STOP.has(t));
}

const STOP = new Set([
  "para",
  "como",
  "qué",
  "que",
  "una",
  "unos",
  "unas",
  "del",
  "los",
  "las",
  "por",
  "con",
  "sin",
  "sobre",
  "este",
  "esta",
  "estos",
  "estas",
  "hay",
  "tiene",
  "tienen",
  "hola",
  "necesito",
  "quiero",
  "puedes",
  "puede",
  "donde",
  "dónde",
]);

function hashToken(token: string): number {
  let h = 2166136261;
  for (let i = 0; i < token.length; i += 1) {
    h ^= token.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h | 0;
}

function l2normalize(vec: Float32Array): Float32Array {
  let sum = 0;
  for (let i = 0; i < vec.length; i += 1) sum += vec[i]! * vec[i]!;
  const norm = Math.sqrt(sum) || 1;
  for (let i = 0; i < vec.length; i += 1) vec[i]! /= norm;
  return vec;
}
