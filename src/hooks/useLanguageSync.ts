/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { useLanguageStore } from '../store/languageStore';

export function useLanguageSync() {
  const { language, isRTL } = useLanguageStore();

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  }, [language, isRTL]);
}
