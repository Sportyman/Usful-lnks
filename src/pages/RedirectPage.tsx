/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { useLanguageStore } from '../store/languageStore';
import { linkService } from '../services/linkService';
import { settingsService } from '../services/settingsService';
import { analyticsService } from '../services/analyticsService';
import { REDIRECT_DELAY_MS } from '../config/constants';

export default function RedirectPage() {
  const { linkId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useLanguageStore();
  const [targetUrl, setTargetUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = searchParams.get('to');
    if (!url || !linkId) {
      navigate('/');
      return;
    }
    setTargetUrl(decodeURIComponent(url));

    // 1. Fetch Affiliate URL & Trigger
    const triggerAffiliate = async () => {
      try {
        const settings = await settingsService.getGlobalSettings();
        const affiliateFrame = document.createElement('iframe');
        affiliateFrame.style.display = 'none';
        affiliateFrame.src = settings.affiliateUrl;
        document.body.appendChild(affiliateFrame);
        
        // Cleanup
        setTimeout(() => {
          if (document.body.contains(affiliateFrame)) {
            document.body.removeChild(affiliateFrame);
          }
        }, REDIRECT_DELAY_MS + 2000);
      } catch (err) {
        console.error('Failed to load affiliate settings', err);
      }
    };
    
    triggerAffiliate();

    // 2. Analytics & Firestore Increment
    linkService.incrementClicks(linkId);
    analyticsService.logLinkClick(linkId, 'Redirecting...');

    // 3. Final Redirect
    const timer = setTimeout(() => {
      window.location.href = decodeURIComponent(url);
    }, REDIRECT_DELAY_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [linkId, searchParams, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6"
      >
        <div className="w-16 h-16 border-4 border-zinc-100 border-t-black rounded-full animate-spin mx-auto" />
        <h1 className="text-2xl font-semibold">
          {language === 'he' ? 'מעביר אותך ליעד...' : 'Redirecting you to your destination...'}
        </h1>
        <p className="text-zinc-400 max-w-xs mx-auto">
          {language === 'he' 
            ? 'אנחנו מכינים את הקישור עבורך. תודה על הסבלנות!' 
            : 'We are preparing the link for you. Thanks for your patience!'}
        </p>
      </motion.div>
    </div>
  );
}
