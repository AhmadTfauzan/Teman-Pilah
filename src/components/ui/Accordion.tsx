'use client';

import { useState, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AccordionItem {
  title: string;
  content: React.ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  className?: string;
  allowMultiple?: boolean;
}

export function Accordion({ items, className, allowMultiple = false }: AccordionProps) {
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);
  const id = useId();

  const toggle = (index: number) => {
    if (allowMultiple) {
      setOpenIndexes((prev) =>
        prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
      );
    } else {
      setOpenIndexes((prev) => (prev.includes(index) ? [] : [index]));
    }
  };

  return (
    <div className={cn('divide-y divide-black/5', className)}>
      {items.map((item, index) => {
        const isOpen = openIndexes.includes(index);
        const headerId = `${id}-header-${index}`;
        const panelId = `${id}-panel-${index}`;
        return (
          <div key={index}>
            <button
              id={headerId}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => toggle(index)}
              className="flex w-full items-center justify-between py-3 text-left text-sm font-semibold text-[#154212] min-h-[44px]"
            >
              <span>{item.title}</span>
              <ChevronDown
                size={16}
                className={cn(
                  'shrink-0 text-[#616b5a] transition-transform duration-200',
                  isOpen && 'rotate-180'
                )}
              />
            </button>
            <div
              id={panelId}
              role="region"
              aria-labelledby={headerId}
              hidden={!isOpen}
              className="pb-3 text-sm leading-relaxed text-[#42493E]"
            >
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
