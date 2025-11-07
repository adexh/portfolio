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

  const streamResult = await model.generateContentStream({
    contents,
    generationConfig: {
      temperature: 0.4,
      topP: 0.95,
      topK: 32,
    },
  });

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
        const message =
          error instanceof Error ? error.message : "Gemini stream failed.";
        controller.enqueue(
          encoder.encode(JSON.stringify({ type: "error", message }) + "\n")
        );
      } finally {
        controller.close();
      }
    },
  });
};
