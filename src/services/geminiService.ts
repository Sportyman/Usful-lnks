import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const geminiService = {
  async generateLinkInfo(url: string) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this URL and generate a title and description in both Hebrew and English. 
        The content should be inviting and suitable for a "digital gifts" discovery website.
        URL: ${url}`,
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
    } catch (error) {
      console.error("Gemini Error:", error);
      throw error;
    }
  },

  async generateCategoryInfo(inputName: string) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
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
