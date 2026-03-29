import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface SeoMetadata {
  title: string;
  description: string;
  keywords: string;
}

export const generateSeoMetadata = async (
  content: { title: string; description: string; subtitle?: string; tags?: string[] },
  language: 'he' | 'en'
): Promise<SeoMetadata> => {
  const prompt = `Generate SEO metadata (title, description, keywords) for the following content in ${language === 'he' ? 'Hebrew' : 'English'}:
  Title: ${content.title}
  Subtitle: ${content.subtitle || 'N/A'}
  Description: ${content.description}
  Tags: ${content.tags?.join(', ') || 'N/A'}

  The title should be catchy and under 60 characters.
  The description should be a summary under 160 characters.
  The keywords should be a comma-separated list of 5-10 relevant terms.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
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

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Failed to parse SEO metadata", e);
    return {
      title: content.title,
      description: content.description.substring(0, 157) + "...",
      keywords: content.tags?.join(', ') || content.title,
    };
  }
};
