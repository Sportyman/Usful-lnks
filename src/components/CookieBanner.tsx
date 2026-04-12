/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useLanguageStore } from '../store/languageStore';
import { useDataStore } from '../store/dataStore';
import { useClientIp } from '../hooks/useClientIp';
import { Button } from './ui/Button';
import { Shield, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

export const CookieBanner = () => {
  const { language, isRTL } = useLanguageStore();
  const { settings } = useDataStore();
  const { ip } = useClientIp();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    const isExcluded = ip && settings?.excludedIps?.includes(ip);

    if (!consent && !isExcluded) {
      // Show after a short delay
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [ip, settings?.excludedIps]);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-8 md:max-w-md"
      >
        <div className="bg-white p-6 rounded-3xl shadow-2xl border border-black/5 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-accent-peach/10 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-accent-peach" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-ink-900">
                {language === 'he' ? 'פרטיות ועוגיות' : 'Privacy & Cookies'}
              </h3>
              <p className="text-xs text-ink-500 leading-relaxed mt-1">
                {language === 'he' 
                  ? 'אנו משתמשים בעוגיות ובטכנולוגיות מעקב (כמו Microsoft Clarity) כדי לשפר את חווית הגלישה שלך ולנתח את השימוש באתר.' 
                  : 'We use cookies and tracking technologies (like Microsoft Clarity) to improve your browsing experience and analyze site usage.'}
              </p>
            </div>
            <button 
              onClick={() => setIsVisible(false)}
              className="p-1 text-ink-300 hover:text-ink-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleAccept} className="flex-1 h-10 text-xs">
              {language === 'he' ? 'אני מסכים' : 'I Agree'}
            </Button>
            <Link 
              to="/privacy" 
              className="text-[10px] font-bold uppercase tracking-widest text-ink-400 hover:text-ink-900 transition-colors"
            >
              {language === 'he' ? 'מדיניות פרטיות' : 'Privacy Policy'}
            </Link>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
