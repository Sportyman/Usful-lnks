/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useLanguageStore } from '../../store/languageStore';
import { Button } from '../ui/Button';
import { Globe } from 'lucide-react';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguageStore();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLanguage(language === 'he' ? 'en' : 'he')}
      className="flex items-center gap-1.5 px-2 py-1 h-8 text-xs font-bold uppercase tracking-wide"
    >
      <Globe className="w-3.5 h-3.5" />
      <span>{language === 'he' ? 'EN' : 'עב'}</span>
    </Button>
  );
}
