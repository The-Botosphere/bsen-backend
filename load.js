import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import "dotenv/config";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function loadVideos() {
  console.log("📥 Loading Google Sheet via JSON API…");
  
  // 1. Fetch JSON from Google Sheets
  const response = await fetch(process.env.GOOGLE_SHEET_CSV);
  const text = await response.text();
  
  // 2. Extract valid JSON
  const jsonText = text
    .replace(/^[^(]+\(/, "")
    .replace(/\);?$/, "");
  const json = JSON.parse(jsonText);
  
  // 3. Map rows
  const rows = json.table.rows.map((r) => {
    const c = r.c || [];
    const title = c[0]?.v || "";
    const url = c[1]?.v || "";
    const channel_title = c[2]?.v || "";
    const published_at = c[3]?.v || "";
    const description = c[4]?.v || "";
    
    let video_id = "";
    if (url && url.includes("v=")) {
      video_id = url.split("v=")[1].split("&")[0];
    }
    
    return { video_id, title, description, channel_title, published_at, url };
  });
  
  console.log(`📊 Parsed ${rows.length} total rows.`);
  
  const BATCH_SIZE = 25;
  let count = 0;
  let errors = 0;
  
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    console.log(`⏳ Processing batch ${i / BATCH_SIZE + 1} (${batch.length} videos)…`);
    
    for (const row of batch) {
      if (
        !row.url ||
        !row.video_id ||
        row.video_id.length !== 11 ||
        !row.title ||
        row.title.trim() === "" ||
        row.title.toLowerCase().includes("copyright")
      ) {
        continue;
      }
      
      try {
        const embedding = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: `${row.title} ${row.description}`
        });
        
        const vector = embedding.data[0].embedding;
        
        const { error } = await supabase.from("videos").upsert({
          video_id: row.video_id,
          title: row.title,
          description: row.description,
          channel_title: row.channel_title,
          published_at: row.published_at,
          url: row.url,
          vector
        });
        
        if (error) {
          console.error(`❌ Error inserting video ${row.video_id}:`, error.message);
          errors++;
        } else {
          count++;
        }
      } catch (err) {
        console.error(`❌ Exception processing video ${row.video_id}:`, err.message);
        errors++;
      }
    }
    
    console.log("😴 Sleeping 3 seconds to avoid Railway timeout…");
    await sleep(3000);
  }
  
  console.log(`✅ Finished loading ${count} valid videos (${errors} errors).`);
  return { loaded: count, errors };
}
