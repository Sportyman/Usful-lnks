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
}

export interface Link {
  id: string;
  title_he: string;
  title_en: string;
  description_he: string;
  description_en: string;
  targetUrl: string;
  categoryId: string;
  imageUrl?: string;
  tags?: string[];
  createdAt: any; // Firestore Timestamp
  isActive: boolean;
  clicks: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'user';
}

export interface GlobalSettings {
  affiliateUrl: string;
  affiliateUrlHistory?: { url: string; timestamp: number }[];
  aiPrompt?: string;
  aiModel?: string;
}
