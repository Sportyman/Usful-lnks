/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { useDataStore } from '../store/dataStore';

export const ClarityTracker = () => {
  const { settings } = useDataStore();

  useEffect(() => {
    if (!settings?.clarityId) return;

    const scriptId = 'clarity-script';
    if (document.getElementById(scriptId)) return;

    const script = document.createElement('script');
    script.id = scriptId;
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = `
      (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${settings.clarityId}");
    `;
    document.head.appendChild(script);

    return () => {
      // We don't necessarily need to remove it on unmount if it's a global tracker,
      // but if the ID changes we might want to.
    };
  }, [settings?.clarityId]);

  return null;
};
