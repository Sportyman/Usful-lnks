import { settingsService } from "./settingsService";
import { getIdToken } from "./firebase";

export const DEFAULT_LINK_PROMPT = `You are a professional SEO expert and content strategist. 
Analyze this URL: {{url}}. 
{{context}}
Generate a high-converting, SEO-optimized title (max 4 words), a catchy subtitle (max 6 words), and a compelling description (max 20 words) in Hebrew and English. 
Also, generate up to 5 relevant tags (short keywords) in Hebrew.

Guidelines:
- CRITICAL: Prioritize extracting specific deals, rewards, coupons, or unique value propositions mentioned in the source or context (e.g., "50k Gold", "20% Off", "Free Trial").
- Title: Must be punchy and include the main keyword or the most attractive benefit.
- Subtitle: A magnetic one-liner that highlights the core value proposition.
- Description: Concise, persuasive, and optimized for click-through rate.
- Tone: Professional yet inviting, suitable for a "digital gifts" and "lifestyle" discovery platform.
- Language: Natural-sounding Hebrew and English.`;

export const DEFAULT_CATEGORY_PROMPT = `You are a professional SEO expert.
Analyze this category name: {{name}}.
Generate a professional SEO title and a compelling meta description in Hebrew and English.
Also, generate relevant keywords in Hebrew.

Guidelines:
- Title: SEO-optimized, including the category name.
- Description: Engaging summary that encourages exploration.
- Tone: Professional and authoritative.`;

const PRIMARY_MODEL = "gemini-3-flash-preview";
const FALLBACK_MODEL = "gemini-2.5-flash";

export const geminiService = {
  async generateLinkInfo(url: string, customPrompt?: string, specificField?: string, context?: string) {
    try {
      const settings = await settingsService.getGlobalSettings();
      
      // If asking for a specific field, modify the prompt to focus only on that
      if (specificField === 'imageUrl') {
        return await this.fetchOgImage(url);
      }

      let promptTemplate = customPrompt || settings.aiPromptLinks || settings.aiPrompt || DEFAULT_LINK_PROMPT;
      
      if (specificField) {
        const contextStr = context ? `Context provided: "${context}". ` : '';
        if (specificField === 'tags') {
          promptTemplate = `Analyze this URL: {{url}}. ${contextStr}Generate 5 relevant tags (keywords) in Hebrew.`;
        } else if (specificField === 'title_he') {
          promptTemplate = `Analyze this URL: {{url}}. ${contextStr}Generate a concise title (max 6 words) in Hebrew. Focus on the main benefit.`;
        } else if (specificField === 'title_en') {
          promptTemplate = `Analyze this URL: {{url}}. ${contextStr}Generate a concise title (max 6 words) in English. Focus on the main benefit.`;
        } else if (specificField === 'description_he') {
          promptTemplate = `Analyze this URL: {{url}}. ${contextStr}Generate a concise description (max 20 words) in Hebrew. Include specific rewards/deals if mentioned.`;
        } else if (specificField === 'description_en') {
          promptTemplate = `Analyze this URL: {{url}}. ${contextStr}Generate a concise description (max 20 words) in English. Include specific rewards/deals if mentioned.`;
        } else if (specificField === 'subtitle_he') {
          promptTemplate = `Analyze this URL: {{url}}. ${contextStr}Generate a short subtitle (max 6 words) in Hebrew. Highlight the value proposition.`;
        } else if (specificField === 'subtitle_en') {
          promptTemplate = `Analyze this URL: {{url}}. ${contextStr}Generate a short subtitle (max 6 words) in English. Highlight the value proposition.`;
        }
      }

      let finalPrompt = promptTemplate.replace('{{url}}', url);
      finalPrompt = finalPrompt.replace('{{context}}', context ? `Context provided by user: "${context}". Use this information to prioritize the most relevant rewards or deals.` : '');
      
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

  async semanticSearch(query: string, links: any[], language: string) {
    try {
      const idToken = await getIdToken();
      // Prepare a minimal version of links to save tokens
      const linksSummary = links.map(l => ({
        id: l.id,
        title: language === 'he' ? l.title_he : l.title_en,
        subtitle: language === 'he' ? l.subtitle_he : l.subtitle_en,
        tags: l.tags || []
      }));

      const response = await fetch('/api/gemini/semantic-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({ query, links: linksSummary, language })
      });

      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error("Semantic search error:", error);
      return [];
    }
  },

  async callGemini(modelName: string, prompt: string, specificField?: string) {
    const idToken = await getIdToken();
    const response = await fetch('/api/gemini/generate-link-info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
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

  async generateCategoryInfo(inputName: string, context?: string) {
    try {
      const settings = await settingsService.getGlobalSettings();
      const promptTemplate = settings.aiPromptCategories || DEFAULT_CATEGORY_PROMPT;
      let finalPrompt = promptTemplate.replace('{{name}}', inputName);
      
      if (context) {
        finalPrompt += `\n\nAdditional Context: "${context}". Use this information to refine the SEO titles and descriptions.`;
      }

      const selectedModel = settings.aiModel || PRIMARY_MODEL;

      const idToken = await getIdToken();
      const response = await fetch('/api/gemini/generate-category-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({ 
          inputName,
          prompt: finalPrompt,
          modelName: selectedModel
        })
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

  async generateLegalContent(type: string, language: 'he' | 'en', legalInfo?: any) {
    try {
      const idToken = await getIdToken();
      const response = await fetch('/api/gemini/generate-legal-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({ type, language, legalInfo })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error("Gemini Legal Error:", error);
      throw error;
    }
  },

  async generateAllLegalContent(legalInfo?: any) {
    try {
      const idToken = await getIdToken();
      const response = await fetch('/api/gemini/generate-all-legal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({ legalInfo })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Gemini Bulk Legal Error:", error);
      throw error;
    }
  },

  async fetchOgImage(url: string) {
    try {
      const idToken = await getIdToken();
      const response = await fetch('/api/fetch-og-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
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
