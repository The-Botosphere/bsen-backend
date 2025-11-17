import { supabase } from "./supabase.js";
import { embedText } from "./embeddings.js";

export async function searchVideos(query) {
  const query_embedding = await embedText(query);

  const { data, error } = await supabase.rpc("match_videos", {
    query_embedding,
    match_threshold: 0.5,
    match_count: 10
  });

  if (error) {
    console.error("Supabase RPC Error:", error);
    throw error;
  }

  return data;
}
