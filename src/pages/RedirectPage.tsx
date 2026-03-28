/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { useLanguageStore } from '../store/languageStore';
import { useDebugStore } from '../store/debugStore';
import { linkService } from '../services/linkService';
import { settingsService } from '../services/settingsService';
import { analyticsService } from '../services/analyticsService';
import { REDIRECT_DELAY_MS } from '../config/constants';

export default function RedirectPage() {
  const { linkId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useLanguageStore();
  const { addLog } = useDebugStore();
  const [targetUrl, setTargetUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = searchParams.get('to');
    if (!url || !linkId) {
      addLog('warn', 'RedirectPage: Missing URL or linkId', { url, linkId });
      navigate('/');
      return;
    }
    const decodedUrl = decodeURIComponent(url);
    setTargetUrl(decodedUrl);
    addLog('info', 'RedirectPage: Starting redirection', { linkId, targetUrl: decodedUrl });

    // 1. Fetch Affiliate URL & Trigger
    const triggerAffiliate = async () => {
      try {
        const settings = await settingsService.getGlobalSettings();
        addLog('debug', 'RedirectPage: Triggering affiliate frame', { affiliateUrl: settings.affiliateUrl });
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
        addLog('error', 'RedirectPage: Failed to load affiliate settings', { error: err });
        console.error('Failed to load affiliate settings', err);
      }
    };
    
    triggerAffiliate();

    // 2. Analytics & Firestore Increment
    linkService.incrementClicks(linkId);
    analyticsService.logLinkClick(linkId, 'Redirecting...');

    // 3. Final Redirect
    const timer = setTimeout(() => {
      addLog('info', 'RedirectPage: Final redirecting now', { url: decodedUrl });
      window.location.href = decodedUrl;
    }, REDIRECT_DELAY_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [linkId, searchParams, navigate, addLog]);

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
