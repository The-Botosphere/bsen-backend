import fetch from "node-fetch";
import { parse } from "csv-parse/sync";
import { supabase } from "./supabase.js";
import { embedText } from "./embeddings.js";
import { detectSport, cleanText } from "./utils.js";
import "dotenv/config";

async function loadVideos() {
  console.log("📥 Fetching CSV from Google Sheets...");

  const csvUrl = process.env.GOOGLE_SHEET_CSV;
  const response = await fetch(csvUrl);
  const csv = await response.text();

  const rows = parse(csv, { columns: true });

  console.log(`📊 Loaded ${rows.length} rows from Google Sheet.`);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    const title = cleanText(row.title || row.Title || "");
    const url = row.url || row.URL || "";
    const channel = row.channel || row.Channel || "";
    const published_at = row.published_at || row.Published || null;

    const sport = detectSport(title);

    const summary = `Video about ${sport} at OU: ${title}`;

    const vector = await embedText(`${title}. ${summary}`);

    const { error } = await supabase
      .from("videos")
      .insert({
        title,
        url,
        channel,
        published_at,
        sport,
        summary,
        vector
      });

    if (error) {
      console.log(`❌ Error row ${i + 1}:`, error.message);
    } else {
      console.log(`✅ Inserted row ${i + 1}/${rows.length}`);
    }
  }

  console.log("🎉 Finished loading videos.");
}

loadVideos();
