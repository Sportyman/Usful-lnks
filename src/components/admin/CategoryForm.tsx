import React, { useState } from 'react';
import { Category } from '../../types';
import { Button } from '../ui/Button';
import { useLanguageStore } from '../../store/languageStore';
import { Wand2, Copy, Check, Sparkles, Search } from 'lucide-react';
import { geminiService } from '../../services/geminiService';
import { generateSeoMetadata } from '../../services/seoService';
import { cn } from '../../utils/cn';

interface CategoryFormProps {
  initialData?: Partial<Category>;
  onSubmit: (data: Omit<Category, 'id'>) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export function CategoryForm({ initialData, onSubmit, onCancel, isLoading }: CategoryFormProps) {
  const { language } = useLanguageStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const copyError = () => {
    if (aiError) {
      navigator.clipboard.writeText(aiError);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const [formData, setFormData] = useState({
    name_he: initialData?.name_he || '',
    name_en: initialData?.name_en || '',
    slug: initialData?.slug || '',
    imageUrl: initialData?.imageUrl || '',
    order: initialData?.order || 0,
    isActive: initialData?.isActive ?? true,
    imageFit: initialData?.imageFit || 'cover',
    imageZoom: initialData?.imageZoom && initialData.imageZoom < 10 ? initialData.imageZoom * 100 : initialData?.imageZoom || 100,
    textAlign: initialData?.textAlign || 'right',
    isComingSoon: initialData?.isComingSoon || false,
    subtitle_he: initialData?.subtitle_he || '',
    subtitle_en: initialData?.subtitle_en || '',
    justifySubtitle: initialData?.justifySubtitle || false,
    seoTitle_he: initialData?.seoTitle_he || '',
    seoTitle_en: initialData?.seoTitle_en || '',
    seoDescription_he: initialData?.seoDescription_he || '',
    seoDescription_en: initialData?.seoDescription_en || '',
    seoKeywords_he: initialData?.seoKeywords_he || '',
    seoKeywords_en: initialData?.seoKeywords_en || '',
    slugFormat: initialData?.slugFormat || '',
    sourceContext: '',
  });

  const handleSeoGenerate = async (lang: 'he' | 'en') => {
    const inputName = lang === 'he' ? formData.name_he : formData.name_en;
    if (!inputName) {
      alert(language === 'he' ? 'אנא הזן שם קטגוריה תחילה' : 'Please enter a category name first');
      return;
    }

    setAiError(null);
    setIsGenerating(true);
    try {
      const seo = await generateSeoMetadata({
        title: inputName,
        description: language === 'he' ? `כל הקישורים והתכנים בקטגוריית ${inputName}` : `All links and content in the ${inputName} category`,
      }, lang);
      
      setFormData(prev => ({
        ...prev,
        [`seoTitle_${lang}`]: seo.title,
        [`seoDescription_${lang}`]: seo.description,
        [`seoKeywords_${lang}`]: seo.keywords,
      }));
    } catch (error: any) {
      console.error("SEO Generation Error:", error);
      setAiError(error?.message || 'Failed to generate SEO');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMagicGenerate = async () => {
    const inputName = formData.name_he || formData.name_en;
    if (!inputName) {
      alert(language === 'he' ? 'אנא הזן שם בעברית או באנגלית תחילה' : 'Please enter a name in Hebrew or English first');
      return;
    }

    setIsGenerating(true);
    setAiError(null);
    try {
      const result = await geminiService.generateCategoryInfo(inputName, formData.sourceContext);
      setFormData(prev => ({
        ...prev,
        ...result
      }));
    } catch (error: any) {
      console.error("Gemini Error:", error);
      const errorMsg = error?.message || 'Unknown error';
      setAiError(errorMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {/* Source Context Section */}
          <div className="p-4 bg-accent-peach/5 rounded-2xl border-2 border-dashed border-accent-peach/20 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-widest text-accent-peach-darker">
                {language === 'he' ? 'מידע נוסף / הקשר למחולל' : 'Additional Info / Context'}
              </label>
              <Sparkles className="w-4 h-4 text-accent-peach" />
            </div>
            <textarea
              value={formData.sourceContext}
              onChange={e => setFormData({ ...formData, sourceContext: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent-peach focus:border-accent-peach transition-all h-24 text-sm shadow-sm"
              placeholder={language === 'he' ? 'הדבק כאן פרטים על הקטגוריה או כל מידע שיעזור ל-AI לדייק' : 'Paste details about the category or any info to help the AI'}
            />
            <Button 
              type="button" 
              variant="primary" 
              onClick={handleMagicGenerate}
              isLoading={isGenerating}
              className="w-full py-2.5 text-xs font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              {language === 'he' ? 'חולל את כל השדות על בסיס המידע' : 'Generate All Fields Based on Info'}
            </Button>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-ink-500 mb-2">
              {language === 'he' ? 'שם בעברית' : 'Name (Hebrew)'}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={formData.name_he}
                onChange={e => setFormData({ ...formData, name_he: e.target.value })}
                className="flex-1 px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent-peach focus:border-accent-peach transition-all shadow-sm"
              />
              <Button 
                type="button" 
                variant="secondary" 
                onClick={handleMagicGenerate}
                isLoading={isGenerating}
                className="px-4"
                title={language === 'he' ? 'ייצור מידע אוטומטי' : 'Auto-generate info'}
              >
                <Wand2 className="w-4 h-4" />
              </Button>
            </div>
            <p className="mt-1.5 text-[10px] text-ink-500 italic">
              {language === 'he' ? 'שם הקטגוריה כפי שיופיע לגולשים בעברית. לחץ על המטה לייצור אוטומטי!' : 'The category name as it will appear to Hebrew users. Click the wand for auto-generation!'}
            </p>
            {aiError && (
              <div className="mt-3 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 whitespace-pre-wrap break-words relative group">
                <button
                  onClick={copyError}
                  type="button"
                  className="absolute top-2 right-2 p-1.5 bg-white/80 hover:bg-white text-red-700 rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  title={language === 'he' ? 'העתק שגיאה' : 'Copy error'}
                >
                  {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                {(aiError.includes('429') || aiError.toLowerCase().includes('quota')) ? (
                  <div className="space-y-1 pr-6">
                    <p className="font-bold text-sm">{language === 'he' ? 'הגעת למגבלת השימוש (Quota) 🛑' : 'Usage Limit Reached (Quota) 🛑'}</p>
                    <p>{language === 'he' ? 'ניצלת את מכסת הבקשות החינמית של המודל הנוכחי. מה אפשר לעשות?' : 'You have reached the free tier limit for the current model. What can you do?'}</p>
                    <ul className="list-disc list-inside mt-1 space-y-0.5">
                      <li>{language === 'he' ? 'להזין את הפרטים ידנית בינתיים.' : 'Fill in the details manually for now.'}</li>
                      <li>{language === 'he' ? 'לשנות למודל אחר (כמו Flash) בטאב ההגדרות.' : 'Switch to a different model (like Flash) in the Settings tab.'}</li>
                      <li>{language === 'he' ? 'להמתין קצת (לפעמים המכסה מתחדשת כל דקה/שעה).' : 'Wait a bit (sometimes the quota resets every minute/hour).'}</li>
                    </ul>
                    <details className="mt-2 cursor-pointer">
                      <summary className="text-[10px] opacity-70 hover:opacity-100">{language === 'he' ? 'הצג שגיאה טכנית' : 'Show technical error'}</summary>
                      <p className="mt-1 text-[10px] opacity-70">{aiError}</p>
                    </details>
                  </div>
                ) : (
                  <div className="pr-6">
                    <span className="font-bold">{language === 'he' ? 'שגיאת מחולל:' : 'Generator Error:'}</span> {aiError}
                  </div>
                )}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-ink-500 mb-2">
              {language === 'he' ? 'שם באנגלית' : 'Name (English)'}
            </label>
            <input
              type="text"
              required
              value={formData.name_en}
              onChange={e => setFormData({ ...formData, name_en: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent-peach focus:border-accent-peach transition-all shadow-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-ink-500 mb-2">
              Slug
            </label>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={e => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-accent-peach focus:border-accent-peach transition-all shadow-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-ink-500 mb-2">
              {language === 'he' ? 'פורמט קישור אוטומטי (למשל: clashgift-)' : 'Auto-slug Format (e.g. clashgift-)'}
            </label>
            <input
              type="text"
              value={formData.slugFormat}
              onChange={e => setFormData({ ...formData, slugFormat: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-accent-peach focus:border-accent-peach transition-all shadow-sm"
              placeholder="clashgift-"
            />
            <p className="mt-1.5 text-[10px] text-ink-500 italic">
              {language === 'he' ? 'אם תגדיר פורמט, המערכת תציע קישור אוטומטי (למשל clashgift-01) בכל פעם שתוסיף קישור לקטגוריה זו.' : 'If set, the system will suggest an auto-slug (e.g. clashgift-01) whenever you add a link to this category.'}
            </p>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-ink-500 mb-2">
              {language === 'he' ? 'כתובת תמונה' : 'Image URL'}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.imageUrl}
                onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                className="flex-1 px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent-peach focus:border-accent-peach transition-all shadow-sm"
                placeholder="https://example.com/image.jpg"
              />
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => {
                  const query = language === 'he' ? formData.name_he : formData.name_en;
                  if (query) {
                    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch`, '_blank');
                  } else {
                    alert(language === 'he' ? 'אנא הזן שם קטגוריה תחילה' : 'Please enter a category name first');
                  }
                }}
                className="px-4"
                title={language === 'he' ? 'חפש תמונה בגוגל' : 'Search image on Google'}
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
            <p className="mt-1.5 text-[10px] text-ink-500 italic">
              {language === 'he' ? 'הדבק קישור לתמונה או חפש בגוגל והעתק את כתובת התמונה' : 'Paste an image URL or search on Google and copy the image address'}
            </p>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-ink-500 mb-2">
              {language === 'he' ? 'סדר תצוגה' : 'Display Order'}
            </label>
            <input
              type="number"
              required
              value={formData.order}
              onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) })}
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent-peach focus:border-accent-peach transition-all shadow-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-ink-500 mb-2">
                {language === 'he' ? 'התאמת תמונה' : 'Image Fit'}
              </label>
              <select
                value={formData.imageFit}
                onChange={e => setFormData({ ...formData, imageFit: e.target.value as any })}
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent-peach transition-all shadow-sm"
              >
                <option value="cover">{language === 'he' ? 'חיתוך (Cover)' : 'Cover'}</option>
                <option value="contain">{language === 'he' ? 'התאמה (Contain)' : 'Contain'}</option>
                <option value="fill">{language === 'he' ? 'מתיחה (Fill)' : 'Fill'}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-ink-500 mb-2">
                {language === 'he' ? 'יישור טקסט' : 'Text Align'}
              </label>
              <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
                {(['left', 'center', 'right'] as const).map((align) => (
                  <button
                    key={align}
                    type="button"
                    onClick={() => setFormData({ ...formData, textAlign: align })}
                    className={cn(
                      "flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all",
                      formData.textAlign === align ? "bg-white text-black shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    {align}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-ink-500">
                {language === 'he' ? 'זום תמונה' : 'Image Zoom'}
              </label>
              <span className="text-[10px] font-mono font-bold text-accent-peach">
                {Math.round(formData.imageZoom)}%
              </span>
            </div>
            <input
              type="range"
              min="100"
              max="300"
              step="10"
              value={formData.imageZoom}
              onChange={e => setFormData({ ...formData, imageZoom: parseFloat(e.target.value) })}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-accent-peach"
            />
          </div>

          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-5 h-5 rounded-lg border-slate-300 text-ink-900 focus:ring-accent-peach"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-ink-700">
                {language === 'he' ? 'פעיל' : 'Active'}
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isComingSoon"
                checked={formData.isComingSoon}
                onChange={e => setFormData({ ...formData, isComingSoon: e.target.checked })}
                className="w-5 h-5 rounded-lg border-slate-300 text-red-600 focus:ring-red-500"
              />
              <label htmlFor="isComingSoon" className="text-sm font-bold text-red-600">
                {language === 'he' ? 'בקרוב' : 'Coming Soon'}
              </label>
            </div>
          </div>
        </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-ink-500 mb-2">
                {language === 'he' ? 'כותרת משנה בעברית' : 'Subtitle (Hebrew)'}
              </label>
              <input
                type="text"
                value={formData.subtitle_he}
                onChange={e => setFormData({ ...formData, subtitle_he: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent-peach focus:border-accent-peach transition-all shadow-sm"
                placeholder={language === 'he' ? 'טקסט קטן מתחת לכותרת' : 'Small text below title'}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-ink-500 mb-2">
                {language === 'he' ? 'כותרת משנה באנגלית' : 'Subtitle (English)'}
              </label>
              <input
                type="text"
                value={formData.subtitle_en}
                onChange={e => setFormData({ ...formData, subtitle_en: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent-peach focus:border-accent-peach transition-all shadow-sm"
                placeholder={language === 'he' ? 'Small text below title' : 'Small text below title'}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="justifySubtitle"
              checked={formData.justifySubtitle}
              onChange={e => setFormData({ ...formData, justifySubtitle: e.target.checked })}
              className="w-5 h-5 rounded-lg border-slate-300 text-ink-900 focus:ring-accent-peach"
            />
            <label htmlFor="justifySubtitle" className="text-sm font-medium text-ink-700">
              {language === 'he' ? 'יישור כותרת משנה לרוחב הכותרת (Justify)' : 'Justify subtitle to title width'}
            </label>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-6">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-accent-peach-darker" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-ink-900">
                {language === 'he' ? 'הגדרות SEO וחיפוש' : 'SEO & Search Settings'}
              </h3>
            </div>

            {/* Hebrew SEO */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  {language === 'he' ? 'SEO בעברית' : 'SEO (Hebrew)'}
                </h4>
                <Button 
                  type="button" 
                  variant="secondary" 
                  size="sm"
                  onClick={() => handleSeoGenerate('he')}
                  isLoading={isGenerating}
                  className="h-8 px-3 text-[10px]"
                >
                  <Wand2 className="w-3 h-3 mr-1.5" />
                  {language === 'he' ? 'ייצר SEO אוטומטי' : 'Auto-generate SEO'}
                </Button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    {language === 'he' ? 'כותרת SEO' : 'SEO Title'}
                  </label>
                  <input
                    type="text"
                    value={formData.seoTitle_he}
                    onChange={e => setFormData({ ...formData, seoTitle_he: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-accent-peach"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    {language === 'he' ? 'תיאור SEO' : 'SEO Description'}
                  </label>
                  <textarea
                    value={formData.seoDescription_he}
                    onChange={e => setFormData({ ...formData, seoDescription_he: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-accent-peach h-20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    {language === 'he' ? 'מילות מפתח' : 'Keywords'}
                  </label>
                  <input
                    type="text"
                    value={formData.seoKeywords_he}
                    onChange={e => setFormData({ ...formData, seoKeywords_he: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-accent-peach"
                  />
                </div>
              </div>
            </div>

            {/* English SEO */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  {language === 'he' ? 'SEO באנגלית' : 'SEO (English)'}
                </h4>
                <Button 
                  type="button" 
                  variant="secondary" 
                  size="sm"
                  onClick={() => handleSeoGenerate('en')}
                  isLoading={isGenerating}
                  className="h-8 px-3 text-[10px]"
                >
                  <Wand2 className="w-3 h-3 mr-1.5" />
                  {language === 'he' ? 'ייצר SEO אוטומטי' : 'Auto-generate SEO'}
                </Button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    {language === 'he' ? 'כותרת SEO' : 'SEO Title'}
                  </label>
                  <input
                    type="text"
                    value={formData.seoTitle_en}
                    onChange={e => setFormData({ ...formData, seoTitle_en: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-accent-peach"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    {language === 'he' ? 'תיאור SEO' : 'SEO Description'}
                  </label>
                  <textarea
                    value={formData.seoDescription_en}
                    onChange={e => setFormData({ ...formData, seoDescription_en: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-accent-peach h-20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    {language === 'he' ? 'מילות מפתח' : 'Keywords'}
                  </label>
                  <input
                    type="text"
                    value={formData.seoKeywords_en}
                    onChange={e => setFormData({ ...formData, seoKeywords_en: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-accent-peach"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1" isLoading={isLoading}>
              {language === 'he' ? 'שמור' : 'Save'}
            </Button>
            <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
              {language === 'he' ? 'ביטול' : 'Cancel'}
            </Button>
          </div>
        </form>

      {/* Preview Section */}
      <div className="space-y-4">
        <label className="block text-xs font-bold uppercase tracking-widest text-ink-500">
          {language === 'he' ? 'תצוגה מקדימה' : 'Preview'}
        </label>
        <div className="w-full max-w-sm aspect-[4/3] relative overflow-hidden rounded-3xl p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-[#FFD23F]">
          {formData.imageUrl && (
            <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
              <img 
                src={formData.imageUrl} 
                alt="" 
                style={{ 
                  objectFit: formData.imageFit as any,
                  transform: `scale(${formData.imageZoom / 100})`
                }}
                className="w-full h-full opacity-90 transition-all duration-300" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            </div>
          )}

          {/* Coming Soon Label */}
          {formData.isComingSoon && (
            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
              <div className="bg-red-600/90 backdrop-blur-sm text-white text-[12px] font-black uppercase tracking-widest py-2 px-6 border-2 border-white shadow-xl -rotate-12">
                {language === 'he' ? 'בקרוב' : 'COMING SOON'}
              </div>
            </div>
          )}

          <div className={cn(
            "relative z-10 h-full flex flex-col justify-between text-white drop-shadow-md",
            formData.textAlign === 'left' ? "text-left" : formData.textAlign === 'center' ? "text-center" : "text-right"
          )}>
            <div className={cn("flex items-start", formData.textAlign === 'left' ? "justify-between" : formData.textAlign === 'center' ? "justify-center gap-4" : "justify-between flex-row-reverse")}>
              <div className="bg-white/90 backdrop-blur-sm border border-black p-1.5 rounded-lg">
                <Sparkles className="w-3 h-3 text-black" />
              </div>
              <div className="bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                0
              </div>
            </div>
            
            <div className={cn("flex flex-col", formData.textAlign === 'center' ? "items-center" : formData.textAlign === 'left' ? "items-start" : "items-end")}>
              <h3 className="text-xl font-black uppercase leading-none mb-1">
                {language === 'he' ? (formData.name_he || 'שם קטגוריה') : (formData.name_en || 'Category Name')}
              </h3>
              {(language === 'he' ? formData.subtitle_he : formData.subtitle_en) && (
                <p className={cn(
                  "text-[10px] font-bold uppercase tracking-wider mb-1",
                  formData.justifySubtitle ? "w-full flex justify-between" : ""
                )}>
                  {formData.justifySubtitle ? (
                    (language === 'he' ? formData.subtitle_he : formData.subtitle_en)?.split('').map((char, i) => (
                      <span key={i}>{char === ' ' ? '\u00A0' : char}</span>
                    ))
                  ) : (
                    language === 'he' ? formData.subtitle_he : formData.subtitle_en
                  )}
                </p>
              )}
              <div className="w-8 h-0.5 bg-white rounded-full" />
            </div>
          </div>
        </div>
        <p className="text-[10px] text-ink-500 italic">
          {language === 'he' ? 'כך ייראה הבלוק של הקטגוריה בדף הבית' : 'This is how the category block will look on the home page'}
        </p>
      </div>
    </div>
  );
}
