import { CouponList } from '../components/coupons/CouponList';
import { useLanguageStore } from '../store/languageStore';
import { motion } from 'motion/react';
import { Ticket, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchCoupons } from '../services/couponService';
import { Coupon } from '../types/coupon';

export default function CouponsPage() {
  const { language } = useLanguageStore();
  const [latestCoupon, setLatestCoupon] = useState<Coupon | null>(null);

  useEffect(() => {
    const getLatest = async () => {
      const coupons = await fetchCoupons();
      if (coupons.length > 0) {
        setLatestCoupon(coupons[0]);
      }
    };
    getLatest();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 text-center"
      >
        <div className="inline-flex items-center gap-2 mb-4 bg-white/50 backdrop-blur-sm px-4 py-1.5 rounded-full border border-black/5 shadow-sm">
           <Ticket className="w-4 h-4 text-[#FF6B6B]" />
           <span className="font-mono text-[10px] font-bold uppercase tracking-widest">
             {language === 'he' ? 'קופונים בלעדיים' : 'Exclusive Deals'}
           </span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-black uppercase mb-4 leading-tight">
          <span 
            className="text-[#FF6B6B]" 
            style={{ 
              WebkitTextStroke: '1.5px black',
              paintOrder: 'stroke fill'
            }}
          >
            AliExpress
          </span>{' '}
          <span className="text-[#FF6B6B] inline-block transform -rotate-2 bg-black text-white px-2">
            Coupons
          </span>
        </h1>
        
        {latestCoupon && (
          <div className="inline-flex items-center gap-2 mb-6 bg-black/5 px-3 py-1 rounded-lg">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-bold text-gray-600 uppercase tracking-wide">
              {language === 'he' ? 'מעודכן ל:' : 'Updated for:'} {latestCoupon.month} {latestCoupon.year}
            </span>
          </div>
        )}
        
        <p className="text-lg md:text-xl font-medium text-gray-500 max-w-2xl mx-auto">
          {language === 'he' 
            ? 'הקופונים השווים ביותר מאליאקספרס, מתעדכנים מדי יום. תפסו אותם לפני שייגמרו!'
            : 'The best AliExpress coupons, updated daily. Grab them before they expire!'}
        </p>
      </motion.div>

      <CouponList />
    </div>
  );
}
