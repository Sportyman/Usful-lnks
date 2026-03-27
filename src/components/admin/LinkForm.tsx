import React, { useState } from 'react';
import { Link, Category } from '../../types';
import { Button } from '../ui/Button';
import { useLanguageStore } from '../../store/languageStore';
import { Wand2, ClipboardPaste, X, Plus, Loader2 } from 'lucide-react';
import { geminiService } from '../../services/geminiService';
import { cn } from '../../utils/cn';

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
  const [generatingField, setGeneratingField] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [tagInput, setTagInput] = useState('');
  
  const [formData, setFormData] = useState({
    title_he: initialData?.title_he || '',
    title_en: initialData?.title_en || '',
    description_he: initialData?.description_he || '',
    description_en: initialData?.description_en || '',
    targetUrl: initialData?.targetUrl || '',
    imageUrl: initialData?.imageUrl || '',
    categoryId: initialData?.categoryId || (categories[0]?.id || ''),
    isActive: initialData?.isActive ?? true,
    tags: initialData?.tags || [],
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

    if (specificField) {
      setGeneratingField(specificField);
    } else {
      setIsGenerating(true);
    }

    if (specificField === 'imageUrl') setImageError(false);

    try {
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
      alert(language === 'he' ? `נכשלנו בייצור המידע. שגיאה: ${errorMsg}` : `Failed to generate info. Error: ${errorMsg}`);
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
