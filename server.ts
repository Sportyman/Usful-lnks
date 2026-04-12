import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import admin from "firebase-admin";

dotenv.config();

// Initialize Firebase Admin
const initializeFirebaseAdmin = () => {
  if (admin.apps.length > 0) return;

  try {
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 
                      process.env.FIREBASE_PROJECT_ID || 
                      process.env.GOOGLE_CLOUD_PROJECT || 
                      process.env.GCP_PROJECT;
    
    if (projectId && projectId !== "undefined" && projectId !== "") {
      admin.initializeApp({
        projectId: projectId,
      });
      console.log("Firebase Admin initialized for project:", projectId);
    } else {
      // Try default initialization (works in Cloud Run if service account has access)
      admin.initializeApp();
      console.log("Firebase Admin initialized with default credentials");
    }
  } catch (e) {
    console.error("Firebase Admin initialization failed:", e);
  }
};

initializeFirebaseAdmin();

const db = admin.firestore();
// If you are using a named database, you might need:
// const db = admin.firestore().database('your-database-id');
// But we'll stick to default for now unless we find a database ID.

const PRIMARY_MODEL = "gemini-3-flash-preview";
const FALLBACK_MODEL = "gemini-2.5-flash";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// API routes FIRST
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Server-side Meta Injection for Sharing
const serveWithMeta = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const linkId = req.params.linkId as string;
  const categoryId = req.query.category as string;

  // Only handle if it's a redirect link or the home page with a category
  if (!linkId && !categoryId && req.path !== '/') {
    return next();
  }

  try {
    let title = "DIGITAL.GIFTS";
    let description = "The ultimate collection of digital tools and gifts.";
    let imageUrl = "https://picsum.photos/seed/digitalgifts/1200/630";
    let url = process.env.APP_URL || "";

    if (linkId) {
      try {
        let linkDoc = await db.collection('links').doc(linkId).get();
        let data = linkDoc.exists ? linkDoc.data() : null;

        // If not found by ID, try searching by customSlug
        if (!data) {
          const slugQuery = await db.collection('links').where('customSlug', '==', linkId).limit(1).get();
          if (!slugQuery.empty) {
            data = slugQuery.docs[0].data();
          }
        }

        if (data) {
          title = data.title_he || data.title_en || title;
          description = data.description_he || data.description_en || description;
          imageUrl = data.imageUrl || imageUrl;
          url = `${url}/go/${linkId}`;
        }
      } catch (dbError) {
        console.error("Firestore access error in meta injection:", dbError);
        // Continue without specific meta data if DB fails
      }
    } else if (categoryId) {
      const catDoc = await db.collection('categories').doc(categoryId).get();
      if (catDoc.exists) {
        const data = catDoc.data() || {};
        title = data.name_he || data.name_en || title;
        description = data.seoDescription_he || data.seoDescription_en || description;
        imageUrl = data.imageUrl || imageUrl;
        url = `${url}/?category=${categoryId}`;
      }
    }

    const indexPath = process.env.NODE_ENV === 'production' 
      ? path.join(process.cwd(), 'dist', 'index.html')
      : path.join(process.cwd(), 'index.html');

    if (!fs.existsSync(indexPath)) {
      return next();
    }

    let html = fs.readFileSync(indexPath, 'utf8');

    const metaTags = `
      <title>${title}</title>
      <meta name="description" content="${description}">
      <meta property="og:title" content="${title}">
      <meta property="og:description" content="${description}">
      <meta property="og:image" content="${imageUrl}">
      <meta property="og:url" content="${url}">
      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:image" content="${imageUrl}">
      <meta name="twitter:title" content="${title}">
      <meta name="twitter:description" content="${description}">
    `;

    // Inject meta tags
    html = html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
    html = html.replace('</head>', `${metaTags}</head>`);

    res.send(html);
  } catch (error) {
    console.error("Error in meta injection:", error);
    next();
  }
};

app.get("/go/:linkId", serveWithMeta);
app.get("/", (req, res, next) => {
  if (req.query.category) {
    return serveWithMeta(req, res, next);
  }
  next();
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

app.post("/api/gemini/generate-seo-metadata", async (req, res) => {
  try {
    const { content, language } = req.body;
    
    let apiKey = process.env.GEMINI_API_KEY;
    if (process.env.NODE_ENV === 'production' && process.env.API_KEY) {
      apiKey = process.env.API_KEY;
    }
    
    if (!apiKey || apiKey.length < 30) {
      return res.status(500).json({ error: "A valid API Key is not configured on the server." });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Generate SEO metadata (title, description, keywords) for the following content in ${language === 'he' ? 'Hebrew' : 'English'}:
    Title: ${content.title}
    Subtitle: ${content.subtitle || 'N/A'}
    Description: ${content.description}
    Tags: ${content.tags?.join(', ') || 'N/A'}

    The title should be catchy and under 60 characters.
    The description should be a summary under 160 characters.
    The keywords should be a comma-separated list of 5-10 relevant terms.`;

    const response = await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            keywords: { type: Type.STRING },
          },
          required: ["title", "description", "keywords"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Server Gemini SEO Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate SEO metadata" });
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
