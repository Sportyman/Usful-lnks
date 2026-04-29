import Fuse from 'fuse.js';
import { Link, Category } from '../types';

/**
 * Enhanced Synonym Map for Hebrew/English Intent Matching
 */
const SYNONYM_MAP: Record<string, string[]> = {
  // Entertainment & Translation
  'תרגום': ['כתוביות', 'כתובית', 'מתורגם', 'דובב', 'תירגום', 'subtitles', 'translation', 'subs', 'סאבים'],
  'כתוביות': ['כתובית', 'תרגום', 'מתורגם', 'סאב', 'subs', 'subtitles', 'תירגום', 'סאבים'],
  'כתובית': ['כתוביות', 'תרגום', 'מתורגם', 'subtitles', 'סאבים'],
  'סרטים': ['סרט', 'סינמה', 'קולנוע', 'movies', 'cinema', 'צפייה', 'ישיר'],
  'סדרות': ['סדרה', 'טלויזיה', 'series', 'tv', 'וידאו', 'פרקים'],
  
  // Gaming
  'משחקים': ['משחק', 'גיימינג', 'קודים', 'loot', 'gaming', 'games', 'play', 'לשחק'],
  'קודים': ['מתנה', 'בונוס', 'loot', 'codes', 'promo', 'redeem', 'צ׳יטים'],
  'זהב': ['מטבעות', 'כסף', 'gold', 'coins', 'money', 'יהלומים'],
  
  // Shopping / Tech
  'כלים': ['תוכנה', 'אפליקציה', 'tools', 'apps', 'software', 'עזרים'],
  'קופונים': ['הנחה', 'מבצע', 'coupons', 'discount', 'deals', 'sale', 'הטבות'],
  'חינם': ['מתנה', 'בחינם', 'free', 'gift', 'zero', 'ללא עלות'],
};

/**
 * Basic Hebrew Stemmer/Normalizer to handle prefixes and common suffixes.
 */
const normalizeHebrew = (text: string) => {
  if (!text) return '';
  return text.toLowerCase().trim()
    // Remove common prefixes if word is long enough
    .replace(/^[הובכלמש]([א-ת]{3,})/g, '$1')
    // Handle some common suffixes for plurality/gender
    .replace(/([א-ת]{2,})ות$/g, '$1')
    .replace(/([א-ת]{2,})ים$/g, '$1')
    .replace(/([א-ת]{2,})ית$/g, '$1');
};

export const searchLinks = (
  links: Link[], 
  categories: Category[], 
  query: string, 
  language: 'he' | 'en'
) => {
  const trimmedQuery = query.toLowerCase().trim();
  if (!trimmedQuery) return links;

  const queryTerms = trimmedQuery.split(/\s+/).filter(Boolean);
  
  // 1. Expand query with synonyms and roots
  const expandedTerms = new Set<string>();
  queryTerms.forEach(term => {
    expandedTerms.add(term);
    
    // Add root normalization
    const normalized = normalizeHebrew(term);
    if (normalized !== term) expandedTerms.add(normalized);
    
    // Add synonyms
    if (SYNONYM_MAP[term]) {
      SYNONYM_MAP[term].forEach(s => {
        expandedTerms.add(s);
        const normS = normalizeHebrew(s);
        if (normS !== s) expandedTerms.add(normS);
      });
    }
  });

  const finalSearchQuery = Array.from(expandedTerms).join(' ');

  // 2. Prepare data for Fuse.js
  const searchData = links.map(link => {
    const category = categories.find(c => c.id === link.categoryId);
    const catName = category ? (language === 'he' ? category.name_he : category.name_en) : '';
    
    return {
      ...link,
      categoryName: catName,
      // Aggregated text field for broad matching
      compositeText: [
        link.title_he, link.title_en,
        link.subtitle_he, link.subtitle_en,
        link.description_he, link.description_en,
        ...(link.tags || []),
        catName
      ].filter(Boolean).join(' ')
    };
  });

  // 3. Configure Fuse.js for balanced fuzzy matching
  const fuse = new Fuse(searchData, {
    keys: [
      { name: 'title_he', weight: 3 },
      { name: 'title_en', weight: 3 },
      { name: 'tags', weight: 2 },
      { name: 'subtitle_he', weight: 1.5 },
      { name: 'categoryName', weight: 1 },
      { name: 'compositeText', weight: 0.5 }
    ],
    threshold: 0.4, // Balanced: not too strict, not too loose
    location: 0,
    distance: 100,
    minMatchCharLength: 2,
    shouldSort: true,
    includeScore: true,
    findAllMatches: true,
    useExtendedSearch: true, // Allows for complex query symbols if needed
  });

  // 4. Perform search
  const results = fuse.search(finalSearchQuery);
  
  // If we have results, return them. If not, revert to a more basic simple-match as fallback
  if (results.length > 0) {
    return results.map(r => r.item);
  }

  // Fallback: Simple keyword match (AND logic)
  return links.filter(link => {
    const searchTarget = [
      link.title_he, link.title_en, link.subtitle_he, link.subtitle_en, 
      link.description_he, link.description_en, ...(link.tags || [])
    ].join(' ').toLowerCase();
    
    return queryTerms.every(term => 
      searchTarget.includes(term.toLowerCase()) || 
      searchTarget.includes(normalizeHebrew(term))
    );
  });
};
