/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { Language } from '../types';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  isRTL: boolean;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: 'he',
  isRTL: true,
  setLanguage: (lang) => set({ 
    language: lang, 
    isRTL: lang === 'he' 
  }),
}));
