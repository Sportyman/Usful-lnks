import { settingsService } from "./settingsService";

export const DEFAULT_PROMPT = `Analyze this URL: {{url}}. 
Generate a concise title (max 6 words) and description (max 20 words) in Hebrew and English. 
Also, generate up to 5 relevant tags (short keywords) in Hebrew.
IMPORTANT: 
The tone should be inviting and suitable for a "digital gifts" discovery website.`;

const PRIMARY_MODEL = "gemini-3-flash-preview";
const FALLBACK_MODEL = "gemini-2.5-flash";

export const geminiService = {
  async generateLinkInfo(url: string, customPrompt?: string, specificField?: string) {
    try {
      const settings = await settingsService.getGlobalSettings();
      
      // If asking for a specific field, modify the prompt to focus only on that
      if (specificField === 'imageUrl') {
        return await this.fetchOgImage(url);
      }

      let promptTemplate = customPrompt || settings.aiPrompt || DEFAULT_PROMPT;
      
      if (specificField) {
        if (specificField === 'tags') {
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
        let result = await this.callGemini(selectedModel, finalPrompt, specificField);
        if (!specificField) {
          try {
            const hostname = new URL(url).hostname;
            result.imageUrl = `https://icon.horse/icon/${hostname}`;
          } catch (e) {
            result.imageUrl = '';
          }
        }
        return result;
      } catch (primaryError: any) {
        if (selectedModel !== FALLBACK_MODEL) {
          console.warn(`Primary model ${selectedModel} failed, trying fallback ${FALLBACK_MODEL}. Error:`, primaryError);
          let fallbackResult = await this.callGemini(FALLBACK_MODEL, finalPrompt, specificField);
          if (!specificField) {
            try {
              const hostname = new URL(url).hostname;
              fallbackResult.imageUrl = `https://icon.horse/icon/${hostname}`;
            } catch (e) {
              fallbackResult.imageUrl = '';
            }
          }
          return fallbackResult;
        }
        // Attach model name to error for better reporting
        primaryError.modelName = selectedModel;
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
      const error = new Error(errorData.error || `API Error: ${response.status}`);
      (error as any).modelName = modelName; // Attach model name
      throw error;
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
  },

  async fetchOgImage(url: string) {
    try {
      const response = await fetch('/api/fetch-og-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch OG image');
      }

      return await response.json();
    } catch (error) {
      console.error("OG Image Error:", error);
      throw error;
    }
  }
};
