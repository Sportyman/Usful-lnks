import React, { useState } from 'react';
import { Category } from '../../types';
import { Button } from '../ui/Button';
import { useLanguageStore } from '../../store/languageStore';
import { Wand2 } from 'lucide-react';
import { geminiService } from '../../services/geminiService';

interface CategoryFormProps {
  initialData?: Partial<Category>;
  onSubmit: (data: Omit<Category, 'id'>) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export function CategoryForm({ initialData, onSubmit, onCancel, isLoading }: CategoryFormProps) {
  const { language } = useLanguageStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    name_he: initialData?.name_he || '',
    name_en: initialData?.name_en || '',
    slug: initialData?.slug || '',
    order: initialData?.order || 0,
    isActive: initialData?.isActive ?? true,
  });

  const handleMagicGenerate = async () => {
    const inputName = formData.name_he || formData.name_en;
    if (!inputName) {
      alert(language === 'he' ? 'אנא הזן שם בעברית או באנגלית תחילה' : 'Please enter a name in Hebrew or English first');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await geminiService.generateCategoryInfo(inputName);
      setFormData(prev => ({
        ...prev,
        ...result
      }));
    } catch (error: any) {
      console.error("Gemini Error:", error);
      const errorMsg = error?.message || 'Unknown error';
      alert(language === 'he' ? `נכשלנו בייצור המידע. שגיאה: ${errorMsg}` : `Failed to generate info. Error: ${errorMsg}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
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
          <p className="mt-1.5 text-[10px] text-ink-500 italic">
            {language === 'he' ? 'שם הקטגוריה כפי שיופיע לגולשים באנגלית' : 'The category name as it will appear to English users'}
          </p>
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
          <p className="mt-1.5 text-[10px] text-ink-500 italic">
            {language === 'he' ? 'מזהה באנגלית לכתובת ה-URL (למשל: digital-gifts)' : 'URL identifier in English (e.g., digital-gifts)'}
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
          <p className="mt-1.5 text-[10px] text-ink-500 italic">
            {language === 'he' ? 'מספר הקובע את סדר הופעת הקטגוריות (נמוך מופיע קודם)' : 'Number that determines the category order (lower appears first)'}
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
