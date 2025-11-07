const missingEnv = (name: string) => {
  try {
    throw new Error(`${name} is not set in the environment.`);
  } catch (error) {
    console.warn(error instanceof Error ? error.message : `${name} missing`);
  }
};

const {
  GEMINI_API_KEY,
  GEMINI_CHAT_MODEL,
  GEMINI_EMBED_MODEL,
  CHAT_ALLOWED_ORIGINS,
  NEXT_PUBLIC_SITE_URL,
  CHAT_SHORT_WINDOW_MS,
  CHAT_SHORT_WINDOW_LIMIT,
  CHAT_LONG_WINDOW_MS,
  CHAT_LONG_WINDOW_LIMIT,
  CHAT_MAX_PROMPT_LENGTH,
  CHAT_MAX_HISTORY_LENGTH,
} = process.env;

const toPositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseOrigins = () => {
  const source = CHAT_ALLOWED_ORIGINS ?? NEXT_PUBLIC_SITE_URL ?? "";
  return source
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

export const constants = {
  GEMINI_API_KEY: (() => {
    const value = GEMINI_API_KEY;
    if (!value) {
      missingEnv("GEMINI_API_KEY");
    }
    return value ?? "";
  })(),
  GEMINI_CHAT_MODEL:
    GEMINI_CHAT_MODEL ?? "gemini-1.5-flash",
  GEMINI_EMBED_MODEL:
    GEMINI_EMBED_MODEL ?? "text-embedding-004",
  CHAT_ALLOWED_ORIGINS: parseOrigins(),
  CHAT_SHORT_WINDOW_MS: toPositiveInt(CHAT_SHORT_WINDOW_MS, 45_000),
  CHAT_SHORT_WINDOW_LIMIT: toPositiveInt(CHAT_SHORT_WINDOW_LIMIT, 3),
  CHAT_LONG_WINDOW_MS: toPositiveInt(CHAT_LONG_WINDOW_MS, 3_600_000),
  CHAT_LONG_WINDOW_LIMIT: toPositiveInt(CHAT_LONG_WINDOW_LIMIT, 25),
  CHAT_MAX_PROMPT_LENGTH: toPositiveInt(CHAT_MAX_PROMPT_LENGTH, 800),
  CHAT_MAX_HISTORY_LENGTH: toPositiveInt(CHAT_MAX_HISTORY_LENGTH, 6),
};
