/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  increment,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Link } from '../types';

const LINKS_COLLECTION = 'links';

export const linkService = {
  async getAllLinks(onlyActive = true) {
    const linksRef = collection(db, LINKS_COLLECTION);
    let q = query(linksRef, orderBy('createdAt', 'desc'));
    
    if (onlyActive) {
      q = query(linksRef, where('isActive', '==', true), orderBy('createdAt', 'desc'));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Link));
  },

  async getLinksByCategory(categoryId: string, onlyActive = true) {
    const linksRef = collection(db, LINKS_COLLECTION);
    let q = query(
      linksRef, 
      where('categoryId', '==', categoryId), 
      orderBy('createdAt', 'desc')
    );
    
    if (onlyActive) {
      q = query(
        linksRef, 
        where('categoryId', '==', categoryId), 
        where('isActive', '==', true), 
        orderBy('createdAt', 'desc')
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Link));
  },

  async createLink(link: Omit<Link, 'id' | 'createdAt' | 'clicks'>) {
    const linksRef = collection(db, LINKS_COLLECTION);
    return await addDoc(linksRef, {
      ...link,
      clicks: 0,
      createdAt: serverTimestamp(),
    });
  },

  async updateLink(id: string, data: Partial<Link>) {
    const linkRef = doc(db, LINKS_COLLECTION, id);
    return await updateDoc(linkRef, data);
  },

  async deleteLink(id: string) {
    const linkRef = doc(db, LINKS_COLLECTION, id);
    return await deleteDoc(linkRef);
  },

  async getLinkById(id: string) {
    const linkRef = doc(db, LINKS_COLLECTION, id);
    const snapshot = await getDoc(linkRef);
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as Link;
    }
    return null;
  },

  async incrementClicks(id: string) {
    const linkRef = doc(db, LINKS_COLLECTION, id);
    return await updateDoc(linkRef, {
      clicks: increment(1)
    });
  }
};
