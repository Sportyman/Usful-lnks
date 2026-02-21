/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { GlobalSettings } from '../types';
import { AFFILIATE_BASE_URL } from '../config/constants';

const SETTINGS_COLLECTION = 'settings';
const GLOBAL_DOC_ID = 'global';

export const settingsService = {
  async getGlobalSettings(): Promise<GlobalSettings> {
    try {
      const docRef = doc(db, SETTINGS_COLLECTION, GLOBAL_DOC_ID);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as GlobalSettings;
      } else {
        // Create default if not exists
        const defaultSettings: GlobalSettings = {
          affiliateUrl: AFFILIATE_BASE_URL
        };
        try {
          await setDoc(docRef, defaultSettings);
        } catch (e) {
          console.warn('Failed to create default settings document (likely permission issue). Using default in-memory.', e);
        }
        return defaultSettings;
      }
    } catch (error) {
      console.error('Error fetching global settings:', error);
      return { affiliateUrl: AFFILIATE_BASE_URL };
    }
  },

  async updateGlobalSettings(settings: Partial<GlobalSettings>): Promise<void> {
    const docRef = doc(db, SETTINGS_COLLECTION, GLOBAL_DOC_ID);
    const currentSettings = await this.getGlobalSettings();
    
    // If affiliateUrl is changing, add old one to history
    let history = currentSettings.affiliateUrlHistory || [];
    if (settings.affiliateUrl && settings.affiliateUrl !== currentSettings.affiliateUrl) {
      history = [
        { url: currentSettings.affiliateUrl, timestamp: Date.now() },
        ...history
      ].slice(0, 10); // Keep last 10
    }

    await setDoc(docRef, { ...settings, affiliateUrlHistory: history }, { merge: true });
  }
};
