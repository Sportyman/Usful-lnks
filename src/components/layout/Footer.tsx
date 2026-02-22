/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguageStore } from '../../store/languageStore';
import { ADMIN_CLICK_TRIGGER, ADMIN_SHORTCUT } from '../../config/constants';

export function Footer() {
  const { language } = useLanguageStore();
  const [clickCount, setClickCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (clickCount >= ADMIN_CLICK_TRIGGER) {
      navigate('/login');
      setClickCount(0);
    }
  }, [clickCount, navigate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // e.code works regardless of keyboard layout (KeyL is always the 'L' key)
      // We also keep e.key checks as a robust fallback
      const isLKey = e.code === 'KeyL' || e.key.toUpperCase() === 'L' || e.key === 'ך';
      
      const match = 
        e.ctrlKey === ADMIN_SHORTCUT.ctrl && 
        e.shiftKey === ADMIN_SHORTCUT.shift && 
        e.altKey === ADMIN_SHORTCUT.alt && 
        isLKey;
      
      if (match) {
        e.preventDefault(); // Prevent browser default behavior
        navigate('/login');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <footer className="py-8 border-t border-black/5 mt-12 w-full">
      <div className="max-w-screen-2xl mx-auto px-6 text-center space-y-4">
        <p 
          className="text-ink-500 text-[10px] font-bold uppercase tracking-[0.3em] cursor-default select-none opacity-40 hover:opacity-100 transition-opacity"
          onClick={() => setClickCount(prev => prev + 1)}
        >
          {language === 'he' 
            ? '© 2026 כל הזכויות שמורות • האוצר' 
            : '© 2026 ALL RIGHTS RESERVED • THE HUB'}
        </p>
        <div className="flex justify-center gap-4">
          <div className="w-1 h-1 rounded-full bg-accent-peach" />
          <div className="w-1 h-1 rounded-full bg-accent-sage" />
          <div className="w-1 h-1 rounded-full bg-accent-lavender" />
        </div>
      </div>
    </footer>
  );
}
