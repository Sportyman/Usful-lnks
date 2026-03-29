import { categoryService } from "./categoryService";
import { linkService } from "./linkService";
import { generateSeoMetadata } from "./seoService";
import { Category, Link } from "../types";

export interface BulkSeoProgress {
  total: number;
  current: number;
  status: string;
  isComplete: boolean;
  errors: string[];
}

export const bulkSeoService = {
  async generateForMissing(
    onProgress: (progress: BulkSeoProgress) => void
  ) {
    const categories = await categoryService.getAllCategories(false);
    const links = await linkService.getAllLinks(false);

    const missingCategories = categories.filter(
      (c) => !c.seoTitle_he || !c.seoTitle_en || !c.seoDescription_he || !c.seoDescription_en
    );
    const missingLinks = links.filter(
      (l) => !l.seoTitle_he || !l.seoTitle_en || !l.seoDescription_he || !l.seoDescription_en
    );

    const total = missingCategories.length + missingLinks.length;
    console.log(`Bulk SEO: Found ${missingCategories.length} categories and ${missingLinks.length} links missing SEO. Total: ${total}`);
    let current = 0;
    const errors: string[] = [];

    const updateProgress = (status: string) => {
      onProgress({
        total,
        current,
        status,
        isComplete: current === total,
        errors,
      });
    };

    updateProgress("Starting bulk SEO generation...");

    // Process Categories
    for (const cat of missingCategories) {
      try {
        updateProgress(`Generating SEO for category: ${cat.name_he || cat.name_en}...`);
        
        const [heSeo, enSeo] = await Promise.all([
          generateSeoMetadata({ 
            title: cat.name_he, 
            description: "" 
          }, 'he'),
          generateSeoMetadata({ 
            title: cat.name_en, 
            description: "" 
          }, 'en')
        ]);

        await categoryService.updateCategory(cat.id, {
          ...cat,
          seoTitle_he: heSeo.title,
          seoDescription_he: heSeo.description,
          seoKeywords_he: heSeo.keywords,
          seoTitle_en: enSeo.title,
          seoDescription_en: enSeo.description,
          seoKeywords_en: enSeo.keywords,
        });
      } catch (err: any) {
        errors.push(`Category ${cat.name_he}: ${err.message}`);
      } finally {
        current++;
        updateProgress(current === total ? "Complete!" : "Processing...");
      }
    }

    // Process Links
    for (const link of missingLinks) {
      try {
        updateProgress(`Generating SEO for link: ${link.title_he || link.title_en}...`);
        
        const [heSeo, enSeo] = await Promise.all([
          generateSeoMetadata({ 
            title: link.title_he, 
            description: link.description_he,
            subtitle: link.subtitle_he,
            tags: link.tags
          }, 'he'),
          generateSeoMetadata({ 
            title: link.title_en, 
            description: link.description_en,
            subtitle: link.subtitle_en,
            tags: link.tags
          }, 'en')
        ]);

        await linkService.updateLink(link.id, {
          ...link,
          seoTitle_he: heSeo.title,
          seoDescription_he: heSeo.description,
          seoKeywords_he: heSeo.keywords,
          seoTitle_en: enSeo.title,
          seoDescription_en: enSeo.description,
          seoKeywords_en: enSeo.keywords,
        });
      } catch (err: any) {
        errors.push(`Link ${link.title_he}: ${err.message}`);
      } finally {
        current++;
        updateProgress(current === total ? "Complete!" : "Processing...");
      }
    }

    onProgress({
      total,
      current,
      status: errors.length > 0 ? "Completed with errors" : "Successfully completed!",
      isComplete: true,
      errors,
    });
  }
};
