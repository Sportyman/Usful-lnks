import { useEffect, useState } from 'react';
import { Coupon } from '../../types/coupon';
import { fetchCoupons } from '../../services/couponService';
import { CouponCard } from './CouponCard';
import { Tag } from 'lucide-react';
import { useLanguageStore } from '../../store/languageStore';

export function CouponList() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguageStore();

  useEffect(() => {
    const loadCoupons = async () => {
      const data = await fetchCoupons();
      setCoupons(data);
      setLoading(false);
    };
    loadCoupons();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-40 bg-gray-200 rounded-xl border-2 border-black/5" />
        ))}
      </div>
    );
  }

  if (coupons.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-black/20 rounded-xl">
        <Tag className="w-12 h-12 mx-auto text-gray-300 mb-2" />
        <p className="text-gray-500 font-medium">
          {language === 'he' ? 'לא נמצאו קופונים פעילים.' : 'No active coupons found.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {coupons.map(coupon => (
        <CouponCard key={coupon.id} coupon={coupon} />
      ))}
    </div>
  );
}
