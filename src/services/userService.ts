/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { collection, getDocs, doc, updateDoc, query, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile } from '../types';

const USERS_COLLECTION = 'users';

export const userService = {
  /**
   * Fetch all users (limited to 100 for safety, can be paginated if needed)
   */
  async getAllUsers(): Promise<UserProfile[]> {
    try {
      const usersQuery = query(
        collection(db, USERS_COLLECTION),
        orderBy('email', 'asc'),
        limit(100)
      );
      const querySnapshot = await getDocs(usersQuery);
      return querySnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as UserProfile[];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  /**
   * Update a user's role
   */
  async updateUserRole(uid: string, role: 'admin' | 'user'): Promise<void> {
    try {
      const userRef = doc(db, USERS_COLLECTION, uid);
      await updateDoc(userRef, { role });
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }
};
