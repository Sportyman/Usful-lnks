/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, getFirestore, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import { FIREBASE_CONFIG } from '../config/constants';

const isFirebaseConfigured = !!FIREBASE_CONFIG.apiKey && !!FIREBASE_CONFIG.projectId;

if (!isFirebaseConfigured) {
  console.warn('Firebase is not fully configured. Please check your environment variables (API Key and Project ID).');
}

const app = isFirebaseConfigured 
  ? initializeApp(FIREBASE_CONFIG) 
  : initializeApp({ apiKey: 'placeholder', projectId: 'placeholder' });

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Use initializeFirestore with experimentalForceLongPolling to fix "client is offline" errors
// in environments with restricted WebSocket/gRPC connections.
export const db = isFirebaseConfigured 
  ? initializeFirestore(app, {
      experimentalForceLongPolling: true,
    })
  : getFirestore(app);

export const analytics = (typeof window !== 'undefined' && isFirebaseConfigured) ? getAnalytics(app) : null;

export default app;
