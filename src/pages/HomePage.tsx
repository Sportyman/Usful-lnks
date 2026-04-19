/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useMemo, useRef, ReactNode } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useAnimationFrame } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { useLanguageStore } from '../store/languageStore';
import { useDataStore } from '../store/dataStore';
import { useDebugStore } from '../store/debugStore';
import { Button } from '../components/ui/Button';
import { 
  ExternalLink, Search, ArrowUpRight, Sparkles, Zap, Flame, ArrowLeft, ArrowRight, X, LayoutGrid, Share2, Info
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '../utils/cn';
import { toast } from 'sonner';
import { Link } from '../types';
import { Modal } from '../components/ui/Modal';
import { geminiService } from '../services/geminiService';
import { useDebounce } from '../hooks/useDebounce';

// --- Components ---

/**
 * A high-performance, seamless infinite marquee.
 * Optimized for RTL (Right to Left) flow.
 * Ensures no empty space and starts immediately.
 */
const DraggableMarquee = ({ children }: { children: ReactNode }) => {
  const addLog = useDebugStore(state => state.addLog);
  const x = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [itemWidth, setItemWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const hasInitialized = useRef(false);

  // Measure the content width for the loop jump
  useEffect(() => {
    const measure = () => {
      if (contentRef.current) {
        const width = contentRef.current.offsetWidth;
        if (width > 0 && width !== itemWidth) {
          setItemWidth(width);
          // Initialize position to the middle copy to allow dragging in both directions
          if (!hasInitialized.current) {
            x.set(-width * 2);
            hasInitialized.current = true;
          }
        }
      }
    };

    const observer = new ResizeObserver(measure);
    if (contentRef.current) observer.observe(contentRef.current);
    measure();
    return () => observer.disconnect();
  }, [itemWidth, children, x]);

  useAnimationFrame((_t, delta) => {
    if (isDragging || itemWidth === 0) return;

    // Speed in pixels per second
    const speed = 35; 
    
    // Move left (negative X) to create "Right to Left" flow
    const moveBy = (delta / 1000) * speed * -1;
    
    let nextX = x.get() + moveBy;
    
    // Seamless jump: keep x between -itemWidth * 3 and -itemWidth * 2
    if (nextX <= -itemWidth * 3) {
      nextX += itemWidth;
    }
    
    x.set(nextX);
  });

  return (
    <div 
      className="w-full overflow-hidden py-2 cursor-grab active:cursor-grabbing select-none" 
      dir="ltr" /* Force LTR for stable marquee logic */
    >
      <motion.div
        ref={containerRef}
        style={{ x }}
        drag="x"
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
        onUpdate={(latest) => {
          if (!isDragging || !itemWidth) return;
          const currentX = latest.x as number;
          
          // Seamless dragging wrap
          // We keep the position between -itemWidth * 3 and -itemWidth
          // This ensures there's always content on both sides (we have 5 copies total)
          let nextX = currentX;
          while (nextX <= -itemWidth * 3) nextX += itemWidth;
          while (nextX > -itemWidth) nextX -= itemWidth;
          
          if (nextX !== currentX) {
            x.set(nextX);
          }
        }}
        className="flex"
      >
        {/* 5 copies ensure that even on 4K screens there is never a gap and dragging is smooth */}
        <div ref={contentRef} className="flex gap-4 pr-4 shrink-0">
          {children}
        </div>
        <div className="flex gap-4 pr-4 shrink-0">
          {children}
        </div>
        <div className="flex gap-4 pr-4 shrink-0">
          {children}
        </div>
        <div className="flex gap-4 pr-4 shrink-0">
          {children}
        </div>
        <div className="flex gap-4 pr-4 shrink-0">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

const BentoCard = ({ 
  children, 
  className, 
  onClick, 
  delay = 0,
  imageUrl,
  imageFit = 'cover',
  imageZoom = 100,
  textAlign = 'right',
  isComingSoon = false,
  style = {}
}: { 
  children: ReactNode, 
  className?: string, 
  onClick?: () => void,
  delay?: number,
  imageUrl?: string,
  imageFit?: 'cover' | 'contain' | 'fill',
  imageZoom?: number,
  textAlign?: 'left' | 'center' | 'right',
  isComingSoon?: boolean,
  style?: React.CSSProperties
}) => {
  // Handle legacy data where zoom might be 1.0 instead of 100
  const effectiveZoom = imageZoom < 10 ? imageZoom * 100 : imageZoom;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ 
        scale: 1.02, 
        y: -5,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden p-6 cursor-pointer transition-all duration-300 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]",
        className
      )}
      style={{ borderRadius: 'var(--global-radius, 24px)', ...style }}
    >
      {/* Background Image with Parallax-like effect on hover */}
      {imageUrl && (
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
          <motion.img 
            src={imageUrl} 
            alt="" 
            style={{ 
              objectFit: imageFit,
            }}
            initial={{ scale: effectiveZoom / 100 }}
            whileHover={{ scale: (effectiveZoom / 100) * 1.1 }}
            transition={{ duration: 0.6 }}
            className="w-full h-full opacity-80 transition-opacity duration-300 group-hover:opacity-100" 
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent group-hover:via-black/20 transition-colors duration-300" />
        </div>
      )}
      
      {/* Floating Sparkles/Particles (Decorative) */}
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute top-4 right-10 w-1 h-1 bg-white rounded-full animate-ping" />
        <div className="absolute bottom-10 left-4 w-1.5 h-1.5 bg-white/50 rounded-full animate-pulse" />
      </div>

      {isComingSoon && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-red-600/95 backdrop-blur-md text-white text-[14px] font-black uppercase tracking-[0.2em] py-3 px-8 border-2 border-white shadow-[0_0_20px_rgba(220,38,38,0.5)] -rotate-12"
          >
            {useLanguageStore.getState().language === 'he' ? 'בקרוב' : 'COMING SOON'}
          </motion.div>
        </div>
      )}

      <div className={cn(
        "relative z-10 h-full flex flex-col justify-between text-white drop-shadow-lg",
        textAlign === 'left' ? "text-left items-start" : 
        textAlign === 'center' ? "text-center items-center" : 
        "text-right items-end"
      )}>
         {children}
      </div>
    </motion.div>
  );
};

