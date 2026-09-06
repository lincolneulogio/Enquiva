import { requireApiSession, apiAuthErrorResponse } from "@/lib/auth/api-guards";
import { generateTextWithFallback } from "@/app/api/chat/providers";
import { NextResponse } from "next/server";

export const maxDuration = 30;

function cleanPlainText(text: string): string {
  return text
    // Eliminar formato markdown de negritas y cursivas (**texto**, *texto*, __texto__)
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    // Eliminar asteriscos sueltos
    .replace(/\*+/g, "")
    // Eliminar encabezados markdown tipo # o ##
    .replace(/^#{1,6}\s+/gm, "")
    // Eliminar emojis y pictogramas
    .replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, "")
    // Limpiar espacios repetidos dejados por los emojis
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function POST(req: Request) {
  try {
    await requireApiSession();

    const body = (await req.json()) as { description?: string; locale?: string };
    const rawDescription = typeof body?.description === "string" ? body.description.trim() : "";
    const locale = body?.locale === "en" ? "en" : "es";

    const systemPrompt =
      locale === "en"
        ? "You are an expert copywriter and event marketing specialist. " +
          "Your goal is to transform the event description into engaging, persuasive, clear, and well-structured text in clean paragraphs. " +
          "Highlight key attractions and maintain a professional and motivating tone. " +
          "Preserve real event details if present (schedules, artists, etc.). " +
          "MANDATORY RULES: " +
          "1. Output language MUST be English. Do NOT mix languages. " +
          "2. DO NOT use emojis under any circumstance. Zero emojis. " +
          "3. DO NOT use Markdown formatting like bold asterisks (**text** or *text*) or headers (#). Output must be pure clean plain text. " +
          "4. Return ONLY the final description text, without preambles, greetings, comments or quotation marks."
        : "Eres un redactor experto y especialista en marketing de eventos. " +
          "Tu objetivo es transformar la descripción del evento en un texto atractivo, persuasivo, claro y bien estructurado en párrafos limpios. " +
          "Destaca los atractivos principales y mantén un tono profesional, serio y motivador. " +
          "Conserva los datos reales si los hay (horarios, artistas, detalles del evento). " +
          "REGLAS OBLIGATORIAS: " +
          "1. El idioma de salida DEBE ser estrictamente español. No mezcles idiomas. " +
          "2. NO uses emojis bajo ninguna circunstancia. Cero emojis. " +
          "3. NO uses formato Markdown como negritas con asteriscos (**texto** o *texto*), ni almohadillas (#). Debe ser texto plano puro. " +
          "4. Devuelve ÚNICAMENTE el texto final de la descripción, sin introducciones, saludos, comentarios ni comillas.";

    const userPrompt =
      locale === "en"
        ? rawDescription
          ? `Improve and optimize this event description in English in pure plain text without emojis or asterisks:\n\n${rawDescription}`
          : "Generate an attractive, professional, and engaging base description for a new event in English in pure plain text without emojis or asterisks."
        : rawDescription
          ? `Mejora y optimiza esta descripción de evento en español en texto plano puro sin emojis ni asteriscos:\n\n${rawDescription}`
          : "Genera una descripción base atractiva, profesional y formal para un nuevo evento en español en texto plano puro sin emojis ni asteriscos.";

    const generated = await generateTextWithFallback({
      prompt: userPrompt,
      system: systemPrompt,
      maxOutputTokens: 1000,
    });

    const improved = cleanPlainText(generated);

    return NextResponse.json({ improved });
  } catch (error: any) {
    if (error?.status === 401 || error?.statusCode === 401) {
      return apiAuthErrorResponse(error);
    }
    console.error("[improve-description] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Error al procesar la mejora de descripción." },
      { status: 500 },
    );
  }
}
