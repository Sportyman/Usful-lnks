import React, { useState } from 'react';
import { Link, Category } from '../../types';
import { Button } from '../ui/Button';
import { useLanguageStore } from '../../store/languageStore';
import { Wand2, ClipboardPaste } from 'lucide-react';
import { geminiService } from '../../services/geminiService';

interface LinkFormProps {
  categories: Category[];
  initialData?: Partial<Link>;
  onSubmit: (data: Omit<Link, 'id' | 'createdAt' | 'clicks'>) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  customPrompt?: string;
}

export function LinkForm({ categories, initialData, onSubmit, onCancel, isLoading, customPrompt }: LinkFormProps) {
  const { language } = useLanguageStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    title_he: initialData?.title_he || '',
    title_en: initialData?.title_en || '',
    description_he: initialData?.description_he || '',
    description_en: initialData?.description_en || '',
    targetUrl: initialData?.targetUrl || '',
    imageUrl: initialData?.imageUrl || '',
    categoryId: initialData?.categoryId || (categories[0]?.id || ''),
    isActive: initialData?.isActive ?? true,
  });

  const handleMagicGenerate = async () => {
    if (!formData.targetUrl) {
      alert(language === 'he' ? 'אנא הזן כתובת URL תחילה' : 'Please enter a URL first');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await geminiService.generateLinkInfo(formData.targetUrl, customPrompt);
      setFormData(prev => ({
        ...prev,
        ...result,
        imageUrl: result.imageUrl || prev.imageUrl // Keep existing if not found
      }));
    } catch (error) {
      console.error(error);
      alert(language === 'he' ? 'נכשלנו בייצור המידע. וודא שמפתח ה-API מוגדר.' : 'Failed to generate info. Ensure API Key is set.');
    } finally {
      setIsGenerating(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

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
              onClick={handleMagicGenerate}
              isLoading={isGenerating}
              className="px-4"
              title={language === 'he' ? 'ייצור מידע אוטומטי' : 'Auto-generate info'}
            >
              <Wand2 className="w-4 h-4" />
            </Button>
          </div>
          <p className="mt-1.5 text-[10px] text-ink-500 italic">
            {language === 'he' ? 'הקישור החיצוני שאליו המשתמש יופנה. לחץ על המטה הקסם לייצור אוטומטי!' : 'The external link the user will be redirected to. Click the magic wand for auto-generation!'}
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-ink-500 mb-2">
            {language === 'he' ? 'כתובת תמונה (URL)' : 'Image URL'}
          </label>
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
                <div className="w-32 h-32 rounded-xl border-2 border-dashed border-slate-300 overflow-hidden bg-gray-50 shrink-0 flex items-center justify-center">
                  <img 
                    src={formData.imageUrl} 
                    alt="Preview" 
                    className="w-full h-full object-contain" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement?.classList.add('bg-red-50', 'border-red-300');
                    }} 
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-red-500 font-bold hidden group-has-[img[style*='display: none']]:flex">
                    {language === 'he' ? 'שגיאה בטעינה' : 'Load Error'}
                  </div>
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
            <label className="block text-xs font-bold uppercase tracking-widest text-ink-500 mb-2">
              {language === 'he' ? 'כותרת בעברית' : 'Title (Hebrew)'}
            </label>
            <input
              type="text"
              required
              value={formData.title_he}
              onChange={e => setFormData({ ...formData, title_he: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent-peach focus:border-accent-peach transition-all shadow-sm"
            />
            <p className="mt-1.5 text-[10px] text-ink-500 italic">
              {language === 'he' ? 'שם המתנה/הכלי כפי שיופיע לגולשים בעברית' : 'The gift/tool title as it will appear to Hebrew users'}
            </p>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-ink-500 mb-2">
              {language === 'he' ? 'כותרת באנגלית' : 'Title (English)'}
            </label>
            <input
              type="text"
              required
              value={formData.title_en}
              onChange={e => setFormData({ ...formData, title_en: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent-peach focus:border-accent-peach transition-all shadow-sm"
            />
            <p className="mt-1.5 text-[10px] text-ink-500 italic">
              {language === 'he' ? 'שם המתנה/הכלי כפי שיופיע לגולשים באנגלית' : 'The gift/tool title as it will appear to English users'}
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-ink-500 mb-2">
            {language === 'he' ? 'תיאור בעברית' : 'Description (Hebrew)'}
          </label>
          <textarea
            value={formData.description_he}
            onChange={e => setFormData({ ...formData, description_he: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent-peach focus:border-accent-peach transition-all h-24 shadow-sm"
          />
          <p className="mt-1.5 text-[10px] text-ink-500 italic">
            {language === 'he' ? 'תיאור קצר ומזמין של המתנה' : 'A short and inviting description of the gift'}
          </p>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-ink-500 mb-2">
            {language === 'he' ? 'תיאור באנגלית' : 'Description (English)'}
          </label>
          <textarea
            value={formData.description_en}
            onChange={e => setFormData({ ...formData, description_en: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent-peach focus:border-accent-peach transition-all h-24 shadow-sm"
          />
          <p className="mt-1.5 text-[10px] text-ink-500 italic">
            {language === 'he' ? 'תיאור קצר ומזמין באנגלית' : 'A short and inviting description in English'}
          </p>
        </div>

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
          <p className="mt-1.5 text-[10px] text-ink-500 italic">
            {language === 'he' ? 'בחר את הקטגוריה המתאימה ביותר' : 'Select the most appropriate category'}
          </p>
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
