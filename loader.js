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
  const response = await fetch(process.env.GOOGLE_SHEET_CSV);
  const text = await response.text();

  // 2. Extract JSON from Google's wrapper
  const jsonText = text
    .replace(/^[^(]+\(/, "")    // remove function name
    .replace(/\);?$/, "");      // remove ); at end

  const json = JSON.parse(jsonText);

  // 3. Map rows using YOUR sheet column order
  const rows = json.table.rows.map((r) => {
    const c = r.c || [];

    const title = c[0]?.v || "";
    const url = c[1]?.v || "";
    const channel_title = c[2]?.v || "";
    const published_at = c[3]?.v || "";
    const description = c[4]?.v || "";

    // Extract video_id from URL
    let video_id = "";
    if (url.includes("v=")) {
      video_id = url.split("v=")[1].split("&")[0];
    }

    return {
      video_id,
      title,
      description,
      channel_title,
      published_at,
      url
    };
  });

  console.log(`📊 Parsed ${rows.length} rows from sheet.`);

  let count = 0;
  for (const row of rows) {
    if (!row.video_id) continue;

    // 4. Generate embedding
    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: `${row.title} ${row.description}`
    });

    const vector = embedding.data[0].embedding;

    // 5. Store in Supabase via UPSERT
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

