import { isAiConfigured } from "@/app/api/chat/providers";
import { env } from "@/env";

async function main() {
  console.log("AI_PROVIDER:", env.AI_PROVIDER);
  console.log("Gemini:", env.GEMINI_API_KEY ? "configurado" : "no configurado");
  console.log("OpenRouter:", env.OPENROUTER_API_KEY ? "configurado" : "no configurado");
  console.log("Copilot listo:", isAiConfigured() ? "sí" : "no — agrega GEMINI_API_KEY cuando la tengas");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
