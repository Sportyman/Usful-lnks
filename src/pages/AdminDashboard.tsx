/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { linkService } from '../services/linkService';
import { categoryService } from '../services/categoryService';
import { settingsService } from '../services/settingsService';
import { bulkSeoService, BulkSeoProgress } from '../services/bulkSeoService';
import { Link as LinkType, Category, GlobalSettings } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Plus, Edit2, Trash2, BarChart2, LogOut, ArrowLeft, ArrowRight, Settings, ExternalLink, Save, History, RotateCcw, CheckCircle2, Activity, Download, Copy, Check, Terminal, Wand2, Search, AlertCircle } from 'lucide-react';
import { useLanguageStore } from '../store/languageStore';
import { useDebugStore } from '../store/debugStore';
import { auth } from '../services/firebase';
import { Link } from 'react-router-dom';
import { Modal } from '../components/ui/Modal';
import { TaskWindow } from '../components/ui/TaskWindow';
import { CategoryForm } from '../components/admin/CategoryForm';
import { LinkForm } from '../components/admin/LinkForm';
import { PromptEditorTab } from '../components/admin/PromptEditorTab';
import { useDataStore } from '../store/dataStore';
import { cn } from '../utils/cn';
import { AFFILIATE_BASE_URL } from '../config/constants';
import { motion } from 'motion/react';

