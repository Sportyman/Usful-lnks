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
      className="flex items-center gap-2"
    >
      <Globe className="w-4 h-4" />
      <span>{language === 'he' ? 'English' : 'עברית'}</span>
    </Button>
  );
}
