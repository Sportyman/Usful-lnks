import { useState } from 'react';
import { Coupon } from '../../types/coupon';
import { Copy, Check, ExternalLink } from 'lucide-react';
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
    <div className="bg-white border-2 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex flex-col justify-between h-full">
      <div>
        <div className="flex justify-between items-start mb-2">
          <span className="bg-[#FFD23F] px-2 py-1 rounded border border-black text-xs font-black uppercase">
            {coupon.discount}
          </span>
          {coupon.minSpend && (
            <span className="text-[10px] font-bold text-gray-500 uppercase">
              Min: {coupon.minSpend}
            </span>
          )}
        </div>
        <p className="text-sm font-medium text-gray-600 mb-4 line-clamp-2">
          {coupon.description}
        </p>
      </div>
      
      <div className="flex items-center gap-2 mt-auto">
        <div className="flex-1 bg-gray-100 border border-black/10 rounded px-3 py-2 font-mono text-sm font-bold text-center select-all truncate">
          {coupon.code}
        </div>
        <button
          onClick={handleCopy}
          className={cn(
            "p-2 rounded border border-black transition-colors",
            copied ? "bg-[#4ECDC4] text-black" : "bg-white hover:bg-gray-50"
          )}
          title={language === 'he' ? 'העתק קוד' : 'Copy Code'}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
        <a
          href={coupon.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded border border-black bg-black text-white hover:bg-gray-800 transition-colors"
          title={language === 'he' ? 'בקר באתר' : 'Visit Source'}
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