export default function AdminDashboard() {
  const { user, isLoading: authLoading, setUser } = useAuthStore();
  const { language, isRTL } = useLanguageStore();
  const navigate = useNavigate();
  const [links, setLinks] = useState<LinkType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>({ 
    affiliateUrl: '',
    siteTitle_he: '',
    siteTitle_en: '',
    siteDescription_he: '',
    siteDescription_en: '',
    siteKeywords_he: '',
    siteKeywords_en: '',
    siteOgImage: '',
    primaryColor: '#FFD23F',
    secondaryColor: '#F27D26',
    fontFamily: 'Inter',
    borderRadius: '24px',
    showHeroMarquee: true,
    heroMarqueeText: 'DIGITAL.GIFTS COLLECTION 2026'
  });
  const [originalSettings, setOriginalSettings] = useState<GlobalSettings>({ 
    affiliateUrl: '',
    siteTitle_he: '',
    siteTitle_en: '',
    siteDescription_he: '',
    siteDescription_en: '',
    siteKeywords_he: '',
    siteKeywords_en: '',
    siteOgImage: '',
    primaryColor: '#FFD23F',
    secondaryColor: '#F27D26',
    fontFamily: 'Inter',
    borderRadius: '24px',
    showHeroMarquee: true,
    heroMarqueeText: 'DIGITAL.GIFTS COLLECTION 2026'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [bulkSeoProgress, setBulkSeoProgress] = useState<BulkSeoProgress | null>(null);
  const [isBulkSeoRunning, setIsBulkSeoRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'analytics' | 'settings' | 'diagnostics' | 'prompts'>('content');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState<any>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Modal States
  const [categoryModal, setCategoryModal] = useState<{ isOpen: boolean; editing?: Category }>({ isOpen: false });
  const [linkModal, setLinkModal] = useState<{ isOpen: boolean; editing?: LinkType }>({ isOpen: false });
  const [isLinkModalMinimized, setIsLinkModalMinimized] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; type?: 'category' | 'link'; id?: string }>({ isOpen: false });
  const [bulkSeoConfirm, setBulkSeoConfirm] = useState(false);

  const { showDebugButton, setShowDebugButton } = useDebugStore();

  const loadData = async () => {
    try {
      const results = await Promise.allSettled([
        linkService.getAllLinks(false),
        categoryService.getAllCategories(false),
        settingsService.getGlobalSettings()
      ]);

      if (results[0].status === 'fulfilled') setLinks(results[0].value);
      if (results[1].status === 'fulfilled') setCategories(results[1].value);
      if (results[2].status === 'fulfilled') {
        setSettings(results[2].value);
        setOriginalSettings(results[2].value);
      }
    } catch (err) {
      console.error('Critical error loading admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyDiagnostics = async () => {
    if (!diagnosticData) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(diagnosticData, null, 2));
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy diagnostics', err);
    }
  };

  const runDiagnostics = async () => {
    setIsActionLoading(true);
    try {
      const response = await fetch('/api/diagnostics');
      const backendData = response.ok ? await response.json() : { error: `Backend returned ${response.status}` };
      
      let geminiTest: any = null;
      try {
        const geminiRes = await fetch('/api/diagnostics/test-gemini');
        geminiTest = await geminiRes.json();
      } catch (e: any) {
        geminiTest = { error: e.message };
      }

      const frontendData = {
        url: window.location.href,
        userAgent: navigator.userAgent,
        language: navigator.language,
        localStorageKeys: Object.keys(localStorage),
        viteEnv: {
          MODE: import.meta.env.MODE,
          PROD: import.meta.env.PROD,
          DEV: import.meta.env.DEV,
        },
        seoStatus: {
          missingCategories: categories.filter(c => !c.seoTitle_he || !c.seoTitle_en).length,
          missingLinks: links.filter(l => !l.seoTitle_he || !l.seoTitle_en).length
        }
      };

      setDiagnosticData({
        timestamp: new Date().toISOString(),
        frontend: frontendData,
        backend: backendData,
        geminiTest: geminiTest
      });
    } catch (err: any) {
      setDiagnosticData({
        timestamp: new Date().toISOString(),
        error: err.message || 'Failed to run diagnostics'
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const downloadDiagnostics = () => {
    if (!diagnosticData) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(diagnosticData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `diagnostics-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    loadData();
  }, [user, authLoading, navigate]);

  const handleSettingsSave = async () => {
    setIsActionLoading(true);
    try {
      await settingsService.updateGlobalSettings(settings);
      setOriginalSettings(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await loadData(); // Reload to get updated history
    } catch (err) {
      console.error(err);
      alert('Failed to save settings');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRestoreDefault = () => {
    setSettings({ ...settings, affiliateUrl: AFFILIATE_BASE_URL });
  };

  const handleCategorySubmit = async (data: Omit<Category, 'id'>) => {
    setIsActionLoading(true);
    try {
      if (categoryModal.editing) {
        await categoryService.updateCategory(categoryModal.editing.id, data);
      } else {
        await categoryService.createCategory(data);
      }
      setCategoryModal({ isOpen: false });
      // Refresh both local and global store
      await loadData();
      useDataStore.getState().fetchData(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleLinkSubmit = async (data: Omit<LinkType, 'id' | 'createdAt' | 'clicks'>) => {
    setIsActionLoading(true);
    try {
      if (linkModal.editing) {
        await linkService.updateLink(linkModal.editing.id, data);
      } else {
        await linkService.createLink(data);
      }
      setLinkModal({ isOpen: false });
      // Refresh both local and global store
      await loadData();
      useDataStore.getState().fetchData(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.id || !deleteConfirm.type) return;
    setIsActionLoading(true);
    try {
      if (deleteConfirm.type === 'category') {
        await categoryService.deleteCategory(deleteConfirm.id);
      } else {
        await linkService.deleteLink(deleteConfirm.id);
      }
      setDeleteConfirm({ isOpen: false });
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    setUser(null);
    navigate('/');
  };

  const handleBulkSeo = async () => {
    setBulkSeoConfirm(false);
    setIsBulkSeoRunning(true);
    setBulkSeoProgress(null);
    console.log('Starting Bulk SEO Process...');
    try {
      await bulkSeoService.generateForMissing((progress) => {
        console.log('Bulk SEO Progress:', progress.current, '/', progress.total, progress.status);
        setBulkSeoProgress(progress);
      });
      await loadData();
    } catch (err) {
      console.error('Bulk SEO failed:', err);
      setBulkSeoProgress({
        total: 0,
        current: 0,
        status: language === 'he' ? 'שגיאה בתהליך' : 'Process Error',
        isComplete: true,
        errors: [err instanceof Error ? err.message : String(err)]
      });
    } finally {
      setIsBulkSeoRunning(false);
    }
  };

  if (authLoading || isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-ink-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const totalClicks = links.reduce((acc, link) => acc + link.clicks, 0);
  const topLinks = [...links].sort((a, b) => b.clicks - a.clicks).slice(0, 5);
  const isSettingsDirty = settings.affiliateUrl !== originalSettings.affiliateUrl || settings.aiPrompt !== originalSettings.aiPrompt || settings.aiModel !== originalSettings.aiModel;

  const renderBulkSeoSection = () => (
    <div className={cn(
      "bg-white p-6 rounded-2xl border shadow-sm space-y-6 transition-all duration-500",
      isBulkSeoRunning ? "border-accent-peach ring-1 ring-accent-peach/20" : "border-black/5"
    )}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="font-bold text-lg text-ink-900 flex items-center gap-2">
            <Search className={cn("w-5 h-5", isBulkSeoRunning ? "text-accent-peach animate-pulse" : "text-accent-peach-darker")} />
            {language === 'he' ? 'אופטימיזציית SEO גורפת' : 'Bulk SEO Optimization'}
          </h3>
          <p className="text-xs text-ink-500">
            {language === 'he' 
              ? 'ייצר אוטומטית מטא-דאטה (כותרות ותיאורים) לכל הקטגוריות והקישורים שחסר להם מידע SEO.' 
              : 'Automatically generate metadata (titles and descriptions) for all categories and links missing SEO info.'}
          </p>
        </div>
        {bulkSeoProgress?.isComplete && (
          <button 
            onClick={() => setBulkSeoProgress(null)}
            className="text-[10px] font-bold uppercase tracking-widest text-ink-400 hover:text-ink-900"
          >
            {language === 'he' ? 'סגור' : 'Dismiss'}
          </button>
        )}
      </div>

      <div className="space-y-4">
        {(isBulkSeoRunning || bulkSeoProgress) && (
          <div className={cn(
            "p-4 rounded-xl border transition-all",
            bulkSeoProgress?.isComplete ? "bg-green-50 border-green-100" : "bg-slate-50 border-slate-100"
          )}>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest mb-2">
              <span className={bulkSeoProgress?.isComplete ? "text-green-600" : "text-slate-500"}>
                {bulkSeoProgress?.status || (language === 'he' ? 'מכין...' : 'Preparing...')}
              </span>
              <span className="text-slate-400">
                {bulkSeoProgress ? `${bulkSeoProgress.current} / ${bulkSeoProgress.total}` : '0 / 0'}
              </span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <motion.div 
                className={cn("h-full", bulkSeoProgress?.isComplete ? "bg-green-500" : "bg-accent-peach")}
                initial={{ width: 0 }}
                animate={{ width: bulkSeoProgress ? `${(bulkSeoProgress.current / bulkSeoProgress.total) * 100}%` : '0%' }}
              />
            </div>
            {bulkSeoProgress?.errors && bulkSeoProgress.errors.length > 0 && (
              <div className="mt-3 p-2 bg-red-50 rounded-lg border border-red-100 text-[10px] text-red-600 space-y-1">
                <div className="flex items-center gap-1 font-bold">
                  <AlertCircle className="w-3 h-3" />
                  {language === 'he' ? 'שגיאות שאירעו:' : 'Errors occurred:'}
                </div>
                <ul className="list-disc list-inside">
                  {bulkSeoProgress.errors.slice(0, 3).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {bulkSeoProgress.errors.length > 3 && <li>...ועוד {bulkSeoProgress.errors.length - 3} שגיאות</li>}
                </ul>
              </div>
            )}
            {bulkSeoProgress?.isComplete && bulkSeoProgress.errors.length === 0 && (
              <div className="mt-2 flex items-center gap-2 text-green-600 text-[10px] font-bold">
                <CheckCircle2 className="w-3 h-3" />
                {language === 'he' ? 'התהליך הושלם בהצלחה!' : 'Process completed successfully!'}
              </div>
            )}
          </div>
        )}

        {!isBulkSeoRunning && (!bulkSeoProgress || bulkSeoProgress.isComplete) && (
          <Button 
            onClick={() => {
              console.log('Bulk SEO Button Clicked');
              setBulkSeoConfirm(true);
            }}
            variant="secondary"
            className="w-full h-12 border-accent-peach/20 hover:border-accent-peach/40 text-accent-peach-darker"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            {language === 'he' ? 'הרץ אופטימיזציה לכל האתר' : 'Run Site-wide Optimization'}
          </Button>
        )}
        
        {isBulkSeoRunning && (
          <div className="flex items-center justify-center gap-3 py-2">
            <div className="w-4 h-4 border-2 border-accent-peach border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-bold text-accent-peach-darker animate-pulse">
              {language === 'he' ? 'מבצע אופטימיזציה... נא לא לסגור את הדף' : 'Optimizing... Please do not close this page'}
            </span>
          </div>
        )}

        <p className="text-[10px] text-center text-ink-400 italic">
          {language === 'he' 
            ? '* פעולה זו משתמשת בבינה מלאכותית ועשויה לקחת מספר דקות בהתאם לכמות התוכן.' 
            : '* This action uses AI and may take several minutes depending on the amount of content.'}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg-soft pb-20">
      {/* Mobile-First Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-black/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 -ml-2 rounded-full hover:bg-black/5 transition-colors">
            {isRTL ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
          </Link>
          <h1 className="text-lg font-bold uppercase tracking-tight text-ink-900">
            {language === 'he' ? 'ניהול' : 'Admin'}
          </h1>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-500 hover:bg-red-50 hover:text-red-600">
          <LogOut className="w-4 h-4" />
        </Button>
      </header>

      {/* Mobile Tabs */}
      <div className="px-4 py-4 overflow-x-auto hide-scrollbar sticky top-[57px] z-20 bg-bg-soft/95 backdrop-blur-sm">
        <div className="flex gap-2 min-w-max">
          {[
            { id: 'content', label: language === 'he' ? 'תוכן' : 'Content', icon: ExternalLink },
            { id: 'analytics', label: language === 'he' ? 'נתונים' : 'Analytics', icon: BarChart2 },
            { id: 'prompts', label: language === 'he' ? 'פרומפטים' : 'Prompts', icon: Wand2 },
            { id: 'settings', label: language === 'he' ? 'הגדרות' : 'Settings', icon: Settings },
            { id: 'diagnostics', label: language === 'he' ? 'אבחון' : 'Diagnostics', icon: Activity }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all border",
                activeTab === tab.id 
                  ? "bg-ink-900 text-white border-ink-900 shadow-md" 
                  : "bg-white text-ink-500 border-black/5 hover:border-ink-900"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-6 max-w-3xl mx-auto">
        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Bulk SEO Section (Quick Access) */}
            {renderBulkSeoSection()}

            {/* Categories */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-widest text-ink-500">
                  {language === 'he' ? 'קטגוריות' : 'Categories'} ({categories.length})
                </h2>
                <Button size="sm" onClick={() => setCategoryModal({ isOpen: true })} className="h-8 px-3">
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  {language === 'he' ? 'הוסף' : 'Add'}
                </Button>
              </div>
              
              <div className="grid gap-3">
                {categories.map(cat => (
                  <div key={cat.id} className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm flex items-center justify-between group">
                    <div>
                      <h3 className="font-bold text-ink-900">{language === 'he' ? cat.name_he : cat.name_en}</h3>
                      <p className="text-[10px] font-mono text-ink-400 uppercase tracking-widest mt-0.5">/{cat.slug}</p>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => setCategoryModal({ isOpen: true, editing: cat })}
                        className="p-2 rounded-xl hover:bg-gray-100 text-ink-500 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setDeleteConfirm({ isOpen: true, type: 'category', id: cat.id })}
                        className="p-2 rounded-xl hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Links */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-widest text-ink-500">
                  {language === 'he' ? 'קישורים' : 'Links'} ({links.length})
                </h2>
                <Button size="sm" onClick={() => setLinkModal({ isOpen: true })} className="h-8 px-3">
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  {language === 'he' ? 'הוסף' : 'Add'}
                </Button>
              </div>

              <div className="grid gap-3">
                {links.map(link => (
                  <div key={link.id} className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm flex gap-4 group">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 shrink-0 overflow-hidden">
                      <img 
                        src={link.imageUrl || `https://picsum.photos/seed/${link.id}/100/100`} 
                        className="w-full h-full object-cover opacity-80"
                        alt={language === 'he' ? link.title_he : link.title_en}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-ink-900 truncate pr-2">{language === 'he' ? link.title_he : link.title_en}</h3>
                          <div className="flex items-center gap-2 text-[10px] text-ink-400 mt-0.5">
                            <span className="bg-gray-100 px-1.5 py-0.5 rounded-md font-medium">
                              {categories.find(c => c.id === link.categoryId)?.[language === 'he' ? 'name_he' : 'name_en']}
                            </span>
                            <span className="flex items-center gap-1">
                              <BarChart2 className="w-3 h-3" />
                              {link.clicks}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button 
                            onClick={() => setLinkModal({ isOpen: true, editing: link })}
                            className="p-2 rounded-xl hover:bg-gray-100 text-ink-500 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setDeleteConfirm({ isOpen: true, type: 'link', id: link.id })}
                            className="p-2 rounded-xl hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Prompts Tab */}
        {activeTab === 'prompts' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <PromptEditorTab />
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-5 rounded-2xl border border-black/5 shadow-sm text-center">
                <span className="block text-3xl font-extrabold text-ink-900">{totalClicks}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-ink-400">{language === 'he' ? 'לחיצות' : 'Clicks'}</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-black/5 shadow-sm text-center">
                <span className="block text-3xl font-extrabold text-ink-900">{links.length}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-ink-400">{language === 'he' ? 'קישורים' : 'Links'}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-black/5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-ink-500 border-b border-black/5 pb-2">
                {language === 'he' ? 'ביצועים מובילים' : 'Top Performance'}
              </h3>
              <div className="space-y-4">
                {topLinks.map((link, i) => (
                  <div key={link.id} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-ink-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="font-bold text-sm text-ink-900 truncate">{language === 'he' ? link.title_he : link.title_en}</span>
                        <span className="text-xs font-mono text-ink-500">{link.clicks}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-accent-peach rounded-full" 
                          style={{ width: `${(link.clicks / (topLinks[0]?.clicks || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {renderBulkSeoSection()}
            
            {/* General Site Info */}
            <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm space-y-6">
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-ink-900">{language === 'he' ? 'מידע כללי על האתר' : 'General Site Info'}</h3>
                <p className="text-xs text-ink-500">
                  {language === 'he' ? 'הגדר את הכותרת והתיאור של האתר.' : 'Set the site title and description.'}
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-ink-500 mb-2">
                      {language === 'he' ? 'כותרת האתר (עברית)' : 'Site Title (Hebrew)'}
                    </label>
                    <input
                      type="text"
                      value={settings.siteTitle_he || ''}
                      onChange={(e) => setSettings({ ...settings, siteTitle_he: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-peach text-sm"
                      placeholder="DIGITAL.GIFTS"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-ink-500 mb-2">
                      {language === 'he' ? 'כותרת האתר (אנגלית)' : 'Site Title (English)'}
                    </label>
                    <input
                      type="text"
                      value={settings.siteTitle_en || ''}
                      onChange={(e) => setSettings({ ...settings, siteTitle_en: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-peach text-sm"
                      placeholder="DIGITAL.GIFTS"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-ink-500 mb-2">
                      {language === 'he' ? 'תיאור בעברית' : 'Description (Hebrew)'}
                    </label>
                    <textarea
                      value={settings.siteDescription_he || ''}
                      onChange={(e) => setSettings({ ...settings, siteDescription_he: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-peach text-sm h-20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-ink-500 mb-2">
                      {language === 'he' ? 'תיאור באנגלית' : 'Description (English)'}
                    </label>
                    <textarea
                      value={settings.siteDescription_en || ''}
                      onChange={(e) => setSettings({ ...settings, siteDescription_en: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-peach text-sm h-20"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-ink-500 mb-2">
                      {language === 'he' ? 'מילות מפתח (עברית)' : 'Keywords (Hebrew)'}
                    </label>
                    <input
                      type="text"
                      value={settings.siteKeywords_he || ''}
                      onChange={(e) => setSettings({ ...settings, siteKeywords_he: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-peach text-sm"
                      placeholder="keyword1, keyword2..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-ink-500 mb-2">
                      {language === 'he' ? 'מילות מפתח (אנגלית)' : 'Keywords (English)'}
                    </label>
                    <input
                      type="text"
                      value={settings.siteKeywords_en || ''}
                      onChange={(e) => setSettings({ ...settings, siteKeywords_en: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-peach text-sm"
                      placeholder="keyword1, keyword2..."
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-ink-500 mb-2">
                    {language === 'he' ? 'תמונת שיתוף (OG Image URL)' : 'Social Share Image (OG Image URL)'}
                  </label>
                  <input
                    type="url"
                    value={settings.siteOgImage || ''}
                    onChange={(e) => setSettings({ ...settings, siteOgImage: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-peach text-sm"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>

            {/* Design Settings */}
            <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm space-y-6">
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-ink-900">{language === 'he' ? 'הגדרות עיצוב' : 'Design Settings'}</h3>
                <p className="text-xs text-ink-500">
                  {language === 'he' ? 'שלוט בצבעים ובגופנים של האתר.' : 'Control the site colors and fonts.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-ink-500 mb-2">
                    {language === 'he' ? 'צבע ראשי' : 'Primary Color'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.primaryColor || '#FFD23F'}
                      onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                      className="w-10 h-10 rounded-lg cursor-pointer border-none"
                    />
                    <input
                      type="text"
                      value={settings.primaryColor || '#FFD23F'}
                      onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-ink-500 mb-2">
                    {language === 'he' ? 'צבע משני' : 'Secondary Color'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.secondaryColor || '#F27D26'}
                      onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                      className="w-10 h-10 rounded-lg cursor-pointer border-none"
                    />
                    <input
                      type="text"
                      value={settings.secondaryColor || '#F27D26'}
                      onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-ink-500 mb-2">
                    {language === 'he' ? 'גופן (Font Family)' : 'Font Family'}
                  </label>
                  <select
                    value={settings.fontFamily || 'Inter'}
                    onChange={(e) => setSettings({ ...settings, fontFamily: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-peach text-sm"
                  >
                    <option value="Inter">Inter (Modern Sans)</option>
                    <option value="Space Grotesk">Space Grotesk (Tech)</option>
                    <option value="Outfit">Outfit (Clean)</option>
                    <option value="Playfair Display">Playfair Display (Serif)</option>
                    <option value="JetBrains Mono">JetBrains Mono (Technical)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-ink-500 mb-2">
                    {language === 'he' ? 'רדיוס פינות (Border Radius)' : 'Border Radius'}
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="range"
                      min="0"
                      max="48"
                      value={parseInt(settings.borderRadius || '24')}
                      onChange={(e) => setSettings({ ...settings, borderRadius: `${e.target.value}px` })}
                      className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-accent-peach"
                    />
                    <span className="text-xs font-mono w-10 text-center">{settings.borderRadius || '24px'}</span>
                  </div>
                </div>
                <div className="md:col-span-2">
                   <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex-1">
                        <label className="block text-xs font-bold uppercase tracking-widest text-ink-500 mb-1">
                          {language === 'he' ? 'הצג טקסט רץ בראש האתר' : 'Show Hero Marquee'}
                        </label>
                        <p className="text-[10px] text-ink-400">
                          {language === 'he' ? 'הצג את הטקסט הגדול שרץ ברקע של ראש האתר.' : 'Show the large scrolling text in the hero background.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, showHeroMarquee: !settings.showHeroMarquee })}
                        className={cn(
                          "w-12 h-6 rounded-full transition-colors relative",
                          settings.showHeroMarquee ? "bg-accent-peach" : "bg-gray-300"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                          settings.showHeroMarquee ? "right-1" : "right-7"
                        )} />
                      </button>
                   </div>
                </div>
                {settings.showHeroMarquee && (
                  <div className="md:col-span-3">
                    <label className="block text-xs font-bold uppercase tracking-widest text-ink-500 mb-2">
                      {language === 'he' ? 'טקסט רץ (Marquee Text)' : 'Marquee Text'}
                    </label>
                    <input
                      type="text"
                      value={settings.heroMarqueeText || ''}
                      onChange={(e) => setSettings({ ...settings, heroMarqueeText: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-peach text-sm"
                      placeholder="DIGITAL.GIFTS COLLECTION 2026"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm space-y-6">
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-ink-900">{language === 'he' ? 'קישור שותפים ראשי' : 'Main Affiliate URL'}</h3>
                <p className="text-xs text-ink-500">
                  {language === 'he' ? 'קישור זה ייפתח ברקע בעת מעבר לכל קישור בפלטפורמה.' : 'Triggered in background on every redirect.'}
                </p>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="url"
                    value={settings.affiliateUrl}
                    onChange={(e) => setSettings({ ...settings, affiliateUrl: e.target.value })}
                    className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-peach text-sm font-mono"
                    placeholder="https://..."
                  />
                  {settings.affiliateUrl !== AFFILIATE_BASE_URL && (
                    <button 
                      onClick={handleRestoreDefault}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-ink-400 hover:text-ink-900 hover:bg-gray-200 rounded-lg transition-colors"
                      title={language === 'he' ? 'שחזר ברירת מחדל' : 'Restore Default'}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <Button 
                  onClick={handleSettingsSave} 
                  isLoading={isActionLoading}
                  disabled={!isSettingsDirty}
                  className={cn("w-full h-12 transition-all", saveSuccess ? "bg-green-600 hover:bg-green-700" : "")}
                >
                  {saveSuccess ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      {language === 'he' ? 'נשמר!' : 'Saved!'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      {language === 'he' ? 'שמור שינויים' : 'Save Changes'}
                    </span>
                  )}
                </Button>
              </div>
            </div>

            {/* Debug Settings */}
            <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-ink-900 flex items-center gap-2">
                    <Terminal className="w-5 h-5" />
                    {language === 'he' ? 'הגדרות ניפוי שגיאות' : 'Debug Settings'}
                  </h3>
                  <p className="text-xs text-ink-500">
                    {language === 'he' ? 'הצג או הסתר את כפתור הלוגים הצף.' : 'Show or hide the floating debug logs button.'}
                  </p>
                </div>
                <button
                  onClick={() => setShowDebugButton(!showDebugButton)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                    showDebugButton ? "bg-accent-peach" : "bg-gray-200"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      showDebugButton ? (isRTL ? "-translate-x-6" : "translate-x-6") : (isRTL ? "-translate-x-1" : "translate-x-1")
                    )}
                  />
                </button>
              </div>
            </div>

            {/* History Section */}
            {settings.affiliateUrlHistory && settings.affiliateUrlHistory.length > 0 && (
              <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-ink-500 border-b border-black/5 pb-2">
                  <History className="w-4 h-4" />
                  <h3 className="text-xs font-bold uppercase tracking-widest">
                    {language === 'he' ? 'היסטוריית קישורים' : 'Link History'}
                  </h3>
                </div>
                <div className="space-y-3">
                  {settings.affiliateUrlHistory.map((item, index) => (
                    <div key={index} className="flex items-center justify-between gap-3 text-xs group">
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-ink-600 truncate bg-gray-50 p-2 rounded-lg border border-gray-100">
                          {item.url}
                        </p>
                        <p className="text-[10px] text-ink-400 mt-1 pl-1">
                          {new Date(item.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <button 
                        onClick={() => setSettings({ ...settings, affiliateUrl: item.url })}
                        className="p-2 text-accent-peach-darker hover:bg-accent-peach/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        title={language === 'he' ? 'שחזר' : 'Restore'}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Diagnostics Tab */}
        {activeTab === 'diagnostics' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm space-y-6">
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-ink-900">{language === 'he' ? 'אבחון מערכת' : 'System Diagnostics'}</h3>
                <p className="text-xs text-ink-500">
                  {language === 'he' 
                    ? 'הרץ בדיקת מערכת כדי לאתר בעיות בהגדרות, במפתחות ה-API או בחיבור לשרת.' 
                    : 'Run a system check to find issues with settings, API keys, or server connection.'}
                </p>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={runDiagnostics} 
                  isLoading={isActionLoading}
                  className="flex-1"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  {language === 'he' ? 'הרץ אבחון' : 'Run Diagnostics'}
                </Button>
                
                {diagnosticData && (
                  <>
                    <Button 
                      onClick={downloadDiagnostics} 
                      variant="secondary"
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {language === 'he' ? 'הורד דוח' : 'Download Report'}
                    </Button>
                    <Button 
                      onClick={copyDiagnostics} 
                      variant="secondary"
                      className="flex-1"
                    >
                      {isCopied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
                      {isCopied ? (language === 'he' ? 'הועתק!' : 'Copied!') : (language === 'he' ? 'העתק דוח' : 'Copy Report')}
                    </Button>
                  </>
                )}
              </div>

              {diagnosticData && (
                <div className="mt-6">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-ink-500 mb-2">
                    {language === 'he' ? 'תוצאות' : 'Results'}
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 overflow-x-auto">
                    <pre className="text-[10px] font-mono text-ink-700 whitespace-pre-wrap">
                      {JSON.stringify(diagnosticData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal 
        isOpen={categoryModal.isOpen} 
        onClose={() => setCategoryModal({ isOpen: false })}
        title={categoryModal.editing ? (language === 'he' ? 'עריכת קטגוריה' : 'Edit Category') : (language === 'he' ? 'קטגוריה חדשה' : 'New Category')}
      >
        <CategoryForm 
          initialData={categoryModal.editing}
          onSubmit={handleCategorySubmit}
          onCancel={() => setCategoryModal({ isOpen: false })}
          isLoading={isActionLoading}
        />
      </Modal>

      <TaskWindow 
        isOpen={linkModal.isOpen} 
        isMinimized={isLinkModalMinimized}
        onMinimize={() => setIsLinkModalMinimized(true)}
        onMaximize={() => setIsLinkModalMinimized(false)}
        onClose={() => {
          setLinkModal({ isOpen: false });
          setIsLinkModalMinimized(false);
        }}
        title={linkModal.editing ? (language === 'he' ? 'עריכת קישור' : 'Edit Link') : (language === 'he' ? 'קישור חדש' : 'New Link')}
      >
        <LinkForm 
          categories={categories}
          initialData={linkModal.editing}
          onSubmit={async (data) => {
            await handleLinkSubmit(data);
            setIsLinkModalMinimized(false);
          }}
          onCancel={() => {
            setLinkModal({ isOpen: false });
            setIsLinkModalMinimized(false);
          }}
          isLoading={isActionLoading}
          customPrompt={settings.aiPrompt}
          settings={settings}
          setSettings={setSettings}
        />
      </TaskWindow>

      <Modal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false })}
        title={language === 'he' ? 'אישור מחיקה' : 'Confirm Delete'}
      >
        <div className="space-y-6">
          <p className="text-ink-700 font-medium">
            {language === 'he' 
              ? 'האם אתה בטוח שברצונך למחוק פריט זה? פעולה זו אינה ניתנת לביטול.' 
              : 'Are you sure you want to delete this item? This action cannot be undone.'}
          </p>
          <div className="flex gap-3">
            <Button 
              variant="primary" 
              className="flex-1 bg-red-600 hover:bg-red-700" 
              onClick={handleDelete}
              isLoading={isActionLoading}
            >
              {language === 'he' ? 'מחק' : 'Delete'}
            </Button>
            <Button 
              variant="secondary" 
              className="flex-1" 
              onClick={() => setDeleteConfirm({ isOpen: false })}
            >
              {language === 'he' ? 'ביטול' : 'Cancel'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={bulkSeoConfirm}
        onClose={() => setBulkSeoConfirm(false)}
        title={language === 'he' ? 'אופטימיזציית SEO גורפת' : 'Bulk SEO Optimization'}
      >
        <div className="space-y-6">
          <p className="text-ink-700 font-medium">
            {language === 'he' 
              ? 'האם אתה בטוח שברצונך לייצר SEO לכל התכנים החסרים? פעולה זו עשויה לקחת זמן ותשתמש במכסת ה-AI שלך.' 
              : 'Are you sure you want to generate SEO for all missing content? This may take some time and will use your AI quota.'}
          </p>
          <div className="flex gap-3">
            <Button 
              variant="primary" 
              className="flex-1" 
              onClick={handleBulkSeo}
            >
              {language === 'he' ? 'הרץ אופטימיזציה' : 'Run Optimization'}
            </Button>
            <Button 
              variant="secondary" 
              className="flex-1" 
              onClick={() => setBulkSeoConfirm(false)}
            >
              {language === 'he' ? 'ביטול' : 'Cancel'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
