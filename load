import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import fetch from "node-fetch";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function loadVideos() {
  console.log("📥 Starting video loader...");

  const csvUrl = process.env.GOOGLE_SHEET_CSV;
  const res = await fetch(csvUrl);
  const csv = await res.text();

  const rows = csv.split("\n").slice(1); // skip header
  console.log(`Found ${rows.length} rows in CSV.`);

  let count = 0;

  for (const row of rows) {
    const cols = row.split(",");

    const video_id = cols[0];
    const title = cols[1];
    const description = cols[2];
    const channel_title = cols[3];
    const published_at = cols[4];
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
