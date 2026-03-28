import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PRIMARY_MODEL = "gemini-3-flash-preview";
const FALLBACK_MODEL = "gemini-2.5-flash";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// API routes FIRST
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/diagnostics", (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    isVercel: !!process.env.VERCEL,
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    geminiKeyLength: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0,
    hasApiKey: !!process.env.API_KEY,
    apiKeyLength: process.env.API_KEY ? process.env.API_KEY.length : 0,
    nodeVersion: process.version,
    platform: process.platform,
    memoryUsage: process.memoryUsage(),
  });
});

app.get("/api/diagnostics/test-gemini", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, error: "API Key is not configured on the server." });
    }
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents: "Say 'Hello World'",
    });
    res.json({ success: true, text: response.text });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message, stack: error.stack });
  }
});

app.post("/api/gemini/generate-link-info", async (req, res) => {
  try {
    const { modelName, prompt, specificField } = req.body;
    
    let apiKey = process.env.GEMINI_API_KEY;
    if (process.env.NODE_ENV === 'production' && process.env.API_KEY) {
      apiKey = process.env.API_KEY;
    }
    
    if (!apiKey || apiKey.length < 30) {
      return res.status(500).json({ error: "A valid API Key is not configured on the server." });
    }

    const ai = new GoogleGenAI({ apiKey });

    let schemaProperties: any = {
      title_he: { type: Type.STRING },
      title_en: { type: Type.STRING },
      subtitle_he: { type: Type.STRING },
      subtitle_en: { type: Type.STRING },
      description_he: { type: Type.STRING },
      description_en: { type: Type.STRING },
      tags: { type: Type.ARRAY, items: { type: Type.STRING } },
    };
    let requiredFields = ["title_he", "title_en", "subtitle_he", "subtitle_en", "description_he", "description_en"];

    if (specificField) {
      if (specificField === 'imageUrl') {
        schemaProperties = { imageUrl: { type: Type.STRING } };
        requiredFields = ["imageUrl"];
      } else if (specificField === 'tags') {
        schemaProperties = { tags: { type: Type.ARRAY, items: { type: Type.STRING } } };
        requiredFields = ["tags"];
      } else {
        schemaProperties = { [specificField]: { type: Type.STRING } };
        requiredFields = [specificField];
      }
    }

    const response = await ai.models.generateContent({
      model: modelName || PRIMARY_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: schemaProperties,
          required: requiredFields,
        }
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Server Gemini Error:", error);
    res.status(500).json({ 
      error: error.message || "Failed to generate content",
      modelName: req.body.modelName 
    });
  }
});

app.post("/api/fetch-og-image", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    const response = await fetch(url);
    const html = await response.text();
    
    // Simple regex to find og:image
    const match = html.match(/<meta property="og:image" content="([^"]+)"/);
    if (match && match[1]) {
      res.json({ imageUrl: match[1] });
    } else {
      res.status(404).json({ error: "No OG image found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch image" });
  }
});

app.post("/api/gemini/generate-category-info", async (req, res) => {
  try {
    const { inputName } = req.body;
    
    let apiKey = process.env.GEMINI_API_KEY;
    if (process.env.NODE_ENV === 'production' && process.env.API_KEY) {
      apiKey = process.env.API_KEY;
    }
    
    if (!apiKey || apiKey.length < 30) {
      return res.status(500).json({ error: "A valid API Key is not configured on the server." });
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents: `Generate category information based on this name: "${inputName}". 
      Provide a name in Hebrew, a name in English, and a URL-friendly slug in English.
      The slug should be lowercase with hyphens instead of spaces.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name_he: { type: Type.STRING },
            name_en: { type: Type.STRING },
            slug: { type: Type.STRING },
          },
          required: ["name_he", "name_en", "slug"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Server Gemini Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate content" });
  }
});

// Vite middleware for development (only run when not deployed on serverless)
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  import("vite").then(({ createServer: createViteServer }) => {
    createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    }).then((vite) => {
      app.use(vite.middlewares);
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    });
  }).catch(err => console.error("Failed to load vite", err));
} else if (!process.env.VERCEL) {
  // Production mode but NOT Vercel (e.g., AI Studio deployment)
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Export the app for Vercel
export default app;
