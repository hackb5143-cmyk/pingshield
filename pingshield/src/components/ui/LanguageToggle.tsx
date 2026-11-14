'use client';

import React from 'react';
import { getLanguages, type Language } from '@/lib/i18n';

interface LanguageToggleProps {
  lang: Language;
  onChange: (lang: Language) => void;
  className?: string;
}

export default function LanguageToggle({ lang, onChange, className = '' }: LanguageToggleProps) {
  const languages = getLanguages();

  return (
    <div className={`inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1 ${className}`}>
      {languages.map((l) => (
        <button
          key={l.code}
          onClick={() => onChange(l.code)}
          className={[
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            lang === l.code
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700',
          ].join(' ')}
          aria-pressed={lang === l.code}
        >
          {l.name}
        </button>
      ))}
    </div>
  );
}
