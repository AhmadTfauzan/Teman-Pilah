import React, { ReactNode, ComponentPropsWithoutRef, ElementType } from 'react';
import { cn } from '@/lib/utils';
import { twMerge } from 'tailwind-merge';

type ContainerProps<T extends ElementType = 'div'> = {
  as?: T;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className' | 'children'>;

export function Container<T extends ElementType = 'div'>({
  as,
  className,
  children,
  ...rest
}: ContainerProps<T>) {
  const Component = as || 'div';
  const baseClasses = 'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8';
  const merged = twMerge(cn(baseClasses, className));
  return (
    <Component className={merged} {...rest}>
      {children}
    </Component>
  );
}

export default Container;
