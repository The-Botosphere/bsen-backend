import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import fetch from "node-fetch";
import Papa from "papaparse";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function loadVideos() {
  console.log("📥 Starting video loader...");

  // Fetch CSV
  const csvUrl = process.env.GOOGLE_SHEET_CSV;
  const response = await fetch(csvUrl);
  const csvText = await response.text();

  // Parse CSV properly (handles quotes, commas, etc.)
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true
  });

  const rows = parsed.data;
  console.log(`Parsed ${rows.length} rows`);

  let count = 0;

  for (const row of rows) {
    const video_id = row.video_id;
    const title = row.title || "";
    const description = row.description || "";
    const channel_title = row.channel_title || "";
    const published_at = row.published_at || null;
    const url = `https://www.youtube.com/watch?v=${video_id}`;

    if (!video_id) continue;

    // Generate embedding
    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: `${title} ${description}`
    });

    const vector = embedding.data[0].embedding;

    // Insert into Supabase
    await supabase.from("videos").insert({
      video_id,
      title,
      description,
      channel_title,
      published_at,
      url,
      vector
    });

    count++;
    if (count % 50 === 0) console.log(`Loaded ${count} videos...`);
  }

  console.log(`✅ Finished loading ${count} videos.`);
  return { loaded: count };
}
