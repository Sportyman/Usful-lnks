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
import { DEFAULT_PROMPT } from '../services/geminiService';
import { Link as LinkType, Category, GlobalSettings } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Plus, Edit2, Trash2, BarChart2, LogOut, ArrowLeft, ArrowRight, Settings, ExternalLink, Save, History, RotateCcw, CheckCircle2, Activity, Download } from 'lucide-react';
import { useLanguageStore } from '../store/languageStore';
import { auth } from '../services/firebase';
import { Link } from 'react-router-dom';
import { Modal } from '../components/ui/Modal';
import { TaskWindow } from '../components/ui/TaskWindow';
import { CategoryForm } from '../components/admin/CategoryForm';
import { LinkForm } from '../components/admin/LinkForm';
import { cn } from '../utils/cn';
import { AFFILIATE_BASE_URL } from '../config/constants';

export default function AdminDashboard() {
  const { user, isLoading: authLoading, setUser } = useAuthStore();
  const { language, isRTL } = useLanguageStore();
  const navigate = useNavigate();
  const [links, setLinks] = useState<LinkType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>({ affiliateUrl: '' });
  const [originalSettings, setOriginalSettings] = useState<GlobalSettings>({ affiliateUrl: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'analytics' | 'settings' | 'diagnostics'>('content');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState<any>(null);

  // Modal States
  const [categoryModal, setCategoryModal] = useState<{ isOpen: boolean; editing?: Category }>({ isOpen: false });
  const [linkModal, setLinkModal] = useState<{ isOpen: boolean; editing?: LinkType }>({ isOpen: false });
  const [isLinkModalMinimized, setIsLinkModalMinimized] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; type?: 'category' | 'link'; id?: string }>({ isOpen: false });

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

  const runDiagnostics = async () => {
    setIsActionLoading(true);
    try {
      const response = await fetch('/api/diagnostics');
      const backendData = response.ok ? await response.json() : { error: `Backend returned ${response.status}` };
      
      const frontendData = {
        url: window.location.href,
        userAgent: navigator.userAgent,
        language: navigator.language,
        localStorageKeys: Object.keys(localStorage),
        viteEnv: {
          MODE: import.meta.env.MODE,
          PROD: import.meta.env.PROD,
          DEV: import.meta.env.DEV,
        }
      };

      setDiagnosticData({
        timestamp: new Date().toISOString(),
        frontend: frontendData,
        backend: backendData
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
      await loadData();
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
      await loadData();
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

  if (authLoading || isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-ink-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const totalClicks = links.reduce((acc, link) => acc + link.clicks, 0);
  const topLinks = [...links].sort((a, b) => b.clicks - a.clicks).slice(0, 5);
  const isSettingsDirty = settings.affiliateUrl !== originalSettings.affiliateUrl || settings.aiPrompt !== originalSettings.aiPrompt || settings.aiModel !== originalSettings.aiModel;

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
                        src={`https://picsum.photos/seed/${link.id}/100/100`} 
                        className="w-full h-full object-cover opacity-80"
                        alt="" 
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

            {/* AI Prompt Settings */}
            <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm space-y-6">
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-ink-900">{language === 'he' ? 'הגדרות בינה מלאכותית' : 'AI Settings'}</h3>
                <p className="text-xs text-ink-500">
                  {language === 'he' ? 'ערוך את ההנחיות לבינה המלאכותית בעת יצירת תוכן לקישורים.' : 'Edit the AI prompt used for generating link content.'}
                </p>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Prompt Editor */}
                  <div className="relative md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-ink-500 mb-2">
                      {language === 'he' ? 'הנחיית בינה מלאכותית' : 'AI Prompt'}
                    </label>
                    <textarea
                      value={settings.aiPrompt || DEFAULT_PROMPT}
                      onChange={(e) => setSettings({ ...settings, aiPrompt: e.target.value })}
                      className="w-full p-4 min-h-[120px] bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-peach text-sm font-mono resize-y"
                      placeholder="Enter AI prompt..."
                    />
                    {settings.aiPrompt && settings.aiPrompt !== DEFAULT_PROMPT && (
                      <button 
                        onClick={() => setSettings({ ...settings, aiPrompt: DEFAULT_PROMPT })}
                        className="absolute right-2 top-9 p-1.5 text-ink-400 hover:text-ink-900 hover:bg-gray-200 rounded-lg transition-colors"
                        title={language === 'he' ? 'שחזר ברירת מחדל' : 'Restore Default'}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                    <p className="text-[10px] text-ink-400 mt-1">
                      {language === 'he' ? 'השתמש ב-{{url}} כדי לציין היכן הכתובת תוכנס.' : 'Use {{url}} as a placeholder for the link URL.'}
                    </p>
                  </div>

                  {/* Model Selector */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-ink-500 mb-2">
                      {language === 'he' ? 'מודל ראשי' : 'Primary Model'}
                    </label>
                    <select
                      value={settings.aiModel || "gemini-3-flash-preview"}
                      onChange={(e) => setSettings({ ...settings, aiModel: e.target.value })}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-peach text-sm font-mono"
                    >
                      <option value="gemini-3-flash-preview">Gemini 3 Flash (Recommended - Fast & Free)</option>
                      <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Slower, More Capable)</option>
                    </select>
                    <p className="text-[10px] text-ink-400 mt-1">
                      {language === 'he' 
                        ? 'המערכת תנסה אוטומטית את המודל השני אם הראשון ייכשל.' 
                        : 'System will automatically try the other model if the primary fails.'}
                    </p>
                  </div>
                </div>
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
                  <Button 
                    onClick={downloadDiagnostics} 
                    variant="secondary"
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {language === 'he' ? 'הורד דוח' : 'Download Report'}
                  </Button>
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
    </div>
  );
}
