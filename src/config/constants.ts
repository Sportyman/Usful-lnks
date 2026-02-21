/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const APP_VERSION = '1.0.0';
export const APP_NAME = 'Affiliate Link Hub';

export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const AFFILIATE_BASE_URL = 'https://s.click.aliexpress.com/e/_c4K8DSUb?bz=';
export const REDIRECT_DELAY_MS = 650; // Between 500-800ms
export const ADMIN_ROUTE_PATH = '/internal-portal-8472';
export const ADMIN_CLICK_TRIGGER = 10;
export const ADMIN_SHORTCUT = { ctrl: true, shift: true, alt: true, key: 'L' }; // Ctrl+Shift+Alt+L
export const DEFAULT_GEMINI_PROMPT = `Analyze this URL and generate a title and description in both Hebrew and English.
Also, find a relevant high-quality image URL for this product or website.
The content should be inviting and suitable for a "digital gifts" discovery website.
Keep titles short (max 5 words) and descriptions concise (max 15 words).`;
