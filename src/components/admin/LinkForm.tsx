import React, { useState } from 'react';
import { Link, Category } from '../../types';
import { Button } from '../ui/Button';
import { useLanguageStore } from '../../store/languageStore';
import { Wand2, ClipboardPaste, X, Plus, Loader2, Copy, Check, Search } from 'lucide-react';
import { geminiService } from '../../services/geminiService';
import { generateSeoMetadata } from '../../services/seoService';
import { cn } from '../../utils/cn';

interface LinkFormProps {
  categories: Category[];
  initialData?: Partial<Link>;
  onSubmit: (data: Omit<Link, 'id' | 'createdAt' | 'clicks'>) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  customPrompt?: string;
  settings?: any;
  setSettings?: (settings: any) => void;
}

export function LinkForm({ categories, initialData, onSubmit, onCancel, isLoading, customPrompt, settings, setSettings }: LinkFormProps) {
  const { language } = useLanguageStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingField, setGeneratingField] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [aiError, setAiError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [selectedModel, setSelectedModel] = useState(settings?.aiModel || "gemini-3-flash-preview");
  const [quotaExceededModels, setQuotaExceededModels] = useState<string[]>([]);

  const copyError = () => {
    if (aiError) {
      navigator.clipboard.writeText(aiError);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleModelChange = (newModel: string) => {
    setSelectedModel(newModel);
  };

  const saveSettings = () => {
    if (setSettings && settings) {
      setSettings({ ...settings, aiModel: selectedModel });
    }
    setAiError(null);
  };

  const [formData, setFormData] = useState({
    title_he: initialData?.title_he || '',
    title_en: initialData?.title_en || '',
    subtitle_he: initialData?.subtitle_he || '',
    subtitle_en: initialData?.subtitle_en || '',
    description_he: initialData?.description_he || '',
    description_en: initialData?.description_en || '',
    targetUrl: initialData?.targetUrl || '',
    imageUrl: initialData?.imageUrl || '',
    categoryId: initialData?.categoryId || (categories[0]?.id || ''),
    isActive: initialData?.isActive ?? true,
    tags: initialData?.tags || [],
    textAlign: initialData?.textAlign || 'right',
    seoTitle_he: initialData?.seoTitle_he || '',
    seoTitle_en: initialData?.seoTitle_en || '',
    seoDescription_he: initialData?.seoDescription_he || '',
    seoDescription_en: initialData?.seoDescription_en || '',
    seoKeywords_he: initialData?.seoKeywords_he || '',
    seoKeywords_en: initialData?.seoKeywords_en || '',
  });

  // Reset image error when URL changes
  React.useEffect(() => {
    setImageError(false);
  }, [formData.imageUrl]);

  const handleMagicGenerate = async (specificField?: string) => {
    if (!formData.targetUrl) {
      alert(language === 'he' ? 'אנא הזן כתובת URL תחילה' : 'Please enter a URL first');
      return;
    }

    setAiError(null);

    if (specificField === 'seo_he' || specificField === 'seo_en') {
      setGeneratingField(specificField);
    } else if (specificField) {
      setGeneratingField(specificField);
    } else {
      setIsGenerating(true);
    }

    if (specificField === 'imageUrl') setImageError(false);

    try {
      if (specificField === 'seo_he' || specificField === 'seo_en') {
        const lang = specificField === 'seo_he' ? 'he' : 'en';
        const seo = await generateSeoMetadata({
          title: lang === 'he' ? formData.title_he : formData.title_en,
          description: lang === 'he' ? formData.description_he : formData.description_en,
          subtitle: lang === 'he' ? formData.subtitle_he : formData.subtitle_en,
          tags: formData.tags
        }, lang);
        
        setFormData(prev => ({
          ...prev,
          [`seoTitle_${lang}`]: seo.title,
          [`seoDescription_${lang}`]: seo.description,
          [`seoKeywords_${lang}`]: seo.keywords,
        }));
        return;
      }

      const result = await geminiService.generateLinkInfo(formData.targetUrl, customPrompt, specificField);
      
      setFormData(prev => {
        const newData = { ...prev };
        if (specificField) {
          // Update only the specific field
          if (specificField === 'tags' && result.tags) {
             // Merge tags instead of replacing if desired, or replace. Let's replace for now as it's "regenerate"
             newData.tags = result.tags;
          } else {
             // @ts-ignore
             newData[specificField] = result[specificField];
          }
        } else {
          // Update all fields
          return {
            ...prev,
            ...result,
            imageUrl: result.imageUrl || prev.imageUrl,
            tags: result.tags || prev.tags
          };
        }
        return newData;
      });
    } catch (error: any) {
      console.error("Gemini Error:", error);
      const errorMsg = error?.message || 'Unknown error';
      setAiError(errorMsg);
      if (errorMsg.includes('429') || errorMsg.toLowerCase().includes('quota')) {
        setQuotaExceededModels(prev => [...new Set([...prev, error.modelName || selectedModel])]);
      }
    } finally {
      setIsGenerating(false);
      setGeneratingField(null);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setFormData(prev => ({ ...prev, targetUrl: text }));
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    if (formData.tags.includes(tagInput.trim())) {
      setTagInput('');
      return;
    }
    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, tagInput.trim()]
    }));
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const FieldGeneratorButton = ({ field }: { field: string }) => (
    <button
      type="button"
      onClick={() => handleMagicGenerate(field)}
      disabled={!!generatingField || isGenerating}
      className="p-1.5 text-accent-peach-darker hover:bg-accent-peach/10 rounded-lg transition-colors disabled:opacity-50"
      title={language === 'he' ? 'צור מחדש שדה זה' : 'Regenerate this field'}
    >
      {generatingField === field ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Wand2 className="w-3.5 h-3.5" />
      )}
    </button>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* URL Section First */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-ink-500 mb-2">
            {language === 'he' ? 'כתובת יעד (URL)' : 'Target URL'}
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              required
              value={formData.targetUrl}
              onChange={e => setFormData({ ...formData, targetUrl: e.target.value })}
              className="flex-1 px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent-peach focus:border-accent-peach transition-all shadow-sm"
              placeholder="https://..."
            />
            <Button 
              type="button" 
              variant="secondary" 
              onClick={handlePaste}
              className="px-4"
              title={language === 'he' ? 'הדבק' : 'Paste'}
            >
              <ClipboardPaste className="w-4 h-4" />
            </Button>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => handleMagicGenerate()}
              isLoading={isGenerating && !generatingField}
              className="px-4"
              title={language === 'he' ? 'ייצור מידע אוטומטי' : 'Auto-generate info'}
            >
              <Wand2 className="w-4 h-4" />
            </Button>
          </div>
          <p className="mt-1.5 text-[10px] text-ink-500 italic">
            {language === 'he' ? 'הקישור החיצוני שאליו המשתמש יופנה. לחץ על המטה הקסם לייצור אוטומטי!' : 'The external link the user will be redirected to. Click the magic wand for auto-generation!'}
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
                <div className="space-y-2 pr-6">
                  <p className="font-bold text-sm">{language === 'he' ? 'הגעת למגבלת השימוש (Quota) 🛑' : 'Usage Limit Reached (Quota) 🛑'}</p>
                  <p className="text-xs">
                    {language === 'he' 
                      ? `המודל הנוכחי (${selectedModel}) הגיע למכסה. נסה מודל אחר:` 
                      : `The current model (${selectedModel}) has reached its quota. Try another model:`}
                  </p>
                  <div className="flex gap-2 items-center">
                    <select
                      className="text-xs p-1.5 rounded border border-gray-300 bg-white"
                      value={selectedModel}
                      onChange={(e) => handleModelChange(e.target.value)}
                    >
                      <option value="gemini-3-flash-preview" className={quotaExceededModels.includes('gemini-3-flash-preview') ? 'text-red-500' : ''}>
                        Gemini 3 Flash {quotaExceededModels.includes('gemini-3-flash-preview') ? '(Quota Exceeded)' : ''}
                      </option>
                      <option value="gemini-2.5-flash" className={quotaExceededModels.includes('gemini-2.5-flash') ? 'text-red-500' : ''}>
                        Gemini 2.5 Flash {quotaExceededModels.includes('gemini-2.5-flash') ? '(Quota Exceeded)' : ''}
                      </option>
                      <option value="gemini-3.1-pro-preview" className={quotaExceededModels.includes('gemini-3.1-pro-preview') ? 'text-red-500' : ''}>
                        Gemini 3.1 Pro {quotaExceededModels.includes('gemini-3.1-pro-preview') ? '(Quota Exceeded)' : ''}
                      </option>
                    </select>
                    <Button size="sm" className="h-7 text-xs" onClick={saveSettings}>{language === 'he' ? 'שמור' : 'Save'}</Button>
                    <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => setAiError(null)}>{language === 'he' ? 'ביטול' : 'Cancel'}</Button>
                  </div>
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
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-ink-500">
              {language === 'he' ? 'כתובת תמונה (URL)' : 'Image URL'}
            </label>
            <FieldGeneratorButton field="imageUrl" />
          </div>
          <div className="flex gap-4 items-start">
            <div className="flex-1">
              <input
                type="url"
                value={formData.imageUrl}
                onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent-peach focus:border-accent-peach transition-all shadow-sm"
                placeholder="https://..."
              />
              <p className="mt-1.5 text-[10px] text-ink-500 italic">
                {language === 'he' ? 'כתובת ישירה לתמונה. השאר ריק לשימוש בתמונה אקראית.' : 'Direct URL to an image. Leave empty for random image.'}
              </p>
            </div>
            {formData.imageUrl && (
              <div className="relative group">
                <div className={cn(
                  "w-32 h-32 rounded-xl border-2 border-dashed overflow-hidden bg-gray-50 shrink-0 flex items-center justify-center transition-colors",
                  imageError ? "border-red-300 bg-red-50" : "border-slate-300"
                )}>
                  {!imageError ? (
                    <img 
                      src={formData.imageUrl} 
                      alt="Preview" 
                      className="w-full h-full object-contain" 
                      onError={() => setImageError(true)} 
                    />
                  ) : (
                    <div className="text-center p-2">
                       <span className="text-xs text-red-500 font-bold block mb-1">
                        {language === 'he' ? 'שגיאה בטעינה' : 'Load Error'}
                      </span>
                      <span className="text-[9px] text-red-400 leading-tight block">
                        {language === 'he' ? 'הקישור אינו תקין' : 'Invalid URL'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-6 left-0 right-0 text-center text-[10px] text-ink-400">
                  {language === 'he' ? 'תצוגה מקדימה' : 'Preview'}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-ink-500">
                {language === 'he' ? 'כותרת בעברית' : 'Title (Hebrew)'}
              </label>
              <FieldGeneratorButton field="title_he" />
            </div>
            <input
              type="text"
              required
              value={formData.title_he}
              onChange={e => setFormData({ ...formData, title_he: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent-peach focus:border-accent-peach transition-all shadow-sm"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-ink-500">
                {language === 'he' ? 'כותרת באנגלית' : 'Title (English)'}
              </label>
              <FieldGeneratorButton field="title_en" />
            </div>
            <input
              type="text"
              required
              value={formData.title_en}
              onChange={e => setFormData({ ...formData, title_en: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent-peach focus:border-accent-peach transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-ink-500">
                {language === 'he' ? 'תיאור משנה בעברית' : 'Subtitle (Hebrew)'}
              </label>
              <FieldGeneratorButton field="subtitle_he" />
            </div>
            <input
              type="text"
              value={formData.subtitle_he}
              onChange={e => setFormData({ ...formData, subtitle_he: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent-peach focus:border-accent-peach transition-all shadow-sm"
              placeholder={language === 'he' ? 'למשל: צפייה באנימה בעברית' : 'e.g., Watch Anime in Hebrew'}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-ink-500">
                {language === 'he' ? 'תיאור משנה באנגלית' : 'Subtitle (English)'}
              </label>
              <FieldGeneratorButton field="subtitle_en" />
            </div>
            <input
              type="text"
              value={formData.subtitle_en}
              onChange={e => setFormData({ ...formData, subtitle_en: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent-peach focus:border-accent-peach transition-all shadow-sm"
              placeholder={language === 'he' ? 'למשל: Watch Anime in Hebrew' : 'e.g., Watch Anime in Hebrew'}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-ink-500">
              {language === 'he' ? 'תיאור בעברית' : 'Description (Hebrew)'}
            </label>
            <FieldGeneratorButton field="description_he" />
          </div>
          <textarea
            value={formData.description_he}
            onChange={e => setFormData({ ...formData, description_he: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent-peach focus:border-accent-peach transition-all h-24 shadow-sm"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-ink-500">
              {language === 'he' ? 'תיאור באנגלית' : 'Description (English)'}
            </label>
            <FieldGeneratorButton field="description_en" />
          </div>
          <textarea
            value={formData.description_en}
            onChange={e => setFormData({ ...formData, description_en: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent-peach focus:border-accent-peach transition-all h-24 shadow-sm"
          />
        </div>

        {/* Tags Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-ink-500">
              {language === 'he' ? 'תגיות' : 'Tags'}
            </label>
            <FieldGeneratorButton field="tags" />
          </div>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              className="flex-1 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent-peach text-sm"
              placeholder={language === 'he' ? 'הוסף תגית...' : 'Add tag...'}
            />
            <Button type="button" variant="secondary" onClick={handleAddTag} className="px-3">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.tags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-xs font-medium text-ink-700 border border-gray-200">
                {tag}
                <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-ink-500 mb-2">
              {language === 'he' ? 'קטגוריה' : 'Category'}
            </label>
            <select
              required
              value={formData.categoryId}
              onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent-peach focus:border-accent-peach transition-all shadow-sm"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {language === 'he' ? cat.name_he : cat.name_en}
                </option>
              ))}
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
        </div>

        {/* SEO Section */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-4 h-4 text-accent-peach-darker" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-ink-900">
              {language === 'he' ? 'הגדרות SEO וחיפוש' : 'SEO & Search Settings'}
            </h3>
          </div>

          <div className="space-y-6">
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
                  onClick={() => handleMagicGenerate('seo_he')}
                  isLoading={generatingField === 'seo_he'}
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
                    placeholder={language === 'he' ? 'כותרת שתוצג בגוגל' : 'Title for Google'}
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
                    placeholder={language === 'he' ? 'תיאור שיופיע בתוצאות החיפוש' : 'Description for search results'}
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
                    placeholder={language === 'he' ? 'מילה1, מילה2...' : 'keyword1, keyword2...'}
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
                  onClick={() => handleMagicGenerate('seo_en')}
                  isLoading={generatingField === 'seo_en'}
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
                    placeholder={language === 'he' ? 'Title for Google' : 'Title for Google'}
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
                    placeholder={language === 'he' ? 'Description for search results' : 'Description for search results'}
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
                    placeholder={language === 'he' ? 'keyword1, keyword2...' : 'keyword1, keyword2...'}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

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

        <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1" isLoading={isLoading}>
          {language === 'he' ? 'שמור' : 'Save'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          {language === 'he' ? 'ביטול' : 'Cancel'}
        </Button>
      </div>
    </form>
  );
}