export default function HomePage() {
  const language = useLanguageStore(state => state.language);
  const isRTL = useLanguageStore(state => state.isRTL);
  const { links, categories, settings, isLoading, error, fetchData } = useDataStore();
  const addLog = useDebugStore(state => state.addLog);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 600);
  const [semanticLinkIds, setSemanticLinkIds] = useState<string[]>([]);
  const [isSearchingAI, setIsSearchingAI] = useState(false);
  const [selectedLink, setSelectedLink] = useState<Link | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Apply global styles
  useEffect(() => {
    if (settings) {
      document.documentElement.style.setProperty('--primary-color', settings.primaryColor || '#FFD23F');
      document.documentElement.style.setProperty('--secondary-color', settings.secondaryColor || '#F27D26');
      document.documentElement.style.setProperty('--global-radius', settings.borderRadius || '24px');
      document.body.style.fontFamily = settings.fontFamily || 'Inter';
    }
  }, [settings]);

  // Get selected category from URL
  const selectedCategoryId = searchParams.get('category');
  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  useEffect(() => {
    addLog('info', 'HomePage mounted, fetching data');
    fetchData();
  }, [fetchData, addLog]);

  useEffect(() => {
    if (error) {
      addLog('error', 'Data fetching error', { error });
    }
  }, [error, addLog]);

  useEffect(() => {
    addLog('debug', 'Language/RTL changed', { language, isRTL });
  }, [language, isRTL, addLog]);

  useEffect(() => {
    const performSemanticSearch = async () => {
      if (!debouncedSearchQuery || debouncedSearchQuery.length < 3) {
        setSemanticLinkIds([]);
        return;
      }

      setIsSearchingAI(true);
      try {
        const results = await geminiService.semanticSearch(debouncedSearchQuery, links, language);
        setSemanticLinkIds(results);
      } catch (err) {
        console.error('Semantic search failed:', err);
      } finally {
        setIsSearchingAI(false);
      }
    };

    performSemanticSearch();
  }, [debouncedSearchQuery, links, language]);

  const filteredLinks = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    
    // 1. Keyword Matches
    const keywordResults = links.filter(link => {
      const matchesCategory = !selectedCategoryId || link.categoryId === selectedCategoryId;
      
      if (!query) return matchesCategory;

      const title = (language === 'he' ? link.title_he : link.title_en) || '';
      const subtitle = (language === 'he' ? link.subtitle_he : link.subtitle_en) || '';
      const description = (language === 'he' ? link.description_he : link.description_en) || '';
      const tags = (link.tags || []).join(' ');
      const catName = categories.find(c => c.id === link.categoryId)?.[language === 'he' ? 'name_he' : 'name_en'] || '';

      const searchTarget = `${title} ${subtitle} ${description} ${tags} ${catName}`.toLowerCase();
      return searchTarget.includes(query);
    });

    // 2. Semantic Matches (IDs returned by Gemini)
    const semanticResults = links.filter(link => 
      semanticLinkIds.includes(link.id) && !keywordResults.some(kl => kl.id === link.id)
    );

    // Combine and sort
    const combined = [...keywordResults, ...semanticResults];
    
    if (query) {
      // If searching, keep them sorted by relevance (keywords first, then semantic)
      // or just by date for now.
      return combined;
    }

    // Sort by date descending for standard view
    return combined.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [links, selectedCategoryId, searchQuery, language, categories, semanticLinkIds]);

  // Group links by month/year for the category view
  const groupedLinks = useMemo(() => {
    if (!selectedCategoryId) return null;

    const groups: { [key: string]: typeof filteredLinks } = {};
    
    filteredLinks.forEach(link => {
      if (!link.createdAt) return;
      const date = new Date(link.createdAt.seconds * 1000);
      const month = date.toLocaleString(language === 'he' ? 'he-IL' : 'en-US', { month: 'long' });
      const year = date.getFullYear();
      const key = `${month} ${year}`;
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(link);
    });

    return groups;
  }, [filteredLinks, selectedCategoryId, language]);

  const newLinks = useMemo(() => {
    // Get the latest 10 items
    const sorted = [...links]
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      .slice(0, 10);
      
    if (sorted.length === 0) return [];
    
    // Ensure we have at least 12 items to fill the screen and allow seamless looping
    let displayLinks = [...sorted];
    while (displayLinks.length < 12) {
      displayLinks = [...displayLinks, ...sorted];
    }
    
    return displayLinks;
  }, [links]);

  // Log newLinks generation in a safe place
  useEffect(() => {
    if (newLinks.length > 0) {
      addLog('debug', 'Generated newLinks for marquee', { count: newLinks.length });
    }
  }, [newLinks.length, addLog]);

  // Smart Grid Layout Logic
  const smartCategories = useMemo(() => {
    if (!categories.length) return [];
    
    // 1. Sort: Active categories first, then by link count
    const sorted = [...categories].sort((a, b) => {
      // Coming soon always goes last
      if (a.isComingSoon && !b.isComingSoon) return 1;
      if (!a.isComingSoon && b.isComingSoon) return -1;
      
      // Then by link count (more links = more important)
      const countA = links.filter(l => l.categoryId === a.id).length;
      const countB = links.filter(l => l.categoryId === b.id).length;
      return countB - countA;
    });

    // 2. Define patterns based on count
    const count = sorted.length;
    let pattern: { class: string, size: string }[] = [];

    if (count === 1) {
      pattern = [{ class: "md:col-span-4 md:row-span-2", size: 'huge' }];
    } else if (count === 2) {
      pattern = [
        { class: "md:col-span-2 md:row-span-2", size: 'square' },
        { class: "md:col-span-2 md:row-span-2", size: 'square' }
      ];
    } else if (count === 3) {
      pattern = [
        { class: "md:col-span-2 md:row-span-2", size: 'square' }, // Big featured
        { class: "md:col-span-2 md:row-span-1", size: 'wide' },   // Side top
        { class: "md:col-span-2 md:row-span-1", size: 'wide' },   // Side bottom
      ];
    } else {
      // Standard Bento for 4+ items
      pattern = [
        { class: "md:col-span-2 md:row-span-2", size: 'square' },
        { class: "md:col-span-1 md:row-span-1", size: 'square' },
        { class: "md:col-span-1 md:row-span-1", size: 'square' },
        { class: "md:col-span-2 md:row-span-1", size: 'wide' },
        { class: "md:col-span-1 md:row-span-2", size: 'tall' },
        { class: "md:col-span-1 md:row-span-1", size: 'square' },
        { class: "md:col-span-1 md:row-span-1", size: 'square' },
        { class: "md:col-span-2 md:row-span-1", size: 'wide' },
      ];
    }

    return sorted.map((cat, i) => ({
      ...cat,
      gridClass: pattern[i % pattern.length]?.class || "md:col-span-1 md:row-span-1"
    }));
  }, [categories, links]);

  const handleCategoryClick = (categoryId: string) => {
    setSearchParams({ category: categoryId });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToHome = () => {
    setSearchParams({});
    setSearchQuery('');
  };

  const handleShare = (link: Link) => {
    const slug = link.customSlug || link.id;
    const shareUrl = `${window.location.origin}/go/${slug}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success(language === 'he' ? 'הקישור הועתק לשיתוף!' : 'Link copied for sharing!');
  };

  const handleLinkClick = (link: Link) => {
    setSelectedLink(link);
  };

  // Colors for Bento Grid (cycling)
  const bentoColors = [
    "bg-primary", // Yellow (Primary)
    "bg-secondary", // Orange (Secondary)
    "bg-[#FF6B6B]", // Red
    "bg-[#4ECDC4]", // Teal
    "bg-[#9D4EDD]", // Purple
    "bg-[#F7FFF7]", // White/Mint
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
    <div 
      className={cn(
        "min-h-screen bg-[#F4F3F0] text-ink-900 pb-20 overflow-x-hidden font-sans selection:bg-black selection:text-white",
        isRTL ? "text-right" : "text-left"
      )} 
      ref={containerRef}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <Helmet>
        <title>
          {selectedCategory 
            ? (language === 'he' ? (selectedCategory.seoTitle_he || selectedCategory.name_he) : (selectedCategory.seoTitle_en || selectedCategory.name_en))
            : (language === 'he' ? (settings?.siteTitle_he || 'DIGITAL.GIFTS') : (settings?.siteTitle_en || 'DIGITAL.GIFTS'))}
        </title>
        <meta 
          name="description" 
          content={selectedCategory 
            ? (language === 'he' ? (selectedCategory.seoDescription_he || '') : (selectedCategory.seoDescription_en || ''))
            : (language === 'he' ? (settings?.siteDescription_he || 'האוסף האולטימטיבי של כלים דיגיטליים') : (settings?.siteDescription_en || 'The ultimate collection of digital tools'))} 
        />
        <meta 
          name="keywords" 
          content={selectedCategory 
            ? (language === 'he' ? (selectedCategory.seoKeywords_he || '') : (selectedCategory.seoKeywords_en || ''))
            : (language === 'he' ? (settings?.siteKeywords_he || 'מתנות, דיגיטל, כלים') : (settings?.siteKeywords_en || 'gifts, digital, tools'))} 
        />
        
        {/* Open Graph / Social Media */}
        <meta property="og:type" content="website" />
        <meta 
          property="og:title" 
          content={selectedCategory 
            ? (language === 'he' ? (selectedCategory.seoTitle_he || selectedCategory.name_he) : (selectedCategory.seoTitle_en || selectedCategory.name_en))
            : (language === 'he' ? (settings?.siteTitle_he || 'DIGITAL.GIFTS') : (settings?.siteTitle_en || 'DIGITAL.GIFTS'))} 
        />
        <meta 
          property="og:description" 
          content={selectedCategory 
            ? (language === 'he' ? (selectedCategory.seoDescription_he || '') : (selectedCategory.seoDescription_en || ''))
            : (language === 'he' ? (settings?.siteDescription_he || 'האוסף האולטימטיבי של כלים דיגיטליים') : (settings?.siteDescription_en || 'The ultimate collection of digital tools'))} 
        />
        <meta 
          property="og:image" 
          content={selectedCategory?.imageUrl || settings?.siteOgImage || 'https://picsum.photos/seed/digitalgifts/1200/630'} 
        />
        <meta property="og:url" content={window.location.href} />
      </Helmet>
      
      {/* --- HERO SECTION --- */}
      <header className="relative pt-8 pb-8 md:pt-16 md:pb-12 overflow-hidden">
        {/* Marquee Background */}
        {settings?.showHeroMarquee !== false && (
          <div className="absolute top-10 left-0 w-full -rotate-1 opacity-[0.03] pointer-events-none select-none">
            <div className="flex overflow-hidden whitespace-nowrap mask-linear-fade w-full">
              <motion.div
                animate={{ x: '-50%' }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="flex gap-6 items-center py-4 min-w-full"
              >
                {Array(6).fill(0).map((_, i) => (
                  <span key={i} className="text-[6rem] md:text-[10rem] font-black uppercase mx-4 md:mx-8">
                    {settings?.heroMarqueeText || `${settings?.siteTitle_he || 'DIGITAL.GIFTS'} COLLECTION 2026`}
                  </span>
                ))}
              </motion.div>
            </div>
          </div>
        )}

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
            className="text-[13vw] md:text-9xl font-black tracking-tighter uppercase leading-[0.85] mb-6"
          >
            {selectedCategory ? (
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-black to-gray-600 break-words">
                {language === 'he' ? selectedCategory.name_he : selectedCategory.name_en}
              </span>
            ) : (
              <span className="whitespace-nowrap">
                {settings?.siteTitle_he?.split('.')[0] || 'DIGITAL'}<span className="text-[#FF6B6B]">.</span>{settings?.siteTitle_he?.split('.')[1] || 'GIFTS'}
              </span>
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
                ? (settings?.siteDescription_he || 'האוסף האולטימטיבי של כלים, מתנות ומשאבים דיגיטליים.')
                : (settings?.siteDescription_en || 'The ultimate collection of digital tools, gifts, and resources.')}
            </motion.p>
          )}

          {/* Search Bar */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="relative max-w-md mx-auto px-4"
          >
            <div className="relative group">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'he' ? 'חפש כל דבר...' : 'Search for anything...'}
                className="w-full px-6 py-3.5 bg-white border-2 border-black rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:translate-y-[2px] focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all text-base font-bold placeholder:font-normal placeholder:text-gray-400 text-center"
              />
              <div className={cn(
                "absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-black flex items-center justify-center transition-all",
                isSearchingAI ? "bg-amber-400 animate-bounce" : "bg-primary"
              )}>
                {isSearchingAI ? (
                  <Sparkles className="w-4 h-4 text-black animate-pulse" />
                ) : (
                  <Search className="w-4 h-4 text-black" />
                )}
              </div>
              
              {/* AI Badge */}
              <AnimatePresence>
                {searchQuery.length >= 3 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter text-ink-400"
                  >
                    <Zap className={cn("w-3 h-3", isSearchingAI ? "text-amber-500 fill-amber-500 animate-pulse" : "text-gray-300")} />
                    <span>{isSearchingAI ? (language === 'he' ? 'בינה מלאכותית מחפשת כוונה...' : 'AI searching intent...') : (language === 'he' ? 'חיפוש חכם מופעל' : 'Smart search enabled')}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </header>

      {/* --- CONTENT AREA --- */}
      <div className="container mx-auto px-4 max-w-6xl">
        <AnimatePresence mode="wait">
          {searchQuery.trim() ? (
            /* SEARCH RESULTS VIEW */
            <motion.div
              key="search-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="pb-20"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="bg-primary border-2 border-black p-2 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <Search className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight leading-none">
                      {language === 'he' ? 'תוצאות חיפוש' : 'Search Results'}
                    </h2>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                      {filteredLinks.length} {language === 'he' ? 'פריטים נמצאו' : 'Items Found'}
                    </p>
                  </div>
                </div>
                {isSearchingAI && (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full animate-pulse">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">
                      {language === 'he' ? 'מנתח כוונות...' : 'Analyzing intent...'}
                    </span>
                  </div>
                )}
              </div>

              {filteredLinks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredLinks.map((link, index) => {
                    const isSemantic = semanticLinkIds.includes(link.id);
                    return (
                      <motion.div
                        key={link.id}
                        onClick={() => handleLinkClick(link)}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.03 }}
                        className="group bg-white border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex flex-col h-full cursor-pointer relative"
                        style={{ borderRadius: 'var(--global-radius, 24px)' }}
                      >
                        {isSemantic && (
                          <div className="absolute top-3 left-3 z-10 bg-amber-400 border-2 border-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span className="text-[8px] font-black uppercase tracking-tighter">AI Match</span>
                          </div>
                        )}
                        <div className="h-48 overflow-hidden border-b-2 border-black relative bg-gray-50">
                          <img 
                            src={link.imageUrl || `https://picsum.photos/seed/${link.id}/600/400`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            alt=""
                          />
                        </div>
                        <div className="p-5 flex flex-col flex-1">
                          <div className="flex items-center gap-2 mb-2">
                             <div className="bg-black text-white px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest">
                                {categories.find(c => c.id === link.categoryId)?.[language === 'he' ? 'name_he' : 'name_en']}
                             </div>
                          </div>
                          <h3 className="font-black text-lg leading-tight mb-2 group-hover:text-primary-dark transition-colors">
                            {language === 'he' ? link.title_he : link.title_en}
                          </h3>
                          <p className="text-xs font-bold text-ink-400 line-clamp-1 mb-2">
                            {language === 'he' ? link.subtitle_he : link.subtitle_en}
                          </p>
                          <p className="text-[11px] text-gray-500 line-clamp-2 mb-4 flex-1">
                            {language === 'he' ? link.description_he : link.description_en}
                          </p>
                          <div className="flex items-center justify-between pt-4 border-t border-black/5">
                             <span className="text-[10px] font-bold text-gray-400">
                               {language === 'he' ? 'גלה עכשיו' : 'Discover Now'}
                             </span>
                             <ArrowUpRight className="w-5 h-5 text-black group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <div className="inline-block p-6 bg-white border-2 border-black rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-6">
                    <Search className="w-12 h-12 text-black opacity-20" />
                  </div>
                  <h3 className="text-2xl font-black uppercase mb-2">
                    {language === 'he' ? 'לא מצאנו כלום...' : 'No results found...'}
                  </h3>
                  <p className="text-gray-500 font-medium max-w-sm mx-auto">
                    {language === 'he' 
                      ? 'נסה לחפש במילים אחרות, או שהבינה המלאכותית שלנו עוד לא מכירה את זה.' 
                      : 'Try different keywords, or maybe our AI hasn\'t discovered this yet.'}
                  </p>
                  <Button 
                    className="mt-8"
                    onClick={() => setSearchQuery('')}
                  >
                    {language === 'he' ? 'נקה חיפוש' : 'Clear Search'}
                  </Button>
                </div>
              )}
            </motion.div>
          ) : !selectedCategoryId ? (
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
                  <DraggableMarquee key={newLinks.length}>
                    {(newLinks.length > 0 ? newLinks : Array(6).fill(null)).map((link, i) => (
                      link ? (
                        <div 
                          key={`${link.id}-${i}`}
                          onClick={() => handleLinkClick(link)}
                          className="group relative block w-40 h-44 bg-white border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all shrink-0 cursor-pointer"
                          style={{ borderRadius: 'var(--global-radius, 24px)' }}
                          dir={isRTL ? 'rtl' : 'ltr'}
                        >
                          <div className="h-24 overflow-hidden border-b-2 border-black relative bg-gray-50">
                            <img 
                              src={link.imageUrl || `https://picsum.photos/seed/${link.id}/300/200`}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              alt=""
                            />
                            {/* Share Button Small */}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleShare(link);
                              }}
                              className="absolute top-1.5 right-1.5 z-20 p-1.5 bg-white/90 backdrop-blur-sm border border-black rounded-lg shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:scale-110 active:scale-95 transition-all opacity-0 group-hover:opacity-100"
                              title={language === 'he' ? 'שתף' : 'Share'}
                            >
                              <Share2 className="w-3 h-3 text-black" />
                            </button>
                          </div>
                          <div className="p-2 text-start">
                            <h3 className="font-bold text-[11px] leading-tight mb-0.5 line-clamp-1">
                              {language === 'he' ? link.title_he : link.title_en}
                            </h3>
                            <p className="text-[9px] text-gray-500 line-clamp-1 mb-1">
                              {language === 'he' ? link.subtitle_he : link.subtitle_en}
                            </p>
                            <div className="flex items-center gap-1 text-[8px] font-bold text-gray-400 uppercase tracking-wide">
                              <span className="w-1 h-1 bg-[#4ECDC4] rounded-full" />
                              {categories.find(c => c.id === link.categoryId)?.[language === 'he' ? 'name_he' : 'name_en']}
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Skeleton for empty state
                        <div key={i} className="w-40 h-44 bg-gray-100 border-2 border-black/10 rounded-2xl shrink-0 animate-pulse" />
                      )
                    ))}
                  </DraggableMarquee>
                </div>
              </section>

                {/* CATEGORIES SECTION */}
                <section className="relative">
                  {/* Background Grid Pattern (Subtle) */}
                  <div className="absolute inset-0 -z-10 opacity-[0.03] pointer-events-none" 
                       style={{ backgroundImage: 'radial-gradient(circle, black 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                  <div className="flex items-center justify-between mb-8 px-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center rotate-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)]">
                        <LayoutGrid className="w-5 h-5 text-white" />
                      </div>
                      <h2 className="text-2xl font-black uppercase italic tracking-tight">
                        {language === 'he' ? 'קטגוריות' : 'Categories'}
                      </h2>
                    </div>
                    <div className="hidden md:flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <span>{categories.length} {language === 'he' ? 'פריטים' : 'Items'}</span>
                      <div className="w-1 h-1 bg-gray-300 rounded-full" />
                      <span>{language === 'he' ? 'בחר קטגוריה' : 'Select a category'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 auto-rows-[160px] md:auto-rows-[180px]">
                    {smartCategories.map((cat, i) => {
                      return (
                        <div key={cat.id} className={cn("col-span-1", cat.gridClass)}>
                          <BentoCard
                            onClick={() => handleCategoryClick(cat.id)}
                            delay={i * 0.08}
                            imageUrl={cat.imageUrl}
                            imageFit={cat.imageFit}
                            imageZoom={cat.imageZoom}
                            textAlign={cat.textAlign}
                            isComingSoon={cat.isComingSoon}
                            className={cn(
                              bentoColors[i % bentoColors.length],
                              "h-full flex flex-col justify-between group !p-5 !shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:!shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
                            )}
                            style={{ borderRadius: 'var(--global-radius, 24px)' }}
                          >
                            <div className="flex justify-between items-start w-full mb-2">
                              <div className="bg-white/90 backdrop-blur-sm border-2 border-black p-2 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:-translate-y-1 transition-transform">
                                <Sparkles className="w-4 h-4 text-black" />
                              </div>
                              <div className="bg-black text-white text-[11px] font-black px-3 py-1 rounded-full border border-white/20">
                                {links.filter(l => l.categoryId === cat.id).length}
                              </div>
                            </div>
                            
                            <div className={cn(
                              "relative z-10 w-full",
                              cat.textAlign === 'left' ? "text-left" : 
                              cat.textAlign === 'center' ? "text-center" : 
                              "text-right"
                            )}>
                              <h3 className="text-xl md:text-2xl font-black uppercase leading-[0.9] mb-1 group-hover:scale-105 transition-transform origin-bottom-right">
                                {language === 'he' ? cat.name_he : cat.name_en}
                              </h3>
                              
                              {(language === 'he' ? cat.subtitle_he : cat.subtitle_en) && (
                                <p className={cn(
                                  "text-[10px] font-bold uppercase tracking-wider mb-2",
                                  cat.justifySubtitle ? "w-full flex justify-between" : ""
                                )}>
                                  {cat.justifySubtitle ? (
                                    (language === 'he' ? cat.subtitle_he : cat.subtitle_en)?.split('').map((char, i) => (
                                      <span key={i}>{char === ' ' ? '\u00A0' : char}</span>
                                    ))
                                  ) : (
                                    language === 'he' ? cat.subtitle_he : cat.subtitle_en
                                  )}
                                </p>
                              )}

                              <div className={cn(
                                "flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0",
                                cat.textAlign === 'center' ? "justify-center" : 
                                cat.textAlign === 'left' ? "justify-start" : "justify-end"
                              )}>
                                <span className="text-[10px] font-black uppercase tracking-widest">
                                  {language === 'he' ? 'צפה בהכל' : 'View All'}
                                </span>
                                <ArrowRight className={cn("w-3 h-3", isRTL && "rotate-180")} />
                              </div>

                              <div className={cn(
                                "w-6 h-1 bg-black rounded-full group-hover:w-12 transition-all mt-2",
                                cat.textAlign === 'center' ? "mx-auto" : 
                                cat.textAlign === 'left' ? "mr-auto" : "ml-auto"
                              )} />
                            </div>

                            {/* Decorative background pattern */}
                            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/30 group-hover:scale-150 transition-all duration-700 pointer-events-none" />
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

              <div className="space-y-12">
                {groupedLinks ? (
                  Object.entries(groupedLinks).map(([groupName, groupLinks]) => (
                    <div key={groupName} className="space-y-6">
                      <div className="flex items-center gap-3">
                        <h3 className="text-sm font-black uppercase tracking-widest bg-black text-white px-3 py-1 rounded-md">
                          {groupName}
                        </h3>
                        <div className="h-px flex-1 bg-black/10" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {groupLinks.map((link, index) => (
                          <motion.div
                            key={link.id}
                            onClick={() => handleLinkClick(link)}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="group bg-white border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex flex-col h-full cursor-pointer"
                            style={{ borderRadius: 'var(--global-radius, 24px)' }}
                          >
                            <div className="h-40 overflow-hidden border-b-2 border-black relative bg-gray-100">
                              <img 
                                src={link.imageUrl || `https://picsum.photos/seed/${link.id}/600/400`}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                alt=""
                                referrerPolicy="no-referrer"
                              />
                              
                              {/* Share Button */}
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleShare(link);
                                }}
                                className="absolute top-3 right-3 z-20 p-2 bg-white/90 backdrop-blur-sm border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:scale-110 active:scale-95 transition-all opacity-0 group-hover:opacity-100"
                                title={language === 'he' ? 'שתף קישור' : 'Share link'}
                              >
                                <Share2 className="w-3.5 h-3.5 text-black" />
                              </button>

                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                 <div className="bg-white text-black font-bold px-3 py-1 rounded-full border border-black transform -rotate-2 shadow-sm text-xs">
                                   {language === 'he' ? 'פרטים נוספים' : 'MORE DETAILS'}
                                 </div>
                              </div>
                            </div>
                            
                            <div className={cn(
                              "p-4 flex-1 flex flex-col",
                              link.textAlign === 'left' ? "text-left items-start" : 
                              link.textAlign === 'center' ? "text-center items-center" : 
                              "text-right items-end"
                            )}>
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {link.tags?.slice(0, 3).map(tag => (
                                  <span key={tag} className="text-[9px] font-bold uppercase tracking-widest bg-gray-100 px-1.5 py-0.5 rounded border border-black/10">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                              
                              <h3 className="text-lg font-black leading-tight mb-1 group-hover:underline decoration-2 underline-offset-2">
                                {language === 'he' ? link.title_he : link.title_en}
                                {(language === 'he' ? link.subtitle_he : link.subtitle_en) && (
                                  <span className="text-sm font-bold text-[#FF6B6B] ms-2">
                                    - {language === 'he' ? link.subtitle_he : link.subtitle_en}
                                  </span>
                                )}
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
                          </motion.div>
                        ))}
                      </div>
                    </div>
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

      {/* Details Modal */}
      <Modal
        isOpen={!!selectedLink}
        onClose={() => setSelectedLink(null)}
        title={(language === 'he' ? selectedLink?.title_he : selectedLink?.title_en) || ''}
      >
        {selectedLink && (
          <div className="space-y-6">
            <div className="relative aspect-video rounded-2xl overflow-hidden border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
              <img 
                src={selectedLink.imageUrl || `https://picsum.photos/seed/${selectedLink.id}/1200/630`}
                className="w-full h-full object-cover"
                alt=""
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            <div className={cn(
              "space-y-4",
              selectedLink.textAlign === 'left' ? "text-left" : 
              selectedLink.textAlign === 'center' ? "text-center" : 
              "text-right"
            )}>
              <div className={cn(
                "flex flex-wrap gap-2",
                selectedLink.textAlign === 'center' ? "justify-center" : 
                selectedLink.textAlign === 'left' ? "justify-start" : "justify-end"
              )}>
                {selectedLink.tags?.map(tag => (
                  <span key={tag} className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-3 py-1 rounded-full border-2 border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    #{tag}
                  </span>
                ))}
              </div>

              <h4 className="text-2xl font-black tracking-tight text-ink-900 border-b-4 border-primary inline-block pb-1">
                {language === 'he' ? selectedLink.subtitle_he : selectedLink.subtitle_en}
              </h4>

              <div className="prose prose-sm max-w-none text-ink-600 leading-relaxed font-medium">
                {language === 'he' ? selectedLink.description_he : selectedLink.description_en}
              </div>
            </div>

            <div className="pt-8 flex flex-col gap-4">
              <a
                href={`/go/${selectedLink.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "w-full py-4 bg-[#22C55E] text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all flex items-center justify-center gap-2",
                  isRTL ? "flex-row-reverse" : ""
                )}
              >
                <span>
                  {selectedLink.actionButtonText === 'install' 
                    ? (language === 'he' ? 'להתקנה' : 'INSTALL NOW')
                    : (language === 'he' ? 'להמשך באתר' : 'CONTINUE TO SITE')}
                </span>
                <ExternalLink className="w-5 h-5" />
              </a>
              
              <button
                onClick={() => handleShare(selectedLink)}
                className="w-full py-3 bg-white border-2 border-black text-black font-bold uppercase tracking-widest rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-50 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                {language === 'he' ? 'שיתוף קישור' : 'SHARE LINK'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Footer Decoration */}
      <div className="fixed bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#FFD23F] via-[#FF6B6B] to-[#4ECDC4]" />
    </div>
  );
}
