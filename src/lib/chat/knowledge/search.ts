import { PlatformModule } from "./types";

export function normalizeQuery(q: string): string {
  return q
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[¿?¡!.,;:()[\]{}«»"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function scoreModules(
  query: string,
  modules: PlatformModule[]
): Array<{ module: PlatformModule; score: number }> {
  const q = normalizeQuery(query);
  const tokens = q.split(" ").filter((t) => t.length > 2);

  return modules
    .map((module) => {
      let score = 0;
      const haystack = normalizeQuery(
        [module.name, module.summary, module.details ?? "", ...module.synonyms, ...module.faqs].join(
          " "
        )
      );

      for (const syn of module.synonyms) {
        const s = normalizeQuery(syn);
        if (q.includes(s) || s.includes(q)) score += 8;
        if (tokens.some((t) => s.includes(t) || t.includes(s))) score += 3;
      }

      if (haystack.includes(q)) score += 6;
      for (const t of tokens) {
        if (haystack.includes(t)) score += 2;
      }

      // Menciona el nombre del módulo
      if (q.includes(normalizeQuery(module.name))) score += 12;

      return { module, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}
