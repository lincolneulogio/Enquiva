import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

async function testOpenRouter() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const modelName = process.env.OPENROUTER_MODEL || "openrouter/auto";
  
  console.log("\n=== probando OpenRouter ===");
  console.log(`Modelo configurado: ${modelName}`);
  console.log(`API Key presente: ${apiKey ? "Sí (empieza con " + apiKey.substring(0, 8) + "...)" : "No"}`);
  
  if (!apiKey) {
    console.log("❌ Saltando OpenRouter: Falta la API Key.");
    return;
  }

  try {
    const openrouter = createOpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: apiKey,
    });

    console.log("Enviando petición de prueba a OpenRouter...");
    const { text } = await generateText({
      model: openrouter.chat(modelName),
      prompt: "Responde únicamente con la palabra 'OK'.",
      maxRetries: 0,
      maxTokens: 1000,
    });
    console.log(`✅ OpenRouter responde: "${text.trim()}"`);
  } catch (err: any) {
    console.error("❌ Error en OpenRouter:");
    console.error(err?.message || err);
    if (err?.stack) {
      console.error(err.stack.split("\n").slice(0, 3).join("\n"));
    }
  }
}

async function main() {
  console.log("Iniciando pruebas de conectividad de Inteligencia Artificial...");
  await testOpenRouter();
}

main().catch(console.error);
