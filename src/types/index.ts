/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'he' | 'en';

export interface Category {
  id: string;
  name_he: string;
  name_en: string;
  slug: string;
  order: number;
  isActive: boolean;
  imageUrl?: string;
  imageFit?: 'cover' | 'contain' | 'fill';
  imageZoom?: number;
  textAlign?: 'right' | 'left' | 'center';
  isComingSoon?: boolean;
  subtitle_he?: string;
  subtitle_en?: string;
  justifySubtitle?: boolean;
  seoTitle_he?: string;
  seoTitle_en?: string;
  seoDescription_he?: string;
  seoDescription_en?: string;
  seoKeywords_he?: string;
  seoKeywords_en?: string;
  slugFormat?: string;
}

export interface Link {
  id: string;
  title_he: string;
  title_en: string;
  subtitle_he?: string;
  subtitle_en?: string;
  description_he: string;
  description_en: string;
  targetUrl: string;
  customSlug?: string;
  categoryId: string;
  imageUrl?: string;
  tags?: string[];
  createdAt: any; // Firestore Timestamp
  isActive: boolean;
  clicks: number;
  textAlign?: 'right' | 'left' | 'center';
  seoTitle_he?: string;
  seoTitle_en?: string;
  seoDescription_he?: string;
  seoDescription_en?: string;
  seoKeywords_he?: string;
  seoKeywords_en?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'user';
}

export interface GlobalSettings {
  affiliateUrl: string;
  affiliateUrlHistory?: { url: string; timestamp: number }[];
  aiPrompt?: string; // Legacy field, keeping for compatibility
  aiPromptLinks?: string;
  aiPromptCategories?: string;
  aiModel?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  borderRadius?: string;
  showHeroMarquee?: boolean;
  heroMarqueeText?: string;
  siteTitle_he?: string;
  siteTitle_en?: string;
  siteDescription_he?: string;
  siteDescription_en?: string;
  siteKeywords_he?: string;
  siteKeywords_en?: string;
  siteOgImage?: string;
  clarityId?: string;
  excludedIps?: string[];
  privacyPolicy_he?: string;
  privacyPolicy_en?: string;
  termsOfUse_he?: string;
  termsOfUse_en?: string;
  accessibility_he?: string;
  accessibility_en?: string;
  legalInfo?: {
    companyName?: string;
    email?: string;
    address?: string;
    websiteUrl?: string;
    ownerName?: string;
  };
}

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
