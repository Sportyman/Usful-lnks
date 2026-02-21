/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { logEvent } from 'firebase/analytics';
import { analytics } from './firebase';

export const analyticsService = {
  logLinkClick(linkId: string, title: string) {
    if (analytics) {
      logEvent(analytics, 'link_click', {
        link_id: linkId,
        link_title: title,
      });
    }
  },

  logPageView(pageName: string) {
    if (analytics) {
      logEvent(analytics, 'page_view', {
        page_name: pageName,
      });
    }
  }
};
