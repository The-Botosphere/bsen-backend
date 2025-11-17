import express from "express";
import "dotenv/config";
const app = express();

// Health check FIRST
app.get("/health", (req, res) => {
  return res.status(200).send("OK");
});

// Start server IMMEDIATELY
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 BSEN backend running on ${PORT}`);
  
  // Load heavy stuff AFTER server starts
  loadRoutes();
});

// Load routes after server is running
async function loadRoutes() {
  try {
    const { searchVideos } = await import("./search.js");
    const { loadVideos } = await import("./load.js");
    
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
    
    app.get("/test-db", async (req, res) => {
      try {
        const { supabase } = await import("./supabase.js");
        
        // Get total count
        const { count, error: countError } = await supabase
          .from("videos")
          .select("*", { count: 'exact', head: true });
        
        if (countError) throw countError;
        
        // Get first 3 rows
        const { data, error } = await supabase
          .from("videos")
          .select("id, title, video_id, vector")
          .limit(3);
        
        if (error) throw error;
        
        res.json({
          total_in_db: count,
          returned: data.length,
          sample: data.map(v => ({
            id: v.id,
            title: v.title,
            video_id: v.video_id,
            has_vector: v.vector ? v.vector.length > 0 : false
          }))
        });
      } catch (e) {
        res.status(500).json({ error: e.message });
      }
    });
    
    console.log("✅ All routes registered");
  } catch (error) {
    console.error("❌ Failed to load routes:", error);
  }
}
