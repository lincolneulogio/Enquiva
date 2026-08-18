import { describe, expect, it } from "vitest";
import { stripMarkdownArtifacts } from "@/lib/chat/plain-text";

describe("stripMarkdownArtifacts", () => {
  it("quita negritas con asteriscos", () => {
    expect(stripMarkdownArtifacts("Hay **12 eventos** activos.")).toBe(
      "Hay 12 eventos activos.",
    );
  });

  it("quita asteriscos sueltos de markdown", () => {
    expect(stripMarkdownArtifacts("Total: **3**")).toBe("Total: 3");
    expect(stripMarkdownArtifacts("queda **sin cerrar")).toBe("queda sin cerrar");
  });

  it("quita títulos markdown", () => {
    expect(stripMarkdownArtifacts("## Resumen\nTodo bien")).toBe("Resumen\nTodo bien");
  });
});
