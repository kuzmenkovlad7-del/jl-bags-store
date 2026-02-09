'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type UniqueAccordionItem = {
  id: string;
  title: string;
  content: string;
};

type UniqueAccordionProps = {
  items: UniqueAccordionItem[];
  defaultActiveId?: string;
};

export default function UniqueAccordion({ items, defaultActiveId }: UniqueAccordionProps) {
  const [activeId, setActiveId] = useState<string>(defaultActiveId || items[0]?.id || '');

  return (
    <div className='divide-y divide-gray-200 border-y border-gray-200'>
      {items.map((item, idx) => {
        const isActive = activeId === item.id;
        const num = String(idx + 1).padStart(2, '0');

        return (
          <div key={item.id} className='py-2 md:py-3'>
            <button
              type='button'
              onClick={() => setActiveId(isActive ? '' : item.id)}
              className='flex w-full items-center gap-4 px-2 py-4 text-left md:px-4'
              aria-expanded={isActive}
              aria-controls={`faq-panel-${item.id}`}
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
              <div id={`faq-panel-${item.id}`} className='pb-6 pl-[60px] pr-10 text-lg leading-relaxed text-gray-600 md:pl-[74px] md:text-2xl'>
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
