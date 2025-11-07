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
  GEMINI_EMBED_MODEL
} = process.env;

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
    GEMINI_EMBED_MODEL ?? "text-embedding-004"
}
