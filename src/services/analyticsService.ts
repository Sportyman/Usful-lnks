/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { logEvent } from 'firebase/analytics';
import { analytics } from './firebase';
import { useDataStore } from '../store/dataStore';

const isExcluded = async () => {
  const settings = useDataStore.getState().settings;
  if (!settings?.excludedIps || settings.excludedIps.length === 0) return false;

  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return settings.excludedIps.includes(data.ip);
  } catch (error) {
    return false;
  }
};

export const analyticsService = {
  async logLinkClick(linkId: string, title: string) {
    if (analytics && !(await isExcluded())) {
      logEvent(analytics, 'link_click', {
        link_id: linkId,
        link_title: title,
      });
    }
  },

  async logPageView(pageName: string) {
    if (analytics && !(await isExcluded())) {
      logEvent(analytics, 'page_view', {
        page_name: pageName,
      });
    }
  }
};
