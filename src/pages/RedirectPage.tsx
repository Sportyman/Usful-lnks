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

import { Zap, Sparkles, ExternalLink } from 'lucide-react';

export default function RedirectPage() {
  const { linkId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useLanguageStore();
  const { addLog } = useDebugStore();
  const [targetUrl, setTargetUrl] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const loadLink = async () => {
      if (!linkId) {
        addLog('warn', 'RedirectPage: Missing linkId');
        navigate('/');
        return;
      }

      try {
        const link = await linkService.getLinkById(linkId);
        if (!link) {
          addLog('warn', 'RedirectPage: Link not found', { linkId });
          navigate('/');
          return;
        }

        const decodedUrl = link.targetUrl;
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
        timer = setTimeout(() => {
          addLog('info', 'RedirectPage: Final redirecting now', { url: decodedUrl });
          
          // Check if it's a deep link (custom scheme like clashroyale://)
          const isDeepLink = !decodedUrl.startsWith('http://') && !decodedUrl.startsWith('https://');
          
          if (isDeepLink) {
            // For deep links, we use window.location.assign to trigger the app
            window.location.assign(decodedUrl);
            
            // Fallback: if user is still here after 2 seconds, they might not have the app
            // We can show a message or just let them stay on the page
            setTimeout(() => {
              addLog('warn', 'RedirectPage: Deep link triggered, user still on page');
            }, 2000);
          } else {
            window.location.href = decodedUrl;
          }
        }, REDIRECT_DELAY_MS);
      } catch (err) {
        addLog('error', 'RedirectPage: Failed to load link', { error: err });
        navigate('/');
      }
    };
    
    loadLink();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [linkId, navigate, addLog]);

  const isDeepLink = targetUrl ? (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) : false;

  return (
    <div className="min-h-screen bg-[#F4F3F0] flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white border-4 border-black p-8 rounded-[32px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center relative overflow-hidden"
      >
        {/* Decorative background */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#FFD23F] via-[#F27D26] to-[#FF6B6B]" />
        
        <div className="mb-8 relative">
          <motion.div
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-20 h-20 bg-[#FFD23F] border-4 border-black rounded-2xl flex items-center justify-center mx-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <Zap className="w-10 h-10 text-black fill-black" />
          </motion.div>
          
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#F27D26] border-2 border-black rounded-full flex items-center justify-center animate-bounce">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-black uppercase tracking-tight mb-4 leading-tight">
          {isDeepLink 
            ? (language === 'he' ? 'פותח את האפליקציה...' : 'Opening the app...')
            : (language === 'he' ? 'מעביר אותך ליעד...' : 'Redirecting you...')}
        </h1>
        
        <p className="text-gray-500 font-medium mb-8">
          {isDeepLink
            ? (language === 'he' ? 'אנחנו מפעילים את האפליקציה עבורך. תודה על הסבלנות!' : 'We are launching the app for you. Thanks for your patience!')
            : (language === 'he' ? 'אנחנו מכינים את הקישור עבורך. תודה על הסבלנות!' : 'We are preparing the link for you. Thanks for your patience!')}
        </p>

        <div className="space-y-4">
          <div className="w-full h-4 bg-gray-100 border-2 border-black rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, ease: "easeInOut" }}
              className="h-full bg-[#FFD23F]"
            />
          </div>
          
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
            <span>{language === 'he' ? 'טוען' : 'LOADING'}</span>
            <span>100%</span>
          </div>
        </div>

        {/* Desktop Helper */}
        <div className="mt-8 pt-6 border-t-2 border-dashed border-gray-200">
          <p className="text-xs font-bold text-gray-400 uppercase mb-3">
            {language === 'he' ? 'לא עבר אוטומטית?' : 'Not redirected automatically?'}
          </p>
          <a 
            href={targetUrl || '#'} 
            className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full font-black uppercase text-xs hover:bg-gray-800 transition-colors"
          >
            {language === 'he' ? 'לחץ כאן למעבר ידני' : 'Click here to go manually'}
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </motion.div>
    </div>
  );
}
