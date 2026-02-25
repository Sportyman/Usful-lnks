import { useState } from 'react';
import { Coupon } from '../../types/coupon';
import { Copy, Check, Calendar } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useLanguageStore } from '../../store/languageStore';

interface CouponCardProps {
  coupon: Coupon;
}

export function CouponCard({ coupon }: CouponCardProps) {
  const [copied, setCopied] = useState(false);
  const { language } = useLanguageStore();

  const handleCopy = () => {
    navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border-2 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex flex-col justify-between h-full relative overflow-hidden">
      
      {/* Event Badge */}
      {coupon.event && (
        <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
          {coupon.event}
        </div>
      )}

      <div className="mb-4">
        <div className="flex flex-wrap gap-2 items-center mb-3 pr-16">
          <span className="bg-[#FFD23F] px-2 py-1 rounded border border-black text-sm font-black uppercase">
            {coupon.discount}
          </span>
          {coupon.minSpend && (
            <span className="text-[10px] font-bold text-gray-500 uppercase bg-gray-100 px-2 py-1 rounded border border-black/10">
              Min: {coupon.minSpend}
            </span>
          )}
        </div>
        
        <p className="text-base font-medium text-gray-800 leading-snug mb-2">
          {coupon.description}
        </p>
        
        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
           <Calendar className="w-3 h-3" />
           <span>{coupon.month} {coupon.year}</span>
           {coupon.expiry_date && (
             <>
               <span className="w-1 h-1 bg-gray-300 rounded-full" />
               <span className="text-red-400">Exp: {coupon.expiry_date}</span>
             </>
           )}
        </div>
      </div>
      
      <div className="flex items-center gap-2 mt-auto pt-4 border-t border-black/5">
        <div className="flex-1 bg-gray-50 border-2 border-dashed border-black/20 rounded-lg px-3 py-2 font-mono text-lg font-bold text-center select-all tracking-wider text-ink-900">
          {coupon.code}
        </div>
        <button
          onClick={handleCopy}
          className={cn(
            "h-full aspect-square flex items-center justify-center rounded-lg border-2 border-black transition-all active:scale-95",
            copied ? "bg-[#4ECDC4] text-black" : "bg-black text-white hover:bg-gray-800"
          )}
          title={language === 'he' ? 'העתק קוד' : 'Copy Code'}
        >
          {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
