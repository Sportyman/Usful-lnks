import { GoogleGenAI, Type } from "@google/genai";
import { settingsService } from "./settingsService";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const DEFAULT_PROMPT = `Analyze this URL: {{url}}. 
Generate a concise title (max 6 words) and description (max 20 words) in Hebrew and English. 
Also, find a relevant high-quality image URL (logo, product image, or main banner) that best represents this link.
Also, generate up to 5 relevant tags (short keywords) in Hebrew.
IMPORTANT: 
1. Do NOT guess image URLs (like '/logo.png'). 
2. If the page doesn't have a good image, use Google Search to find a high-quality official logo or product image for the service/product.
3. Return ONLY valid, absolute URLs (starting with http:// or https://).
The tone should be inviting and suitable for a "digital gifts" discovery website.`;

const PRIMARY_MODEL = "gemini-3-flash-preview";
const FALLBACK_MODEL = "gemini-3.1-pro-preview";

export const geminiService = {
  async generateLinkInfo(url: string, customPrompt?: string, specificField?: string) {
    try {
      const settings = await settingsService.getGlobalSettings();
      let promptTemplate = customPrompt || settings.aiPrompt || DEFAULT_PROMPT;
      
      // If asking for a specific field, modify the prompt to focus only on that
      if (specificField) {
        if (specificField === 'imageUrl') {
          promptTemplate = `Find a high-quality, valid, absolute image URL (logo, product image, or main banner) for this URL: {{url}}. 
          Use Google Search if needed. Return ONLY the URL.`;
        } else if (specificField === 'tags') {
          promptTemplate = `Analyze this URL: {{url}}. Generate 5 relevant tags (keywords) in Hebrew.`;
        } else if (specificField === 'title_he') {
          promptTemplate = `Analyze this URL: {{url}}. Generate a concise title (max 6 words) in Hebrew.`;
        } else if (specificField === 'title_en') {
          promptTemplate = `Analyze this URL: {{url}}. Generate a concise title (max 6 words) in English.`;
        } else if (specificField === 'description_he') {
          promptTemplate = `Analyze this URL: {{url}}. Generate a concise description (max 20 words) in Hebrew.`;
        } else if (specificField === 'description_en') {
          promptTemplate = `Analyze this URL: {{url}}. Generate a concise description (max 20 words) in English.`;
        }
      }

      const finalPrompt = promptTemplate.replace('{{url}}', url);
      
      // Use user-selected model or default to PRIMARY
      const selectedModel = settings.aiModel || PRIMARY_MODEL;

      try {
        return await this.callGemini(selectedModel, finalPrompt, specificField);
      } catch (primaryError: any) {
        if (selectedModel !== FALLBACK_MODEL) {
          console.warn(`Primary model ${selectedModel} failed, trying fallback ${FALLBACK_MODEL}. Error:`, primaryError);
          return await this.callGemini(FALLBACK_MODEL, finalPrompt, specificField);
        }
        throw primaryError;
      }
    } catch (error) {
      console.error("Gemini Error:", error);
      throw error;
    }
  },

  async callGemini(modelName: string, prompt: string, specificField?: string) {
    // Define schema based on what we are asking for
    let schemaProperties: any = {
      title_he: { type: Type.STRING },
      title_en: { type: Type.STRING },
      description_he: { type: Type.STRING },
      description_en: { type: Type.STRING },
      imageUrl: { type: Type.STRING, description: "A valid, absolute URL to the main product image or logo. Use Google Search if needed." },
      tags: { type: Type.ARRAY, items: { type: Type.STRING } },
    };
    let requiredFields = ["title_he", "title_en", "description_he", "description_en"];

    if (specificField) {
      if (specificField === 'imageUrl') {
        schemaProperties = { imageUrl: { type: Type.STRING } };
        requiredFields = ["imageUrl"];
      } else if (specificField === 'tags') {
        schemaProperties = { tags: { type: Type.ARRAY, items: { type: Type.STRING } } };
        requiredFields = ["tags"];
      } else {
        // For single text fields
        schemaProperties = { [specificField]: { type: Type.STRING } };
        requiredFields = [specificField];
      }
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: schemaProperties,
          required: requiredFields,
        },
        tools: [{ urlContext: {} }, { googleSearch: {} }]
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);
  },

  async generateCategoryInfo(inputName: string) {
    // Categories are rare operations, just use the primary model (Flash)
    try {
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
      return JSON.parse(text);
    } catch (error) {
      console.error("Gemini Error:", error);
      throw error;
    }
  }
};
