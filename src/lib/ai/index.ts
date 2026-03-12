import { google } from "@ai-sdk/google";
import { generateText, streamText } from "ai";
import type { GenerateDescriptionInput } from "@/lib/validations";

export const aiModel = google("gemini-2.0-flash");

// Generate event description from bullet points
export async function generateEventDescription(
  input: GenerateDescriptionInput
): Promise<Response> {
  const toneGuide = {
    formal: "professional and authoritative",
    casual: "warm and approachable",
    inspirational: "uplifting, spiritual, and community-focused",
  };

  const result = streamText({
    model: aiModel,
    system: `You are a talented writer for a faith-based community platform. 
    Write engaging event descriptions that resonate with community members.
    Keep descriptions between 150-300 words. Be ${toneGuide[input.tone]}.
    Do not use markdown. Write in plain paragraphs.`,
    prompt: `Write an event description for:
Title: ${input.title}
Category: ${input.category.replace("_", " ")}
Key points:
${input.bulletPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}`,
  });

  return result.toTextStreamResponse();
}

// Generate post-event summary from organizer notes
export async function generateEventSummary(
  eventTitle: string,
  organizerNotes: string
): Promise<string> {
  const { text } = await generateText({
    model: aiModel,
    system: `You are a community newsletter writer. Create warm, celebratory 
    post-event summaries from organizer notes. Keep it under 200 words.`,
    prompt: `Write a post-event summary for "${eventTitle}":
Organizer notes: ${organizerNotes}`,
  });

  return text;
}

// Get AI-powered event recommendations for a user
export async function getEventRecommendations(
  userHistory: Array<{ category: string; title: string }>,
  availableEvents: Array<{ id: string; title: string; category: string; description: string }>,
  limit: number = 5
): Promise<string[]> {
  if (availableEvents.length === 0) return [];

  const { text } = await generateText({
    model: aiModel,
    system: `You are an event recommendation engine for a faith community platform.
    Return ONLY a JSON array of event IDs, ordered by relevance. No explanation.`,
    prompt: `User's past events: ${JSON.stringify(userHistory.slice(0, 10))}
    
Available upcoming events: ${JSON.stringify(availableEvents)}

Return the top ${limit} event IDs as a JSON array: ["id1", "id2", ...]`,
  });

  try {
    const ids = JSON.parse(text.trim()) as string[];
    return ids.slice(0, limit);
  } catch {
    return availableEvents.slice(0, limit).map((e) => e.id);
  }
}
