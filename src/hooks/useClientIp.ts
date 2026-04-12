/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';

export const useClientIp = () => {
  const [ip, setIp] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchIp = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        setIp(data.ip);
      } catch (error) {
        console.error('Failed to fetch client IP:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchIp();
  }, []);

  return { ip, isLoading };
};
