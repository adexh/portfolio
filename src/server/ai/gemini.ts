import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  DEV_BOT_SYSTEM_PROMPT,
  PERSONAL_CONTEXT,
  type ContextDocument,
} from "./context";
import {
  constants
} from "@/utils/constants";

const {
  GEMINI_API_KEY,
  GEMINI_CHAT_MODEL,
  GEMINI_EMBED_MODEL,
} = constants;

export type ChatMessage = {
  id: "me" | "ai";
  value: string;
};

const encoder = new TextEncoder();

const RATE_LIMIT_STATUS_CODE = 429;
const RATE_LIMIT_CODES = new Set(["RESOURCE_EXHAUSTED", "RATE_LIMIT_EXCEEDED"]);
const RATE_LIMIT_MESSAGE =
  "I'm handling too many requests right now. Please try again in a moment.";
const STREAM_FAILURE_MESSAGE =
  "I couldn't finish that response. Please try again.";

export class GeminiRateLimitError extends Error {
  readonly status = RATE_LIMIT_STATUS_CODE;

  constructor(message = RATE_LIMIT_MESSAGE) {
    super(message);
    this.name = "GeminiRateLimitError";
  }
}

const normalizeErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return "";
};

const getPossibleStatusCode = (error: unknown) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as { status?: unknown }).status === "number"
  ) {
    return (error as { status: number }).status;
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof (error as { statusCode?: unknown }).statusCode === "number"
  ) {
    return (error as { statusCode: number }).statusCode;
  }
  return null;
};

const getPossibleErrorCode = (error: unknown) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
  ) {
    return (error as { code: string }).code.toUpperCase();
  }
  return null;
};

export const isGeminiRateLimitError = (error: unknown) => {
  if (!error) {
    return false;
  }
  if (error instanceof GeminiRateLimitError) {
    return true;
  }

  const status = getPossibleStatusCode(error);
  if (status === RATE_LIMIT_STATUS_CODE) {
    return true;
  }

  const code = getPossibleErrorCode(error);
  if (code && RATE_LIMIT_CODES.has(code)) {
    return true;
  }

  const message = normalizeErrorMessage(error).toLowerCase();
  if (!message) {
    return false;
  }

  return (
    message.includes("too many requests") ||
    message.includes("rate limit") ||
    (message.includes("resource") && message.includes("exhaust")) ||
    message.includes("quota")
  );
};

let genAI: GoogleGenerativeAI | null = null;
let embeddingModel: ReturnType<GoogleGenerativeAI["getGenerativeModel"]> | null =
  null;
let cachedContextEmbeddings:
  | Array<ContextDocument & { embedding: number[] }>
  | null = null;

const getGeminiClient = () => {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Add it to your environment to enable Devbot."
    );
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
  return genAI;
};

const getEmbeddingModel = () => {
  if (!embeddingModel) {
    embeddingModel = getGeminiClient().getGenerativeModel({
      model: GEMINI_EMBED_MODEL,
    });
  }
  return embeddingModel;
};

const embedText = async (text: string) => {
  const result = await getEmbeddingModel().embedContent({
    content: { role: "user", parts: [{ text }] },
  });
  const values = result.embedding?.values;

  if (!values || values.length === 0) {
    throw new Error("Failed to compute embeddings for provided text.");
  }
  return values;
};

const cosineSimilarity = (a: number[], b: number[]) => {
  const dot = a.reduce((sum, value, index) => sum + value * b[index], 0);
  const normA = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0));
  const normB = Math.sqrt(b.reduce((sum, value) => sum + value * value, 0));
  const denom = normA * normB;
  return denom === 0 ? 0 : dot / denom;
};

const ensureContextEmbeddings = async () => {
  if (cachedContextEmbeddings) {
    return cachedContextEmbeddings;
  }

  const embeddings = await Promise.all(
    PERSONAL_CONTEXT.map(async (doc) => ({
      ...doc,
      embedding: await embedText(doc.content),
    }))
  );

  cachedContextEmbeddings = embeddings;
  return embeddings;
};

const getRelevantContext = async (query: string, topK = 3) => {
  try {
    const [contextEmbeddings, queryEmbedding] = await Promise.all([
      ensureContextEmbeddings(),
      embedText(query),
    ]);

    const ranked = contextEmbeddings
      .map((doc) => ({
        ...doc,
        score: cosineSimilarity(doc.embedding, queryEmbedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return ranked.map((doc) => `(${doc.id}) ${doc.content}`).join("\n\n");
  } catch (error) {
    console.error("Context retrieval failed, falling back to default context.", error);
    return PERSONAL_CONTEXT.map((doc) => doc.content).join("\n\n");
  }
};

const mapHistoryToContents = (history: ChatMessage[] = []) =>
  history
    .slice(-6)
    .map((message) => ({
      role: message.id === "me" ? "user" : "model",
      parts: [{ text: message.value }],
    }));

export const streamDevbotResponse = async ({
  prompt,
  history = [],
}: {
  prompt: string;
  history?: ChatMessage[];
}) => {
  const contextSnippet = await getRelevantContext(prompt);
  const model = getGeminiClient().getGenerativeModel({
    model: GEMINI_CHAT_MODEL,
    systemInstruction: {
      role: "user",
      parts: [{ text: DEV_BOT_SYSTEM_PROMPT }],
    },
  });

  const contents = [
    ...mapHistoryToContents(history),
    {
      role: "user",
      parts: [
        {
          text: `Use ONLY the context below when answering.
Context:
${contextSnippet}

Question:
${prompt}

If the question cannot be answered with the context, politely explain that Devbot only shares information about Adesh.`,
        },
      ],
    },
  ];

  let streamResult;
  try {
    streamResult = await model.generateContentStream({
      contents,
      generationConfig: {
        temperature: 0.4,
        topP: 0.95,
        topK: 32,
      },
    });
  } catch (error) {
    if (isGeminiRateLimitError(error)) {
      throw new GeminiRateLimitError();
    }
    throw error instanceof Error
      ? error
      : new Error("Gemini generateContentStream failed.");
  }

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of streamResult.stream) {
          const chunkText = chunk.text();
          if (!chunkText) continue;
          const payload = JSON.stringify({ type: "token", token: chunkText });
          controller.enqueue(encoder.encode(payload + "\n"));
        }
        controller.enqueue(encoder.encode(JSON.stringify({ type: "done" }) + "\n"));
      } catch (error) {
        console.error("Gemini stream error", error);
        const message = isGeminiRateLimitError(error)
          ? RATE_LIMIT_MESSAGE
          : STREAM_FAILURE_MESSAGE;
        controller.enqueue(
          encoder.encode(JSON.stringify({ type: "error", message }) + "\n")
        );
      } finally {
        controller.close();
      }
    },
  });
};
