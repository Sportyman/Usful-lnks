/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useLanguageStore } from '../../store/languageStore';
import { cn } from '../../utils/cn';
import { motion } from 'motion/react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group cursor-pointer flex flex-col gap-3',
        className
      )}
    >
      {children}
    </div>
  );
}
