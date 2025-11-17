import express from "express";
const app = express();

// === CRITICAL: Health check FIRST, before ANYTHING else ===
app.get("/health", (req, res) => {
  return res.status(200).send("OK");
});

// === NOW start the server IMMEDIATELY ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 BSEN backend running on ${PORT}`);
});

// === THEN do slow imports and register other routes ===
import { searchVideos } from "./search.js";
import { loadVideos } from "./load.js";
import "dotenv/config";

app.use(express.json());

app.get("/", (req, res) => {
  res.send("BSEN Backend is running");
});

app.get("/search", async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.status(400).send({ error: "Missing ?q=" });
    const results = await searchVideos(q);
    res.send(results);
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: e.message });
  }
});

app.get("/load", async (req, res) => {
  try {
    console.log("📥 /load endpoint triggered...");
    const result = await loadVideos();
    res.send({
      message: "Load complete",
      ...result
    });
  } catch (error) {
    console.error("❌ Load error:", error);
    res.status(500).send({ error: error.message });
  }
});

console.log("✅ All routes registered");
