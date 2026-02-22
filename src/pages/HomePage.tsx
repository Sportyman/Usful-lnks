/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useMemo, useRef, ReactNode } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { useLanguageStore } from '../store/languageStore';
import { useDataStore } from '../store/dataStore';
import { Button } from '../components/ui/Button';
import { ExternalLink, Search, ArrowUpRight, Sparkles, Zap, Flame, ArrowLeft, ArrowRight, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '../utils/cn';

// --- Components ---

const Marquee = ({ children, direction = 'left', speed = 30 }: { children: ReactNode, direction?: 'left' | 'right', speed?: number }) => {
  return (
    <div className="flex overflow-hidden whitespace-nowrap mask-linear-fade w-full">
      <motion.div
        initial={{ x: direction === 'left' ? 0 : '-50%' }}
        animate={{ x: direction === 'left' ? '-50%' : 0 }}
        transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
        className="flex gap-6 items-center py-4 min-w-full"
      >
        {children}
        {children}
        {children}
        {children}
        {children}
        {children}
      </motion.div>
    </div>
  );
};

const BentoCard = ({ 
  children, 
  className, 
  onClick, 
  delay = 0 
}: { 
  children: ReactNode, 
  className?: string, 
  onClick?: () => void,
  delay?: number 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.4, delay }}
    whileHover={{ scale: 1.02, rotate: Math.random() * 2 - 1 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={cn(
      "relative overflow-hidden rounded-3xl p-6 cursor-pointer transition-shadow hover:shadow-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
      className
    )}
  >
    {children}
  </motion.div>
);

export default function HomePage() {
  const { language, isRTL } = useLanguageStore();
  const { links, categories, isLoading, error, fetchData } = useDataStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);

  // Get selected category from URL
  const selectedCategoryId = searchParams.get('category');
  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredLinks = useMemo(() => {
    return links.filter(link => {
      const matchesCategory = !selectedCategoryId || link.categoryId === selectedCategoryId;
      const title = language === 'he' ? link.title_he : link.title_en;
      const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [links, selectedCategoryId, searchQuery, language]);

  const newLinks = useMemo(() => {
    // Ensure we have enough items for the marquee by duplicating if necessary
    const sorted = [...links].sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds).slice(0, 8);
    if (sorted.length === 0) return [];
    // If we have very few items, duplicate them to ensure smooth marquee
    return sorted.length < 4 ? [...sorted, ...sorted, ...sorted, ...sorted] : sorted;
  }, [links]);

  const handleCategoryClick = (categoryId: string) => {
    setSearchParams({ category: categoryId });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToHome = () => {
    setSearchParams({});
    setSearchQuery('');
  };

  // Colors for Bento Grid (cycling)
  const bentoColors = [
    "bg-[#FFD23F]", // Yellow
    "bg-[#FF6B6B]", // Red
    "bg-[#4ECDC4]", // Teal
    "bg-[#9D4EDD]", // Purple
    "bg-[#F7FFF7]", // White/Mint
    "bg-[#FF9F1C]", // Orange
  ];

  if (isLoading && links.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-soft">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin" />
          <p className="font-mono font-bold uppercase tracking-widest animate-pulse">Loading Assets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F3F0] text-ink-900 pb-20 overflow-x-hidden font-sans selection:bg-black selection:text-white" ref={containerRef}>
      
      {/* --- HERO SECTION --- */}
      <header className="relative pt-8 pb-8 md:pt-16 md:pb-12 overflow-hidden">
        {/* Marquee Background */}
        <div className="absolute top-10 left-0 w-full -rotate-1 opacity-[0.03] pointer-events-none select-none">
          <Marquee speed={30}>
            <span className="text-[6rem] md:text-[10rem] font-black uppercase mx-4 md:mx-8">DIGITAL.GIFTS</span>
            <span className="text-[6rem] md:text-[10rem] font-black uppercase mx-4 md:mx-8">COLLECTION</span>
            <span className="text-[6rem] md:text-[10rem] font-black uppercase mx-4 md:mx-8">2026</span>
          </Marquee>
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 mb-6 bg-white/50 backdrop-blur-sm px-4 py-1.5 rounded-full border border-black/5 shadow-sm">
             <div className="w-2 h-2 bg-[#FF6B6B] rounded-full animate-pulse" />
             <span className="font-mono text-[10px] font-bold uppercase tracking-widest">
               {language === 'he' ? 'האוסף האולטימטיבי' : 'The Ultimate Collection'}
             </span>
          </div>

          <motion.h1 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-5xl sm:text-7xl md:text-9xl font-black tracking-tighter uppercase leading-[0.9] mb-6 break-words"
          >
            {selectedCategory ? (
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-black to-gray-600">
                {language === 'he' ? selectedCategory.name_he : selectedCategory.name_en}
              </span>
            ) : (
              <>
                DIGITAL<span className="text-[#FF6B6B]">.</span>GIFTS
              </>
            )}
          </motion.h1>

          {!selectedCategory && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-base md:text-xl font-medium text-ink-500 max-w-lg mx-auto leading-relaxed mb-8 px-4"
            >
              {language === 'he' 
                ? 'האוסף האולטימטיבי של כלים, מתנות ומשאבים דיגיטליים.'
                : 'The ultimate collection of digital tools, gifts, and resources.'}
            </motion.p>
          )}

          {/* Search Bar */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="relative max-w-md mx-auto px-4"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'he' ? 'חפש...' : 'Search...'}
              className="w-full px-6 py-3.5 bg-white border-2 border-black rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:translate-y-[2px] focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all text-base font-bold placeholder:font-normal placeholder:text-gray-400 text-center"
            />
            <div className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#FFD23F] rounded-full border-2 border-black flex items-center justify-center pointer-events-none">
              <Search className="w-4 h-4 text-black" />
            </div>
          </motion.div>
        </div>
      </header>

      {/* --- CONTENT AREA --- */}
      <div className="container mx-auto px-4 max-w-6xl">
        <AnimatePresence mode="wait">
          {!selectedCategoryId ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {/* NEW ARRIVALS TICKER */}
              <section>
                <div className="flex items-center gap-3 mb-4 px-2">
                  <div className="bg-black text-white px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(100,100,100,1)]">
                    {language === 'he' ? 'חדש!' : 'FRESH'}
                  </div>
                  <div className="h-0.5 flex-1 bg-black/5" />
                </div>
                
                <div className="-mx-4 overflow-hidden py-2">
                  <Marquee speed={40}>
                    {(newLinks.length > 0 ? newLinks : Array(6).fill(null)).map((link, i) => (
                      link ? (
                        <a 
                          key={`${link.id}-${i}`}
                          href={`/redirect/${link.id}?to=${encodeURIComponent(link.targetUrl)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative block w-56 h-64 bg-white border-2 border-black rounded-2xl overflow-hidden mx-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all shrink-0"
                        >
                          <div className="h-36 overflow-hidden border-b-2 border-black relative bg-gray-50">
                            <img 
                              src={link.imageUrl || `https://picsum.photos/seed/${link.id}/300/200`}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              alt=""
                            />
                          </div>
                          <div className="p-3 text-start">
                            <h3 className="font-bold text-sm leading-tight mb-1 line-clamp-2">
                              {language === 'he' ? link.title_he : link.title_en}
                            </h3>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                              <span className="w-1.5 h-1.5 bg-[#4ECDC4] rounded-full" />
                              {categories.find(c => c.id === link.categoryId)?.[language === 'he' ? 'name_he' : 'name_en']}
                            </div>
                          </div>
                        </a>
                      ) : (
                        // Skeleton for empty state
                        <div key={i} className="w-56 h-64 bg-gray-100 border-2 border-black/10 rounded-2xl mx-3 shrink-0 animate-pulse" />
                      )
                    ))}
                  </Marquee>
                </div>
              </section>

              {/* CATEGORIES BENTO GRID */}
              <section>
                <div className="flex items-center gap-3 mb-6 px-2">
                  <h2 className="text-xl font-black uppercase italic">
                    {language === 'he' ? 'קטגוריות' : 'Categories'}
                  </h2>
                  <div className="h-0.5 flex-1 bg-black/5" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[140px]">
                  {categories.map((cat, i) => {
                    // Simplified grid logic - less chaotic, more usable
                    const isWide = i === 0 || i === 3; 
                    
                    return (
                      <div key={cat.id} className={cn(isWide ? "col-span-2" : "col-span-1")}>
                        <BentoCard
                          onClick={() => handleCategoryClick(cat.id)}
                          delay={i * 0.05}
                          className={cn(
                            bentoColors[i % bentoColors.length],
                            "h-full flex flex-col justify-between group !p-4 !rounded-2xl !shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:!shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]"
                          )}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="bg-white/90 backdrop-blur-sm border border-black p-1.5 rounded-lg">
                              <Sparkles className="w-3 h-3 text-black" />
                            </div>
                            <div className="bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {links.filter(l => l.categoryId === cat.id).length}
                            </div>
                          </div>
                          
                          <div className="text-start relative z-10">
                            <h3 className="text-lg md:text-xl font-black uppercase leading-none mb-1 group-hover:translate-x-1 transition-transform">
                              {language === 'he' ? cat.name_he : cat.name_en}
                            </h3>
                            <div className="w-4 h-0.5 bg-black rounded-full group-hover:w-8 transition-all" />
                          </div>

                          {/* Decorative background pattern */}
                          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />
                        </BentoCard>
                      </div>
                    );
                  })}
                </div>
              </section>
            </motion.div>
          ) : (
            /* SELECTED CATEGORY VIEW */
            <motion.div
              key="category-view"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="pb-20"
            >
              <div className="flex justify-between items-center mb-6">
                 <button 
                   onClick={handleBackToHome}
                   className="flex items-center gap-2 text-sm font-bold hover:underline"
                 >
                   <ArrowRight className="w-4 h-4 rotate-180" />
                   {language === 'he' ? 'חזרה' : 'Back'}
                 </button>
                 <div className="text-sm font-medium text-gray-500">
                   {filteredLinks.length} {language === 'he' ? 'תוצאות' : 'Results'}
                 </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLinks.length > 0 ? (
                  filteredLinks.map((link, index) => (
                    <motion.a
                      key={link.id}
                      href={`/redirect/${link.id}?to=${encodeURIComponent(link.targetUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group bg-white border-2 border-black rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex flex-col h-full"
                    >
                      <div className="h-40 overflow-hidden border-b-2 border-black relative bg-gray-100">
                        <img 
                          src={link.imageUrl || `https://picsum.photos/seed/${link.id}/600/400`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          alt=""
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                           <div className="bg-white text-black font-bold px-3 py-1 rounded-full border border-black transform -rotate-2 shadow-sm text-xs">
                             {language === 'he' ? 'בקר באתר' : 'VISIT'}
                           </div>
                        </div>
                      </div>
                      
                      <div className="p-4 flex-1 flex flex-col text-start">
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {link.tags?.slice(0, 3).map(tag => (
                            <span key={tag} className="text-[9px] font-bold uppercase tracking-widest bg-gray-100 px-1.5 py-0.5 rounded border border-black/10">
                              #{tag}
                            </span>
                          ))}
                        </div>
                        
                        <h3 className="text-lg font-black leading-tight mb-1 group-hover:underline decoration-2 underline-offset-2">
                          {language === 'he' ? link.title_he : link.title_en}
                        </h3>
                        
                        <p className="text-xs font-medium text-gray-500 line-clamp-2 mb-3 flex-1">
                          {language === 'he' ? link.description_he : link.description_en}
                        </p>

                        <div className="flex items-center justify-between pt-3 border-t border-black/5">
                          <span className="text-[10px] font-bold text-gray-400">
                             {new Date(link.createdAt?.seconds * 1000).toLocaleDateString()}
                          </span>
                          <ArrowUpRight className="w-4 h-4 text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </div>
                      </div>
                    </motion.a>
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center">
                    <div className="inline-block p-4 bg-white border-2 border-black rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4">
                      <Search className="w-8 h-8 text-black" />
                    </div>
                    <h3 className="text-lg font-black uppercase mb-1">
                      {language === 'he' ? 'לא נמצאו תוצאות' : 'No Results Found'}
                    </h3>
                    <p className="text-sm text-gray-500 font-medium">
                      {language === 'he' ? 'נסה לחפש משהו אחר' : 'Try searching for something else'}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Decoration */}
      <div className="fixed bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#FFD23F] via-[#FF6B6B] to-[#4ECDC4]" />
    </div>
  );
}
