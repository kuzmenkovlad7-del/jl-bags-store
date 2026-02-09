'use client';

import * as React from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface UniqueAccordionItem {
  id: string;
  title: string;
  content: string;
}

interface UniqueAccordionProps {
  items: UniqueAccordionItem[];
  defaultActiveId?: string;
  className?: string;
}

export function UniqueAccordion({ items, defaultActiveId, className }: UniqueAccordionProps) {
  const [activeId, setActiveId] = React.useState<string | null>(
    defaultActiveId ?? (items[0]?.id ?? null)
  );

  const toggle = (id: string) => {
    setActiveId((prev) => (prev === id ? null : id));
  };

  return (
    <div className={cn('w-full border-y border-gray-200', className)}>
      {items.map((item, index) => {
        const isActive = activeId === item.id;
        const num = String(index + 1).padStart(2, '0');

        return (
          <div key={item.id} className='border-b border-gray-200 last:border-b-0'>
            <button
              type='button'
              onClick={() => toggle(item.id)}
              className='flex w-full items-center gap-4 py-5 text-left md:gap-6'
              aria-expanded={isActive}
            >
              <span
                className={cn(
                  'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-semibold transition-colors',
                  isActive ? 'bg-black text-white' : 'text-black'
                )}
              >
                {num}
              </span>

              <span className='flex-1 text-2xl font-semibold text-black md:text-4xl'>{item.title}</span>

              <span className='text-black/70'>{isActive ? <X className='h-7 w-7' /> : <Plus className='h-7 w-7' />}</span>
            </button>

            {isActive && (
              <div className='pb-6 pl-[60px] pr-10 text-lg leading-relaxed text-gray-600 md:pl-[74px] md:text-2xl'>
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
