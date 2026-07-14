export type RagChunk = {
  id: string;
  /** Título corto para citar */
  title: string;
  /** Texto que se inyecta al LLM */
  text: string;
  moduleId?: number;
  moduleName?: string;
  tags: string[];
  /** Tipo de contenido */
  kind: "overview" | "module" | "faq" | "route" | "policy" | "howto";
};

export type RagHit = {
  chunk: RagChunk;
  score: number;
  lexicalScore: number;
  vectorScore: number;
};

export type RagRetrievalResult = {
  query: string;
  hits: RagHit[];
  contextBlock: string;
  citations: string[];
};
