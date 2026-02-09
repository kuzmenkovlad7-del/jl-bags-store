'use client';

import { useParams } from 'next/navigation';

export type AppLocale = 'uk' | 'ru';

export function useLocale(): AppLocale {
  const params = useParams<{ locale?: string }>();
  const locale = String(params?.locale ?? 'uk').toLowerCase();
  return locale === 'ru' ? 'ru' : 'uk';
}
