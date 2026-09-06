import { describe, it, expect } from "vitest";
import { SQL, Name, Param, Column, Table } from "drizzle-orm";
import { buildPublicEventConditions } from "./event-filters";
import { eventFilterSchema, baseEventSchema } from "@/lib/validations";

const TABLE_NAME_SYMBOL = (Table as unknown as { Symbol: Record<string, symbol> }).Symbol.Name;

// Renderiza los chunks de una expresión SQL de Drizzle a texto aproximado,
// suficiente para verificar qué columnas y valores intervienen en los filtros.
function renderChunk(chunk: unknown): string {
  if (chunk == null) return "";
  if (typeof chunk === "string") return chunk;
  if (Array.isArray(chunk)) return chunk.map(renderChunk).join("");

  const node = chunk as {
    queryChunks?: unknown[];
    table?: Record<PropertyKey, unknown>;
    name?: string;
    value?: unknown;
  };

  if (node === chunk && chunk instanceof SQL && node.queryChunks) {
    return node.queryChunks.map(renderChunk).join("");
  }
  if (chunk instanceof Column) {
    const tableName = node.table?.[TABLE_NAME_SYMBOL] as unknown as string | undefined ?? "?";
    return `"${tableName}"."${node.name}"`;
  }
  if (chunk instanceof Name) {
    return `"${node.value}"`;
  }
  if (chunk instanceof Param) {
    if (Array.isArray(node.value)) return node.value.map((v) => String(v)).join(", ");
    return String(node.value);
  }
  if (Array.isArray(node.value)) return node.value.map(renderChunk).join("");
  return "";
}

function renderConditions(filter: Parameters<typeof buildPublicEventConditions>[0], typeIds?: string[]) {
  return buildPublicEventConditions(filter, typeIds).map((condition) =>
    renderChunk((condition as SQL).queryChunks),
  );
}

const UUID_A = "11111111-1111-4111-8111-111111111111";
const UUID_B = "22222222-2222-4222-8222-222222222222";

describe("buildPublicEventConditions", () => {
  it("siempre fuerza eventos publicados", () => {
    const text = renderConditions(eventFilterSchema.parse({}));
    expect(text).toHaveLength(1);
    expect(text[0]).toContain('"events"."status"');
    expect(text[0]).toContain("published");
  });

  it("filtra por categoría usando el slug canónico y los legados", () => {
    const text = renderConditions(eventFilterSchema.parse({ category: "worship" }));
    expect(text.find((t) => t.includes('"category"'))).toContain("religion");
    expect(text.find((t) => t.includes('"category"'))).toContain("worship");
  });

  it("filtra por tipo mediante eventTypeId, no por texto en título/descripción", () => {
    const text = renderConditions(eventFilterSchema.parse({ type: "Hackathon" }), [UUID_A, UUID_B]);

    const typeCondition = text.find((t) => t.includes('"event_type_id"'));
    expect(typeCondition).toBeDefined();
    expect(typeCondition).toContain(UUID_A);
    expect(typeCondition).toContain(UUID_B);

    const joined = text.join(" ");
    expect(joined.toLowerCase()).not.toContain("ilike");
    expect(joined).not.toContain("%hackathon%");
    expect(joined).not.toContain("title");
  });

  it("devuelve condición inalcanzable cuando el tipo no resuelve a ningún ID", () => {
    const text = renderConditions(eventFilterSchema.parse({ type: "slug_inexistente" }), []);
    expect(text.find((t) => t.trim() === "1 = 0" || t.includes("1 = 0"))).toBeDefined();
    expect(text.some((t) => t.includes('"event_type_id"'))).toBe(false);
  });

  it("trata 'all' como ausencia de filtro de tipo", () => {
    const text = renderConditions(eventFilterSchema.parse({ type: "all" }), [UUID_A]);
    expect(text).toHaveLength(1);
    expect(text.some((t) => t.includes('"event_type_id"'))).toBe(false);
    expect(text.some((t) => t.includes("1 = 0"))).toBe(false);
  });
});

describe("eventFilterSchema / baseEventSchema con eventTypeId", () => {
  it("acepta type como UUID o slug en el filtro público", () => {
    expect(eventFilterSchema.safeParse({ type: UUID_A }).success).toBe(true);
    expect(eventFilterSchema.safeParse({ type: "concierto" }).success).toBe(true);
  });

  it("exige UUID válido para eventTypeId en el formulario", () => {
    const future = new Date(Date.now() + 7 * 86_400_000).toISOString();
    const base = {
      title: "Evento con tipo taxonómico",
      description: "Una descripción de prueba suficientemente larga para el evento.",
      category: "music",
      date: future,
    };

    expect(baseEventSchema.safeParse({ ...base, eventTypeId: UUID_A }).success).toBe(true);
    expect(baseEventSchema.safeParse({ ...base, eventTypeId: "no-es-un-uuid" }).success).toBe(false);
    // Sin tipo es opcional
    expect(baseEventSchema.safeParse(base).success).toBe(true);
  });
});