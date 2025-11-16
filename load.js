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

  // 2. Extract valid JSON from Google's wrapper
  const jsonText = text
    .replace(/^[^(]+\(/, "")   // remove "google.visualization.Query.setResponse("
    .replace(/\);?$/, "");     // remove ");" at the end

  const json = JSON.parse(jsonText);

  // 3. Convert Google JSON rows to objects using your column mapping
  const rows = json.table.rows.map((r) => {
    const c = r.c || [];

    const title = c[0]?.v || "";
    const url = c[1]?.v || "";
    const channel_title = c[2]?.v || "";
    const published_at = c[3]?.v || "";
    const description = c[4]?.v || "";

    // Extract video_id from URL if present
    let video_id = "";
    if (url && url.includes("v=")) {
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

  // 4. Loop through rows and UPSERT valid videos
  for (const row of rows) {

    // 4A. Filter out copyright rows, incomplete rows, footer rows, garbage
    if (
      !row.url ||
      !row.video_id ||
      row.video_id.length !== 11 ||          // invalid video_id (YouTube = 11 chars)
      !row.title ||
      row.title.trim() === "" ||
      row.title.toLowerCase().includes("copyright") || 
      row.url.toLowerCase().includes("copyright")
    ) {
      continue;
    }

    // 4B. Create embedding from title + description
    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: `${row.title} ${row.description}`
    });

    const vector = embedding.data[0].embedding;

    // 4C. Write to Supabase using UPSERT
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

  console.log(`✅ Finished loading ${count} valid videos.`);
  return { loaded: count };
}
