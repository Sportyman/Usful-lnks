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
import { ExternalLink, Search, ArrowUpRight, Filter, ArrowLeft, ArrowRight, Folder, Clock, Tag } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '../utils/cn';

export default function HomePage() {
  const { language, isRTL } = useLanguageStore();
  const { links, categories, isLoading, error, fetchData } = useDataStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');

  // Get selected category from URL or state
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
    return [...links].sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds).slice(0, 6);
  }, [links]);

  const handleCategoryClick = (categoryId: string) => {
    setSearchParams({ category: categoryId });
  };

  const handleBackToHome = () => {
    setSearchParams({});
    setSearchQuery('');
  };

  if (error) {
    return <div className="text-center py-20 text-red-500">Error loading data</div>;
  }

  if (isLoading && links.length === 0) {
    return (
      <div className="space-y-12 px-4 sm:px-12 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 px-4 sm:px-12 pt-8 sm:pt-12 space-y-8 sm:space-y-12">
      
      {/* Header / Navigation */}
      <header className="flex items-center justify-between">
        {selectedCategory ? (
          <button 
            onClick={handleBackToHome}
            className="flex items-center gap-2 text-ink-500 hover:text-ink-900 transition-colors group"
          >
            {isRTL ? <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /> : <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />}
            <span className="font-bold uppercase tracking-widest text-xs">{language === 'he' ? 'חזרה לראשי' : 'Back to Home'}</span>
          </button>
        ) : (
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-4xl font-sans font-extrabold tracking-tighter uppercase italic text-ink-900"
          >
            {language === 'he' ? 'גילוי' : 'DISCOVER'}
          </motion.h1>
        )}
      </header>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {!selectedCategoryId ? (
          /* HOME VIEW: Categories & New Items */
          <motion.div 
            key="home"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-12"
          >
            {/* Categories Grid */}
            <section>
              <h2 className="text-sm font-bold uppercase tracking-widest text-ink-400 mb-4 flex items-center gap-2">
                <Folder className="w-4 h-4" />
                {language === 'he' ? 'קטגוריות' : 'Categories'}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {categories.map((cat, index) => (
                  <motion.button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative bg-white hover:bg-gray-50 border border-black/5 hover:border-ink-900/20 p-6 rounded-3xl text-left transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col justify-between h-40 sm:h-48"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-accent-peach/20 group-hover:text-accent-peach-darker transition-colors">
                      <Folder className="w-5 h-5 text-ink-400 group-hover:text-accent-peach-darker" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg sm:text-xl text-ink-900 leading-tight group-hover:text-brand-600 transition-colors">
                        {language === 'he' ? cat.name_he : cat.name_en}
                      </h3>
                      <p className="text-[10px] font-mono text-ink-400 uppercase tracking-widest mt-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        {links.filter(l => l.categoryId === cat.id).length} {language === 'he' ? 'פריטים' : 'Items'}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </section>

            {/* New Arrivals */}
            <section>
              <h2 className="text-sm font-bold uppercase tracking-widest text-ink-400 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {language === 'he' ? 'חדש באתר' : 'New Arrivals'}
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-6 hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
                {newLinks.map((link, index) => (
                  <a 
                    key={link.id}
                    href={`/redirect/${link.id}?to=${encodeURIComponent(link.targetUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="snap-center shrink-0 w-64 sm:w-72 bg-white rounded-2xl border border-black/5 overflow-hidden hover:shadow-md transition-all group"
                  >
                    <div className="h-32 bg-gray-100 relative overflow-hidden">
                      <img 
                        src={link.imageUrl || `https://picsum.photos/seed/${link.id}/400/200`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        alt=""
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${link.id}/400/200`;
                        }}
                      />
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest text-ink-900 border border-black/5">
                        {language === 'he' ? 'חדש' : 'New'}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-ink-900 truncate mb-1 group-hover:text-brand-600 transition-colors">
                        {language === 'he' ? link.title_he : link.title_en}
                      </h3>
                      <p className="text-xs text-ink-500 line-clamp-2 mb-3">
                        {language === 'he' ? link.description_he : link.description_en}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-ink-400">
                        <span className="bg-gray-100 px-1.5 py-0.5 rounded-md">
                          {categories.find(c => c.id === link.categoryId)?.[language === 'he' ? 'name_he' : 'name_en']}
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          </motion.div>
        ) : (
          /* CATEGORY VIEW: List of Links */
          <motion.div
            key="category"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-black/5 pb-6">
              <div>
                <h2 className="text-3xl sm:text-5xl font-serif italic font-bold text-ink-900 mb-2">
                  {language === 'he' ? selectedCategory?.name_he : selectedCategory?.name_en}
                </h2>
                <p className="text-sm text-ink-500 max-w-md">
                  {language === 'he' 
                    ? `צפייה בכל ${filteredLinks.length} הפריטים בקטגוריה זו` 
                    : `Viewing all ${filteredLinks.length} items in this category`}
                </p>
              </div>
              
              {/* Search within category */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={language === 'he' ? 'חיפוש בקטגוריה...' : 'Search in category...'}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-ink-900 text-sm"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              </div>
            </div>

            <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4 pb-12">
              {filteredLinks.length > 0 ? (
                filteredLinks.map((link, index) => (
                  <motion.div
                    key={link.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <a 
                      href={`/redirect/${link.id}?to=${encodeURIComponent(link.targetUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative block bg-white hover:bg-gray-50 rounded-xl sm:rounded-[2rem] p-2 sm:p-4 flex items-start sm:items-center gap-3 sm:gap-6 cursor-pointer border border-black/5 shadow-sm hover:shadow-md transition-all duration-300 w-full"
                    >
                      {/* Thumbnail Image */}
                      <div className="w-20 h-20 sm:w-32 sm:h-32 shrink-0 rounded-lg sm:rounded-[1.5rem] overflow-hidden bg-gray-100 relative mt-1 sm:mt-0">
                        <img 
                          src={link.imageUrl || `https://picsum.photos/seed/${link.id}/400/400`}
                          className="w-full h-full object-contain p-2 sm:p-4 transition-transform duration-500 group-hover:scale-110"
                          alt={link.title_en}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${link.id}/400/400`;
                            (e.target as HTMLImageElement).className = "w-full h-full object-cover"; // Fallback to cover for placeholder
                          }}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 py-0.5 sm:py-1">
                        <h3 className="text-base sm:text-2xl font-sans font-bold text-ink-900 leading-tight mb-1 sm:mb-2 group-hover:text-brand-600 transition-colors line-clamp-2">
                          {language === 'he' ? link.title_he : link.title_en}
                        </h3>
                        <p className="text-xs sm:text-sm text-ink-500 font-medium line-clamp-2 leading-relaxed opacity-80 mb-2 sm:mb-3">
                          {language === 'he' ? link.description_he : link.description_en}
                        </p>
                        
                        {/* Tags */}
                        {link.tags && link.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {link.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-[9px] sm:text-[10px] font-bold text-ink-600 border border-black/5">
                                <Tag className="w-2.5 h-2.5 opacity-50" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Action Arrow */}
                      <div className="hidden sm:flex w-12 h-12 shrink-0 rounded-full bg-white border border-black/5 items-center justify-center text-ink-400 group-hover:bg-ink-900 group-hover:text-white group-hover:border-ink-900 transition-all duration-300 shadow-sm self-center">
                        {isRTL ? (
                          <ArrowLeft className="w-6 h-6 transform group-hover:-translate-x-0.5 transition-transform" />
                        ) : (
                          <ArrowRight className="w-6 h-6 transform group-hover:translate-x-0.5 transition-transform" />
                        )}
                      </div>
                    </a>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-6 h-6 text-ink-400" />
                  </div>
                  <p className="text-ink-500">
                    {language === 'he' ? 'לא נמצאו פריטים בקטגוריה זו' : 'No items found in this category'}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
