export interface SeoMetadata {
  title: string;
  description: string;
  keywords: string;
}

export const generateSeoMetadata = async (
  content: { title: string; description: string; subtitle?: string; tags?: string[] },
  language: 'he' | 'en'
): Promise<SeoMetadata> => {
  try {
    const response = await fetch('/api/gemini/generate-seo-metadata', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, language })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to generate SEO metadata", error);
    return {
      title: content.title,
      description: content.description.substring(0, 157) + "...",
      keywords: content.tags?.join(', ') || content.title,
    };
  }
};
