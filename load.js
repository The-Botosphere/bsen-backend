import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import "dotenv/config";
import fetch from "node-fetch";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function loadVideos() {
  console.log("📥 Loading Google Sheet via JSON API…");

  // 1. Fetch JSON from Google Sheets
  const url = process.env.GOOGLE_SHEET_CSV;
  const response = await fetch(url);
  const text = await response.text();

  // 2. Extract valid JSON from Google's wrapper
  const jsonText = text
    .replace(/^[^(]+\(/, "")   // Remove "google.visualization.Query.setResponse("
    .replace(/\);?$/, "");     // Remove ");" at the end

  const json = JSON.parse(jsonText);

  // 3. Convert Google JSON to rows
  const rows = json.table.rows.map((r) => {
    const c = r.c || [];

    return {
      video_id: c[0]?.v || "",
      title: c[1]?.v || "",
      description: c[2]?.v || "",
      channel_title: c[3]?.v || "",
      published_at: c[4]?.v || "",
      url: `https://www.youtube.com/watch?v=${c[0]?.v}`
    };
  });

  console.log(`📊 Parsed ${rows.length} rows from sheet.`);

  let count = 0;

  for (const row of rows) {
    if (!row.video_id) continue;

    // 4. Create embedding
    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: `${row.title} ${row.description}`
    });

    const vector = embedding.data[0].embedding;

    // 5. UPSERT into Supabase
    await supabase.from("videos").upsert({
      video_id: row.video_id,
      title: row.title,
      description: row.description,
      channel_title: row.channel_title,
      published_at: row.published_at,
      url: row.url,
      vector
    });

    count++;
    if (count % 50 === 0) {
      console.log(`Loaded ${count} videos…`);
    }
  }

  console.log(`✅ Finished loading ${count} videos.`);
  return { loaded: count };
}
