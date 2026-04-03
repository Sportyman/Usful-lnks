/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { auth } from '../services/firebase';

export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const idToken = await user.getIdToken();
  
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    // Handle unauthorized/forbidden
    console.error('API access denied', response.status);
  }

  return response;
}
