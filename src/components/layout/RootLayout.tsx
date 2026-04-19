/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Outlet, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useLanguageSync } from '../../hooks/useLanguageSync';
import { LanguageToggle } from './LanguageToggle';
import { Footer } from './Footer';
import { useLanguageStore } from '../../store/languageStore';
import { Sparkles } from 'lucide-react';
import { ClarityTracker } from '../ClarityTracker';
import { CookieBanner } from '../CookieBanner';

export function RootLayout() {
  useLanguageSync();
  const { language } = useLanguageStore();

  useEffect(() => {
    const handleDoubleClick = (e: MouseEvent) => {
      // Check if the target is an interactive element or content
      const target = e.target as HTMLElement;
      const isInteractive = target.closest('button, a, input, textarea, select, [role="button"], img, p, span, h1, h2, h3, h4, h5, h6, label');
      
      if (!isInteractive) {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(err => {
            console.log(`Error attempting to enable full-screen mode: ${err.message}`);
          });
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          }
        }
      }
    };

    document.addEventListener('dblclick', handleDoubleClick);
    return () => document.removeEventListener('dblclick', handleDoubleClick);
  }, []);

  return (
    <div className="min-h-screen bg-bg-soft text-ink-900 font-sans selection:bg-accent-peach selection:text-ink-900 flex flex-col">
      <ClarityTracker />
      <CookieBanner />
      {/* Floating Header */}
      <header className="fixed top-0 inset-x-0 z-50 px-4 pt-4 sm:px-6 sm:pt-6 pointer-events-none">
        <div className="w-full max-w-screen-2xl mx-auto flex items-center justify-between pointer-events-auto">
          <Link to="/" className="group relative">
            <div className="absolute inset-0 bg-white/50 blur-xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center gap-2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-white/50 transition-transform group-hover:scale-105">
              <div className="w-6 h-6 bg-ink-900 rounded-full flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <span className="font-sans font-black tracking-tight text-sm uppercase">
                DIGITAL.GIFTS
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link 
              to="/coupons" 
              className="bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-white/50 text-xs font-bold uppercase hover:bg-white transition-colors"
            >
              {language === 'he' ? 'קופונים' : 'Coupons'}
            </Link>
            
            <div className="bg-white/80 backdrop-blur-md px-1.5 py-1 rounded-full shadow-sm border border-white/50">
              <LanguageToggle />
            </div>
          </div>
        </div>
      </header>
      
      <main className="pt-20 sm:pt-24 pb-12 flex-1 w-full max-w-full overflow-x-hidden">
        <div className="max-w-screen-2xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Minimal Footer */}
      <div className="w-full">
        <div className="w-full max-w-screen-2xl mx-auto px-6 pb-6 flex justify-center overflow-x-hidden">
           <Footer />
        </div>
      </div>
    </div>
  );
}
