import { CouponList } from '../components/coupons/CouponList';
import { useLanguageStore } from '../store/languageStore';
import { motion } from 'motion/react';
import { Ticket, Calendar, Zap, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchCoupons } from '../services/couponService';
import { Coupon } from '../types/coupon';
import { cn } from '../utils/cn';

export default function CouponsPage() {
  const { language } = useLanguageStore();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'upcoming'>('active');
  const [latestCoupon, setLatestCoupon] = useState<Coupon | null>(null);

  useEffect(() => {
    const loadCoupons = async () => {
      setLoading(true);
      const data = await fetchCoupons();
      setCoupons(data);
      if (data.length > 0) {
        setLatestCoupon(data[0]);
      }
      setLoading(false);
    };
    loadCoupons();
  }, []);

  const filteredCoupons = coupons.filter(coupon => {
    const isUpcoming = coupon.status === 'upcoming' && coupon.start_date && new Date(coupon.start_date).getTime() > Date.now();
    
    if (activeTab === 'active') {
      // Show active coupons AND upcoming coupons that have already started
      return !isUpcoming;
    } else {
      // Show ONLY upcoming coupons that haven't started yet
      return isUpcoming;
    }
  });

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
        
        <p className="text-lg md:text-xl font-medium text-gray-500 max-w-2xl mx-auto mb-8">
          {language === 'he' 
            ? 'הקופונים השווים ביותר מאליאקספרס, מתעדכנים מדי יום. תפסו אותם לפני שייגמרו!'
            : 'The best AliExpress coupons, updated daily. Grab them before they expire!'}
        </p>

        {/* Tabs */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setActiveTab('active')}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-full border-2 border-black font-bold uppercase transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
              activeTab === 'active' 
                ? "bg-[#FFD23F] text-black" 
                : "bg-white text-gray-500 hover:bg-gray-50"
            )}
          >
            <Zap className={cn("w-4 h-4", activeTab === 'active' ? "fill-black" : "")} />
            {language === 'he' ? 'קופונים פעילים' : 'Active Coupons'}
          </button>
          
          <button
            onClick={() => setActiveTab('upcoming')}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-full border-2 border-black font-bold uppercase transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
              activeTab === 'upcoming' 
                ? "bg-[#4ECDC4] text-black" 
                : "bg-white text-gray-500 hover:bg-gray-50"
            )}
          >
            <Clock className={cn("w-4 h-4", activeTab === 'upcoming' ? "fill-black" : "")} />
            {language === 'he' ? 'בקרוב' : 'Coming Soon'}
          </button>
        </div>
      </motion.div>

      <CouponList coupons={filteredCoupons} loading={loading} />
    </div>
  );
}
