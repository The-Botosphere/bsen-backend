import { supabase } from "./supabase.js";
import { embedText } from "./embeddings.js";

export async function searchVideos(query) {
  // Get correct vector array
  const embeddingResult = await embedText(query);
  const query_embedding = embeddingResult.data[0].embedding;

  // Call match_videos correctly
  const { data, error } = await supabase.rpc("match_videos", {
    query_embedding,
    match_threshold: 0.75,
    match_count: 10
  });

  if (error) {
    console.error("Supabase RPC error:", error);
    throw error;
  }

  return data;
}
