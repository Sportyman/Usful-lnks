import React, { useState, useEffect } from 'react';
import { settingsService } from '../../services/settingsService';
import { DEFAULT_LINK_PROMPT, DEFAULT_CATEGORY_PROMPT } from '../../services/geminiService';
import { GlobalSettings } from '../../types';
import { Button } from '../ui/Button';
import { Save, RotateCcw, Info, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export const PromptEditorTab: React.FC = () => {
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prompts, setPrompts] = useState({
    links: '',
    categories: ''
  });
  const [model, setModel] = useState("gemini-3-flash-preview");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await settingsService.getGlobalSettings();
      setSettings(data);
      setPrompts({
        links: data.aiPromptLinks || DEFAULT_LINK_PROMPT,
        categories: data.aiPromptCategories || DEFAULT_CATEGORY_PROMPT
      });
      setModel(data.aiModel || "gemini-3-flash-preview");
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await settingsService.updateGlobalSettings({
        ...settings,
        aiPromptLinks: prompts.links,
        aiPromptCategories: prompts.categories,
        aiModel: model
      });
      toast.success('AI settings updated successfully');
    } catch (error) {
      toast.error('Failed to update prompts');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = (type: 'links' | 'categories') => {
    if (type === 'links') {
      setPrompts(prev => ({ ...prev, links: DEFAULT_LINK_PROMPT }));
    } else {
      setPrompts(prev => ({ ...prev, categories: DEFAULT_CATEGORY_PROMPT }));
    }
    toast.info('Prompt reset to default (save to apply)');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-ink-900 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-8 px-4">
      <div className="bg-ink-50 border border-ink-200 p-6 rounded-3xl">
        <div className="flex items-start gap-4">
          <div className="bg-white p-2 rounded-xl shadow-sm">
            <Sparkles className="w-6 h-6 text-brand-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-ink-900">AI Prompt Management</h3>
            <p className="text-sm text-ink-500 mt-1 leading-relaxed">
              Customize how the AI generates content for your site. These prompts instruct the AI on how to act as an expert SEO manager.
              Use <code className="bg-white px-1.5 py-0.5 rounded border border-ink-200 text-brand-600 font-mono">{"{{url}}"}</code> in link prompts and <code className="bg-white px-1.5 py-0.5 rounded border border-ink-200 text-brand-600 font-mono">{"{{name}}"}</code> in category prompts as placeholders.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Model Selector */}
        <div className="bg-white p-8 rounded-3xl border border-ink-100 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-ink-900">Primary AI Model</h2>
              <p className="text-sm text-ink-500 mt-1">
                Select the Gemini model to use for content generation. Flash models are recommended for speed and cost.
              </p>
            </div>
            <div className="w-full md:w-72">
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full p-4 bg-ink-50 border border-ink-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-mono"
              >
                <option value="gemini-3-flash-preview">Gemini 3 Flash (Fast & Free)</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Stable)</option>
                <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (High Quality)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Links Prompt */}
        <div className="bg-white p-8 rounded-3xl border border-ink-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-ink-900">Link Generation Prompt</h2>
              <p className="text-sm text-ink-500">Used when adding or optimizing individual links.</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => resetToDefault('links')}
              className="rounded-xl"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Default
            </Button>
          </div>
          <textarea
            value={prompts.links}
            onChange={(e) => setPrompts(prev => ({ ...prev, links: e.target.value }))}
            className="w-full h-80 p-6 border border-ink-100 rounded-2xl font-mono text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-ink-50/30 resize-y"
            placeholder="Enter prompt template for links..."
          />
        </div>

        {/* Categories Prompt */}
        <div className="bg-white p-8 rounded-3xl border border-ink-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-ink-900">Category Generation Prompt</h2>
              <p className="text-sm text-ink-500">Used when generating SEO info for categories.</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => resetToDefault('categories')}
              className="rounded-xl"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Default
            </Button>
          </div>
          <textarea
            value={prompts.categories}
            onChange={(e) => setPrompts(prev => ({ ...prev, categories: e.target.value }))}
            className="w-full h-64 p-6 border border-ink-100 rounded-2xl font-mono text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-ink-50/30 resize-y"
            placeholder="Enter prompt template for categories..."
          />
        </div>

        <div className="flex justify-end pt-4">
          <Button 
            onClick={handleSave} 
            isLoading={saving}
            className="bg-ink-900 hover:bg-brand-600 text-white px-10 py-4 rounded-2xl shadow-lg shadow-ink-900/10"
          >
            <Save className="w-5 h-5 mr-2" />
            Save All Prompts
          </Button>
        </div>
      </div>
    </div>
  );
};
