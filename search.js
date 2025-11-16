import { supabase } from "./supabase.js";
import { embedText } from "./embeddings.js";

export async function searchVideos(query) {
  const embedding = await embedText(query);

  const { data, error } = await supabase.rpc("match_videos", {
    query_embedding: embedding,
    match_threshold: 0.75,
    match_count: 10
  });

  if (error) throw error;

  return data;
}
