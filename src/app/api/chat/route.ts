import { NextRequest } from "next/server";
import {
  streamDevbotResponse,
  type ChatMessage,
  isGeminiRateLimitError,
} from "@/server/ai/gemini";
import { constants } from "@/utils/constants";
import { createCompositeRateLimiter } from "@/server/security/rateLimiter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CLIENT_FINGERPRINT_HEADER = "x-devbot-client";
const REQUEST_ID_HEADER = "x-devbot-request";
const CLIENT_FINGERPRINT_REGEX = /^[a-f0-9]{32,64}$/i;

type RateLimiterGlobal = {
  devbotRateLimiter?: ReturnType<typeof createCompositeRateLimiter>;
};

const getGlobalRateLimiter = () => {
  const globalScope = globalThis as typeof globalThis & RateLimiterGlobal;
  if (!globalScope.devbotRateLimiter) {
    globalScope.devbotRateLimiter = createCompositeRateLimiter({
      shortWindowLimit: constants.CHAT_SHORT_WINDOW_LIMIT,
      shortWindowMs: constants.CHAT_SHORT_WINDOW_MS,
      longWindowLimit: constants.CHAT_LONG_WINDOW_LIMIT,
      longWindowMs: constants.CHAT_LONG_WINDOW_MS,
    });
  }
  return globalScope.devbotRateLimiter;
};

const limiter = getGlobalRateLimiter();

const normalizeOrigin = (value: string | null) => {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const isAllowedFrontendRequest = (request: NextRequest) => {
  if (!constants.CHAT_ALLOWED_ORIGINS.length) {
    return true;
  }

  const origin = normalizeOrigin(request.headers.get("origin"));
  const referer = normalizeOrigin(request.headers.get("referer"));
  const host = request.headers.get("host")?.toLowerCase();

  if (origin && constants.CHAT_ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }

  if (referer && constants.CHAT_ALLOWED_ORIGINS.includes(referer)) {
    return true;
  }

  if (host) {
    const hostAllowed = constants.CHAT_ALLOWED_ORIGINS.some((allowed) => {
      try {
        return new URL(allowed).host.toLowerCase() === host;
      } catch {
        return false;
      }
    });
    if (hostAllowed) {
      return true;
    }
  }

  return false;
};

const extractClientIp = (request: NextRequest) => {
  const headerValue =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "";
  const headerIp = headerValue.split(",")[0]?.trim();
  return request.ip ?? headerIp ?? "unknown";
};

const sanitizeHistory = (history: ChatMessage[] = []) => {
  const capped = history
    .filter(
      (entry) =>
        entry &&
        (entry.id === "me" || entry.id === "ai") &&
        typeof entry.value === "string"
    )
    .slice(-constants.CHAT_MAX_HISTORY_LENGTH);

  return capped.map((entry) => ({
    id: entry.id,
    value: entry.value.slice(0, constants.CHAT_MAX_PROMPT_LENGTH).trim(),
  }));
};

const buildErrorResponse = (
  message: string,
  status: number,
  headers: Record<string, string> = {}
) =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

export async function POST(request: NextRequest) {
  let payload: { prompt?: string; history?: ChatMessage[] } = {};

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return buildErrorResponse("Only JSON payloads are accepted.", 415);
  }

  if (!isAllowedFrontendRequest(request)) {
    return buildErrorResponse("Forbidden origin.", 403);
  }

  const clientFingerprint =
    request.headers.get(CLIENT_FINGERPRINT_HEADER)?.trim() ?? "";
  const requestIdHeader = request.headers.get(REQUEST_ID_HEADER)?.trim() ?? "";

  if (
    !CLIENT_FINGERPRINT_REGEX.test(clientFingerprint) ||
    !CLIENT_FINGERPRINT_REGEX.test(requestIdHeader)
  ) {
    return buildErrorResponse("Missing required client fingerprint.", 403);
  }

  const secFetchSite = request.headers.get("sec-fetch-site");
  if (
    secFetchSite &&
    !["same-origin", "same-site", "none"].includes(secFetchSite.toLowerCase())
  ) {
    return buildErrorResponse("Cross-site requests are not allowed.", 403);
  }

  try {
    payload = await request.json();
  } catch {
    return buildErrorResponse("Invalid JSON payload received.", 400);
  }

  const prompt = payload.prompt?.replace(/\s+/g, " ").trim();

  if (!prompt) {
    return buildErrorResponse("Prompt is required.", 400);
  }

  if (prompt.length > constants.CHAT_MAX_PROMPT_LENGTH) {
    return buildErrorResponse(
      `Prompt exceeds ${constants.CHAT_MAX_PROMPT_LENGTH} characters.`,
      413
    );
  }

  const history = sanitizeHistory(payload.history ?? []);

  const clientIp = extractClientIp(request);
  const limiterKey = `${clientIp}:${clientFingerprint}`;
  const verdict = limiter(limiterKey);

  if (!verdict.success) {
    return buildErrorResponse("Too many requests to Devbot.", 429, {
      "Retry-After": String(verdict.retryAfterSeconds),
    });
  }

  try {
    const stream = await streamDevbotResponse({
      prompt,
      history,
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-RateLimit-Remaining-Short": String(verdict.remainingShort),
        "X-RateLimit-Remaining-Long": String(verdict.remainingLong),
      },
    });
  } catch (error) {
    console.error("Gemini API request failed", error);
    if (isGeminiRateLimitError(error)) {
      return buildErrorResponse(
        "Too many requests right now. Please try again shortly.",
        429
      );
    }

    const missingApiKey =
      error instanceof Error && error.message.includes("GEMINI_API_KEY");
    const message = missingApiKey
      ? "Devbot is not configured correctly. Please reach out to the site owner."
      : "Devbot is temporarily unavailable. Please try again shortly.";
    const status = missingApiKey ? 500 : 502;

    return buildErrorResponse(message, status);
  }
}
