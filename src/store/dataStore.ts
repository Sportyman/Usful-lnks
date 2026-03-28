/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { Link as LinkType, Category, GlobalSettings } from '../types';
import { linkService } from '../services/linkService';
import { categoryService } from '../services/categoryService';
import { settingsService } from '../services/settingsService';

interface DataState {
  links: LinkType[];
  categories: Category[];
  settings: GlobalSettings | null;
  isLoading: boolean;
  hasLoaded: boolean;
  error: string | null;
  fetchData: (force?: boolean) => Promise<void>;
}

export const useDataStore = create<DataState>((set, get) => ({
  links: [],
  categories: [],
  settings: null,
  isLoading: false,
  hasLoaded: false,
  error: null,
  fetchData: async (force = false) => {
    if (get().hasLoaded && !force) return;
    
    set({ isLoading: true, error: null });
    try {
      const [links, categories, settings] = await Promise.all([
        linkService.getAllLinks(true),
        categoryService.getAllCategories(true),
        settingsService.getGlobalSettings()
      ]);
      set({ links, categories, settings, hasLoaded: true, error: null });
    } catch (error: any) {
      console.error('Failed to fetch data:', error);
      set({ error: error.message || 'Failed to connect to database' });
    } finally {
      set({ isLoading: false });
    }
  },
}));
