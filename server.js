import express from "express";
import { searchVideos } from "./search.js";
import { loadVideos } from "./load.js";  
import "dotenv/config";

const app = express();
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

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`🚀 BSEN backend running on ${port}`));
