import { settingsService } from "./settingsService";

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
    const response = await fetch('/api/gemini/generate-link-info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        modelName,
        prompt,
        specificField
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API Error: ${response.status}`);
    }

    return await response.json();
  },

  async generateCategoryInfo(inputName: string) {
    try {
      const response = await fetch('/api/gemini/generate-category-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputName })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Gemini Error:", error);
      throw error;
    }
  }
};
