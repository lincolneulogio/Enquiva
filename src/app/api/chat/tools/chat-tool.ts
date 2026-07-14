import { tool } from "ai";
import { z, type ZodTypeAny } from "zod";

type RawChatTool = {
  description: string;
  /** AI SDK v6 */
  inputSchema?: ZodTypeAny;
  /** Legacy shape todavía usado en algunos archivos */
  parameters?: ZodTypeAny;
  execute: (input: never, options?: never) => PromiseLike<unknown> | unknown;
};

/**
 * Normaliza tools al shape de AI SDK v6 (`inputSchema` + `tool()`).
 * Sin esto el modelo puede “llamar” tools que no ejecutan bien y no devolver texto.
 */
export function normalizeChatTool(raw: RawChatTool | null | undefined) {
  if (!raw) return null;
  const inputSchema = raw.inputSchema ?? raw.parameters ?? z.object({});
  return tool({
    description: raw.description,
    inputSchema,
    execute: raw.execute as (input: unknown) => PromiseLike<unknown> | unknown,
  });
}
