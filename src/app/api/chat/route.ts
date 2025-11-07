import { NextRequest } from "next/server";
import { streamDevbotResponse, type ChatMessage } from "@/server/ai/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let payload: { prompt?: string; history?: ChatMessage[] } = {};

  try {
    payload = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON payload received." }),
      { status: 400 }
    );
  }

  const prompt = payload.prompt?.trim();

  if (!prompt) {
    return new Response(JSON.stringify({ error: "Prompt is required." }), {
      status: 400,
    });
  }

  try {
    const stream = await streamDevbotResponse({
      prompt,
      history: payload.history ?? [],
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Gemini API request failed", error);
    const message =
      error instanceof Error ? error.message : "Failed to reach Gemini API.";
    const status = message.includes("GEMINI_API_KEY") ? 500 : 502;

    return new Response(JSON.stringify({ error: message }), { status });
  }
}
