import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateEventDescription } from "@/lib/ai";
import { generateDescriptionSchema } from "@/lib/validations";
import { headers } from "next/headers";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (
    session.user.role !== "organizer" &&
    session.user.role !== "super_admin"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validated = generateDescriptionSchema.parse(body);
    return await generateEventDescription(validated);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid input", issues: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === "AI_EMPTY_TEXT") {
      return NextResponse.json(
        { error: "AI returned empty text. Please try again with more context." },
        { status: 502 }
      );
    }

    if (error instanceof Error && error.message === "AI_QUOTA_EXCEEDED") {
      return NextResponse.json(
        { error: "AI quota exceeded. Please retry later or upgrade your plan." },
        { status: 429 }
      );
    }

    if (error instanceof Error && error.message === "AI_PROVIDER_CONFIG_ERROR") {
      return NextResponse.json(
        { error: "AI provider configuration error." },
        { status: 502 }
      );
    }

    if (error instanceof Error && error.message === "AI_PROVIDER_TEMPORARILY_UNAVAILABLE") {
      return NextResponse.json(
        { error: "AI provider is temporarily unavailable. Please retry in a moment." },
        { status: 503 }
      );
    }

    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      if (
        message.includes("quota") ||
        message.includes("rate limit") ||
        message.includes("too many requests") ||
        message.includes("resource exhausted")
      ) {
        return NextResponse.json(
          { error: "AI quota exceeded. Please retry later or upgrade your plan." },
          { status: 429 }
        );
      }

      if (
        message.includes("api key") ||
        message.includes("credential") ||
        message.includes("unauthorized") ||
        message.includes("forbidden")
      ) {
        return NextResponse.json(
          { error: "AI provider configuration error." },
          { status: 502 }
        );
      }

      if (
        message.includes("provider returned error") ||
        message.includes("temporarily rate-limited") ||
        message.includes("no endpoints available") ||
        message.includes("guardrail restrictions") ||
        message.includes("data policy")
      ) {
        return NextResponse.json(
          { error: "AI provider is temporarily unavailable. Please retry in a moment." },
          { status: 503 }
        );
      }
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
