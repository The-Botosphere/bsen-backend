import OpenAI from "openai";
import "dotenv/config";

let client;

try {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY');
  }
  client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  console.log('✅ OpenAI client created successfully');
} catch (error) {
  console.error('❌ OpenAI client creation failed:', error.message);
  client = null;
}

export async function embedText(text) {
  if (!client) {
    throw new Error('OpenAI client not initialized');
  }
  if (!text || text.trim() === "") text = "empty";
  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text
  });
  return response.data[0].embedding;
}
