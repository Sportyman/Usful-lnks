import { Link, Category } from '../types';

/**
 * Local synonym map to help with intent matching without AI cost.
 */
const SYNONYM_MAP: Record<string, string[]> = {
  // Entertainment & Translation
  'תרגום': ['כתוביות', 'כתובית', 'מתורגם', 'דובב', 'תירגום', 'subtitles', 'translation', 'subs'],
  'כתוביות': ['כתובית', 'תרגום', 'מתורגם', 'סאב', 'subs', 'subtitles', 'תירגום'],
  'כתובית': ['כתוביות', 'תרגום', 'מתורגם', 'subtitles'],
  'סרטים': ['סרט', 'סינמה', 'קולנוע', 'movies', 'cinema', 'צפייה'],
  'סדרות': ['סדרה', 'טלויזיה', 'series', 'tv', 'וידאו'],
  
  // Gaming
  'משחקים': ['משחק', 'גיימינג', 'קודים', 'loot', 'gaming', 'games', 'play'],
  'קודים': ['מתנה', 'בונוס', 'loot', 'codes', 'promo', 'redeem'],
  'זהב': ['מטבעות', 'כסף', 'gold', 'coins', 'money'],
  
  // Shopping / Tech
  'כלים': ['תוכנה', 'אפליקציה', 'tools', 'apps', 'software'],
  'קופונים': ['הנחה', 'מבצע', 'coupons', 'discount', 'deals', 'sale'],
  'חינם': ['מתנה', 'בחינם', 'free', 'gift', 'zero'],
};

/**
 * Strips common Hebrew prefixes that might hinder simple keyword matching.
 */
const normalizeHebrew = (text: string) => {
  if (!text) return '';
  // Remove common prefix letters if they are followed by at least 3 letters 
  // (to avoid stripping roots like 'בית')
  return text.toLowerCase().trim()
    .replace(/^[הובכלמש]([א-ת]{3,})/g, '$1'); 
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
  
  // 1. Create match groups for each query term
  const matchGroups = queryTerms.map(term => {
    const group = new Set<string>();
    group.add(term);
    
    // Add normalized version
    const normalized = normalizeHebrew(term);
    if (normalized !== term) group.add(normalized);
    
    // Add synonyms
    if (SYNONYM_MAP[term]) {
      SYNONYM_MAP[term].forEach(s => group.add(s));
    }
    
    // Check if term is a prefix of any synonym or vice versa
    Object.keys(SYNONYM_MAP).forEach(key => {
      if (key.includes(term) || term.includes(key)) {
        group.add(key);
        SYNONYM_MAP[key].forEach(s => group.add(s));
      }
    });

    return Array.from(group);
  });

  // 2. Perform search with scoring
  const scoredLinks = links.map(link => {
    const category = categories.find(c => c.id === link.categoryId);
    const catHe = category?.name_he?.toLowerCase() || '';
    const catEn = category?.name_en?.toLowerCase() || '';
    
    const titleHe = link.title_he?.toLowerCase() || '';
    const titleEn = link.title_en?.toLowerCase() || '';
    const subHe = link.subtitle_he?.toLowerCase() || '';
    const subEn = link.subtitle_en?.toLowerCase() || '';
    const descHe = link.description_he?.toLowerCase() || '';
    const descEn = link.description_en?.toLowerCase() || '';
    const tags = (link.tags || []).map(t => t.toLowerCase());

    const fullContent = [titleHe, titleEn, subHe, subEn, descHe, descEn, ...tags, catHe, catEn].join(' ');

    let score = 0;
    let matchesAllGroups = true;

    for (const group of matchGroups) {
      const groupMatch = group.some(term => fullContent.includes(term));
      
      if (!groupMatch) {
        matchesAllGroups = false;
        break;
      }

      // Scoring logic for sorting
      group.forEach(term => {
        if (titleHe.includes(term) || titleEn.includes(term)) score += 50;
        if (tags.some(t => t.includes(term))) score += 30;
        if (subHe.includes(term) || subEn.includes(term)) score += 20;
        if (descHe.includes(term) || descEn.includes(term)) score += 10;
        
        // Exact match bonus
        if (titleHe === term || titleEn === term) score += 100;
      });
    }

    return { link, score, matchesAllGroups };
  });

  // 3. Filter and Sort
  return scoredLinks
    .filter(sl => sl.matchesAllGroups)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Tie breaker: Date desc
      return (b.link.createdAt?.seconds || 0) - (a.link.createdAt?.seconds || 0);
    })
    .map(sl => sl.link);
};
