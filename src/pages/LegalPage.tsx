/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguageStore } from '../store/languageStore';
import { useDataStore } from '../store/dataStore';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Shield, FileText, Accessibility, Info } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../utils/cn';

export default function LegalPage() {
  const { type } = useParams<{ type: string }>();
  const { language, isRTL } = useLanguageStore();
  const { settings, fetchData } = useDataStore();
  const [content, setContent] = useState<string>('');
  const [title, setTitle] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!settings) return;

    switch (type) {
      case 'privacy':
        setTitle(language === 'he' ? 'מדיניות פרטיות' : 'Privacy Policy');
        setContent(language === 'he' ? settings.privacyPolicy_he || '' : settings.privacyPolicy_en || '');
        break;
      case 'terms':
        setTitle(language === 'he' ? 'תנאי שימוש' : 'Terms of Use');
        setContent(language === 'he' ? settings.termsOfUse_he || '' : settings.termsOfUse_en || '');
        break;
      case 'accessibility':
        setTitle(language === 'he' ? 'הצהרת נגישות' : 'Accessibility Statement');
        setContent(language === 'he' ? settings.accessibility_he || '' : settings.accessibility_en || '');
        break;
      default:
        setTitle('');
        setContent('');
    }
  }, [type, settings, language]);

  const getIcon = () => {
    switch (type) {
      case 'privacy': return <Shield className="w-8 h-8 text-accent-peach" />;
      case 'terms': return <FileText className="w-8 h-8 text-accent-peach" />;
      case 'accessibility': return <Accessibility className="w-8 h-8 text-accent-peach" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-bg-soft pb-20">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-black/5 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-ink-900 font-bold hover:opacity-70 transition-opacity">
            {isRTL ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
            <span className="text-sm uppercase tracking-tight">{language === 'he' ? 'חזרה לדף הבית' : 'Back to Home'}</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-white shadow-sm border border-black/5 flex items-center justify-center">
              {getIcon()}
            </div>
            <h1 className="text-3xl font-black text-ink-900 uppercase tracking-tight">
              {title}
            </h1>
          </div>

          <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-sm border border-black/5">
            {content ? (
              <div 
                className="prose prose-sm md:prose-base max-w-none text-ink-700 leading-relaxed prose-headings:text-ink-900 prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-a:text-accent-peach prose-strong:text-ink-900"
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            ) : (
              <div className="text-center py-12 text-ink-400 italic">
                {language === 'he' ? 'התוכן טרם עודכן במערכת.' : 'Content has not been updated yet.'}
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
