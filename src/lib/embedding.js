import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateEmbedding(text) {
  const model = genAI.getGenerativeModel({
    model: "gemini-embedding-001",
  });

  const result = await model.embedContent({
    content: {
      parts: [{ text: text.substring(0, 8000) }],
    },
  });

  console.log("generating embedding for text ")

  return result.embedding.values;
}

