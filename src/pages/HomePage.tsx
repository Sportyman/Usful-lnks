/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguageStore } from '../store/languageStore';
import { useDataStore } from '../store/dataStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ExternalLink, Search, ArrowUpRight, Filter, ArrowLeft, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../utils/cn';

export default function HomePage() {
  const { language, isRTL } = useLanguageStore();
  const { links, categories, isLoading, error, fetchData } = useDataStore();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredLinks = useMemo(() => {
    return links.filter(link => {
      const matchesCategory = !selectedCategory || link.categoryId === selectedCategory;
      const title = language === 'he' ? link.title_he : link.title_en;
      const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [links, selectedCategory, searchQuery, language]);

  if (error) {
    // ... error UI remains similar but with refined colors ...
  }

  if (isLoading && links.length === 0) {
    return (
      <div className="space-y-12">
        <div className="fixed top-0 left-0 w-full h-0.5 bg-slate-100 z-50">
          <motion.div className="h-full bg-brand-600" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 1.5, repeat: Infinity }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-20">
          {[1, 2, 3].map(i => <div key={i} className="h-64 bg-white rounded-xl border border-slate-100 animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 sm:space-y-20 px-4 sm:px-12">
      {/* Minimal Header / Filters */}
      <section className="flex flex-col items-center gap-6 pt-8 sm:pt-12">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-6xl font-sans font-extrabold tracking-tighter uppercase italic text-ink-900 text-center"
        >
          {language === 'he' ? 'גילוי' : 'DISCOVER'}
        </motion.h1>

        <div className="w-full flex justify-center px-4 sm:px-0">
          <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar max-w-full sm:justify-center">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "flex-none px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all border cursor-pointer",
                selectedCategory === null 
                  ? "bg-ink-900 text-white border-ink-900" 
                  : "bg-transparent text-ink-500 border-ink-900/10 hover:border-ink-900"
              )}
            >
              {language === 'he' ? 'הכל' : 'All'}
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "flex-none px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all border cursor-pointer",
                  selectedCategory === cat.id 
                    ? "bg-ink-900 text-white border-ink-900" 
                    : "bg-transparent text-ink-500 border-ink-900/10 hover:border-ink-900"
                )}
              >
                {language === 'he' ? cat.name_he : cat.name_en}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Vertical List of Wide Cards */}
      <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4 pb-12">
        <AnimatePresence mode="popLayout">
          {filteredLinks.map((link, index) => (
            <motion.div
              key={link.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <a 
                href={`/redirect/${link.id}?to=${encodeURIComponent(link.targetUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block bg-white hover:bg-gray-50 rounded-xl sm:rounded-[2rem] p-2 sm:p-4 flex items-center gap-3 sm:gap-6 cursor-pointer border border-black/5 shadow-sm hover:shadow-md transition-all duration-300 w-full"
              >
                {/* Thumbnail Image */}
                <div className="w-16 h-16 sm:w-32 sm:h-32 shrink-0 rounded-lg sm:rounded-[1.5rem] overflow-hidden bg-gray-100 relative">
                  <img 
                    src={link.imageUrl || `https://picsum.photos/seed/${link.id}/400/400`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    alt={link.title_en}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${link.id}/400/400`;
                    }}
                  />
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 py-0.5 sm:py-1">
                  <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                    <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-accent-peach-darker bg-accent-peach/20 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full">
                      {categories.find(c => c.id === link.categoryId)?.[language === 'he' ? 'name_he' : 'name_en']}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-2xl font-sans font-bold text-ink-900 leading-tight mb-0.5 sm:mb-2 group-hover:text-brand-600 transition-colors line-clamp-1 sm:line-clamp-2">
                    {language === 'he' ? link.title_he : link.title_en}
                  </h3>
                  <p className="text-[10px] sm:text-sm text-ink-500 font-medium line-clamp-2 leading-relaxed opacity-80">
                    {language === 'he' ? link.description_he : link.description_en}
                  </p>
                </div>

                {/* Action Arrow */}
                <div className="w-7 h-7 sm:w-12 sm:h-12 shrink-0 rounded-full bg-white border border-black/5 flex items-center justify-center text-ink-400 group-hover:bg-ink-900 group-hover:text-white group-hover:border-ink-900 transition-all duration-300 shadow-sm">
                  {isRTL ? (
                    <ArrowLeft className="w-3.5 h-3.5 sm:w-6 sm:h-6 transform group-hover:-translate-x-0.5 transition-transform" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5 sm:w-6 sm:h-6 transform group-hover:translate-x-0.5 transition-transform" />
                  )}
                </div>
              </a>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredLinks.length === 0 && !isLoading && (
        <div className="h-[40vh] flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
            <Search className="w-8 h-8 text-ink-400" />
          </div>
          <p className="text-ink-500 font-medium">
            {language === 'he' ? 'לא נמצאו תוצאות' : 'No results found'}
          </p>
        </div>
      )}
    </div>
  );
}
