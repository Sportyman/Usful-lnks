import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';
import { Coupon } from '../types/coupon';

const COUPONS_COLLECTION = 'coupons';

export const fetchCoupons = async (): Promise<Coupon[]> => {
  try {
    const q = query(
      collection(db, COUPONS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Coupon));
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return [];
  }
};
