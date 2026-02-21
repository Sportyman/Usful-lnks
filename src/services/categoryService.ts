/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db } from './firebase';
import { Category } from '../types';

const CATEGORIES_COLLECTION = 'categories';

export const categoryService = {
  async getAllCategories(onlyActive = true) {
    const categoriesRef = collection(db, CATEGORIES_COLLECTION);
    let q = query(categoriesRef, orderBy('order', 'asc'));
    
    if (onlyActive) {
      q = query(categoriesRef, where('isActive', '==', true), orderBy('order', 'asc'));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
  },

  async createCategory(category: Omit<Category, 'id'>) {
    const categoriesRef = collection(db, CATEGORIES_COLLECTION);
    return await addDoc(categoriesRef, category);
  },

  async updateCategory(id: string, data: Partial<Category>) {
    const categoryRef = doc(db, CATEGORIES_COLLECTION, id);
    return await updateDoc(categoryRef, data);
  },

  async deleteCategory(id: string) {
    const categoryRef = doc(db, CATEGORIES_COLLECTION, id);
    return await deleteDoc(categoryRef);
  }
};
