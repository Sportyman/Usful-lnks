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

const Marquee = ({ children, direction = 'left', speed = 20 }: { children: ReactNode, direction?: 'left' | 'right', speed?: number }) => {
  return (
    <div className="flex overflow-hidden whitespace-nowrap mask-linear-fade">
      <motion.div
        initial={{ x: direction === 'left' ? 0 : '-50%' }}
        animate={{ x: direction === 'left' ? '-50%' : 0 }}
        transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
        className="flex gap-8 items-center py-4"
      >
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
    return [...links].sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds).slice(0, 8);
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
      <header className="relative pt-8 pb-12 overflow-hidden">
        {/* Marquee Background */}
        <div className="absolute top-10 left-0 w-full -rotate-2 opacity-5 pointer-events-none select-none">
          <Marquee speed={40}>
            <span className="text-9xl font-black uppercase mx-8">DIGITAL GIFTS</span>
            <span className="text-9xl font-black uppercase mx-8">TOOLS</span>
            <span className="text-9xl font-black uppercase mx-8">AI</span>
            <span className="text-9xl font-black uppercase mx-8">CREATIVE</span>
          </Marquee>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex justify-between items-center mb-12">
             <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-black rounded-full animate-pulse" />
                <span className="font-mono text-xs font-bold uppercase tracking-widest">
                  {language === 'he' ? 'גרסה 2.0' : 'v2.0 Live'}
                </span>
             </div>
             {selectedCategory && (
               <button 
                 onClick={handleBackToHome}
                 className="group flex items-center gap-2 px-4 py-2 bg-white border-2 border-black rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-bold text-sm"
               >
                 <X className="w-4 h-4" />
                 {language === 'he' ? 'סגור קטגוריה' : 'Close Category'}
               </button>
             )}
          </div>

          <motion.h1 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-[0.9] mb-6 max-w-4xl"
          >
            {selectedCategory ? (
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-black to-gray-600">
                {language === 'he' ? selectedCategory.name_he : selectedCategory.name_en}
              </span>
            ) : (
              <>
                {language === 'he' ? 'גלה את' : 'Discover'} <br/>
                <span className="text-[#FF6B6B] inline-block transform hover:rotate-2 transition-transform cursor-default">
                  {language === 'he' ? 'הדיגיטל' : 'Digital'}
                </span> <br/>
                {language === 'he' ? 'הבא שלך' : 'Gems'}
              </>
            )}
          </motion.h1>

          {!selectedCategory && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xl md:text-2xl font-medium text-ink-600 max-w-xl leading-relaxed mb-8"
            >
              {language === 'he' 
                ? 'אוסף אצור של הכלים, המתנות והמשאבים השווים ביותר ברשת. נבחר בקפידה, רק בשבילך.'
                : 'A curated collection of the best tools, gifts, and resources on the web. Hand-picked, just for you.'}
            </motion.p>
          )}

          {/* Search Bar */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="relative max-w-md"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'he' ? 'חפש משהו מגניב...' : 'Search for something cool...'}
              className="w-full px-6 py-4 bg-white border-2 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:translate-y-[2px] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all text-lg font-bold placeholder:font-normal placeholder:text-gray-400"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#FFD23F] rounded-xl border-2 border-black flex items-center justify-center">
              <Search className="w-5 h-5 text-black" />
            </div>
          </motion.div>
        </div>
      </header>

      {/* --- CONTENT AREA --- */}
      <div className="container mx-auto px-4">
        <AnimatePresence mode="wait">
          {!selectedCategoryId ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-20"
            >
              {/* NEW ARRIVALS TICKER */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-black text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest animate-pulse">
                    {language === 'he' ? 'חדש!' : 'FRESH DROPS'}
                  </div>
                  <div className="h-0.5 flex-1 bg-black/10" />
                </div>
                
                <div className="-mx-4 overflow-hidden py-4">
                  <Marquee speed={60}>
                    {newLinks.map((link) => (
                      <a 
                        key={link.id}
                        href={`/redirect/${link.id}?to=${encodeURIComponent(link.targetUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative block w-72 h-80 bg-white border-2 border-black rounded-3xl overflow-hidden mx-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                      >
                        <div className="h-48 overflow-hidden border-b-2 border-black relative">
                          <img 
                            src={link.imageUrl || `https://picsum.photos/seed/${link.id}/400/300`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            alt=""
                          />
                          <div className="absolute top-3 right-3 bg-[#FF6B6B] text-white text-[10px] font-black uppercase px-2 py-1 rounded border border-black transform rotate-3">
                            NEW
                          </div>
                        </div>
                        <div className="p-5">
                          <h3 className="font-black text-xl leading-tight mb-2 line-clamp-2">
                            {language === 'he' ? link.title_he : link.title_en}
                          </h3>
                          <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                            <span className="w-2 h-2 bg-[#4ECDC4] rounded-full" />
                            {categories.find(c => c.id === link.categoryId)?.[language === 'he' ? 'name_he' : 'name_en']}
                          </div>
                        </div>
                      </a>
                    ))}
                  </Marquee>
                </div>
              </section>

              {/* CATEGORIES BENTO GRID */}
              <section>
                <div className="flex items-center gap-3 mb-8">
                  <h2 className="text-3xl font-black uppercase italic">
                    {language === 'he' ? 'קטגוריות' : 'Categories'}
                  </h2>
                  <div className="h-0.5 flex-1 bg-black" />
                  <Zap className="w-6 h-6 fill-black" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[200px]">
                  {categories.map((cat, i) => {
                    // Make some cards span 2 columns or rows for visual interest
                    const isLarge = i === 0 || i === 5; 
                    const isTall = i === 2;
                    
                    return (
                      <div key={cat.id} className={cn(isLarge ? "md:col-span-2" : "", isTall ? "md:row-span-2" : "")}>
                        <BentoCard
                          onClick={() => handleCategoryClick(cat.id)}
                          delay={i * 0.05}
                          className={cn(
                            bentoColors[i % bentoColors.length],
                            "h-full flex flex-col justify-between group"
                          )}
                        >
                          <div className="flex justify-between items-start">
                            <div className="bg-white/90 backdrop-blur-sm border-2 border-black p-3 rounded-2xl">
                              <Sparkles className="w-6 h-6 text-black" />
                            </div>
                            <div className="bg-black text-white text-xs font-bold px-3 py-1 rounded-full">
                              {links.filter(l => l.categoryId === cat.id).length}
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-3xl font-black uppercase leading-none mb-2 group-hover:translate-x-2 transition-transform">
                              {language === 'he' ? cat.name_he : cat.name_en}
                            </h3>
                            <div className="w-8 h-1 bg-black rounded-full group-hover:w-16 transition-all" />
                          </div>

                          {/* Decorative background pattern */}
                          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      className="group bg-white border-2 border-black rounded-3xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all flex flex-col h-full"
                    >
                      <div className="h-56 overflow-hidden border-b-2 border-black relative bg-gray-100">
                        <img 
                          src={link.imageUrl || `https://picsum.photos/seed/${link.id}/600/400`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          alt=""
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                           <div className="bg-white text-black font-bold px-4 py-2 rounded-full border-2 border-black transform -rotate-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                             {language === 'he' ? 'בקר באתר' : 'VISIT SITE'}
                           </div>
                        </div>
                      </div>
                      
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex flex-wrap gap-2 mb-3">
                          {link.tags?.slice(0, 3).map(tag => (
                            <span key={tag} className="text-[10px] font-bold uppercase tracking-widest bg-gray-100 px-2 py-1 rounded border border-black/10">
                              #{tag}
                            </span>
                          ))}
                        </div>
                        
                        <h3 className="text-2xl font-black leading-tight mb-2 group-hover:underline decoration-2 underline-offset-2">
                          {language === 'he' ? link.title_he : link.title_en}
                        </h3>
                        
                        <p className="text-sm font-medium text-gray-500 line-clamp-3 mb-4 flex-1">
                          {language === 'he' ? link.description_he : link.description_en}
                        </p>

                        <div className="flex items-center justify-between pt-4 border-t-2 border-black/5">
                          <span className="text-xs font-bold text-gray-400">
                             {new Date(link.createdAt?.seconds * 1000).toLocaleDateString()}
                          </span>
                          <ArrowUpRight className="w-5 h-5 text-black group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </div>
                      </div>
                    </motion.a>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center">
                    <div className="inline-block p-6 bg-white border-2 border-black rounded-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-6">
                      <Search className="w-12 h-12 text-black" />
                    </div>
                    <h3 className="text-2xl font-black uppercase mb-2">
                      {language === 'he' ? 'לא נמצאו תוצאות' : 'No Results Found'}
                    </h3>
                    <p className="text-gray-500 font-medium">
                      {language === 'he' ? 'נסה לחפש משהו אחר או חזור לדף הבית' : 'Try searching for something else or go back home'}
                    </p>
                    <button 
                      onClick={handleBackToHome}
                      className="mt-6 px-6 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-colors"
                    >
                      {language === 'he' ? 'נקה חיפוש' : 'Clear Search'}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Decoration */}
      <div className="fixed bottom-0 left-0 w-full h-2 bg-gradient-to-r from-[#FFD23F] via-[#FF6B6B] to-[#4ECDC4]" />
    </div>
  );
}
