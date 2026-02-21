import { GoogleGenAI, Type } from "@google/genai";
import { settingsService } from "./settingsService";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const DEFAULT_PROMPT = `Analyze this URL: {{url}}. 
Generate a concise title (max 6 words) and description (max 20 words) in Hebrew and English. 
The tone should be inviting and suitable for a "digital gifts" discovery website.`;

const PRIMARY_MODEL = "gemini-3-flash-preview";
const FALLBACK_MODEL = "gemini-3.1-pro-preview";

export const geminiService = {
  async generateLinkInfo(url: string) {
    try {
      const settings = await settingsService.getGlobalSettings();
      const promptTemplate = settings.aiPrompt || DEFAULT_PROMPT;
      const finalPrompt = promptTemplate.replace('{{url}}', url);
      
      // Use user-selected model or default to PRIMARY
      const selectedModel = settings.aiModel || PRIMARY_MODEL;

      try {
        return await this.callGemini(selectedModel, finalPrompt);
      } catch (primaryError: any) {
        // If the error is related to quota or availability, try the fallback model
        // Only fallback if the user hasn't explicitly selected a model (or if we want to force fallback anyway)
        // For now, let's try fallback if the primary fails, unless the primary IS the fallback
        if (selectedModel !== FALLBACK_MODEL) {
          console.warn(`Primary model ${selectedModel} failed, trying fallback ${FALLBACK_MODEL}. Error:`, primaryError);
          return await this.callGemini(FALLBACK_MODEL, finalPrompt);
        }
        throw primaryError;
      }
    } catch (error) {
      console.error("Gemini Error:", error);
      throw error;
    }
  },

  async callGemini(modelName: string, prompt: string) {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title_he: { type: Type.STRING },
            title_en: { type: Type.STRING },
            description_he: { type: Type.STRING },
            description_en: { type: Type.STRING },
          },
          required: ["title_he", "title_en", "description_he", "description_en"],
        },
        tools: [{ urlContext: {} }]
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
