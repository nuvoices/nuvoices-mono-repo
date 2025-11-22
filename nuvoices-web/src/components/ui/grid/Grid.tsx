import React from 'react';

interface GridProps {
  children: React.ReactNode;
  className?: string;
}

export function Grid({ children, className = '' }: GridProps) {
  return (
    <div className={`flex flex-col gap-[0.9375rem] ${className}`}>
      {children}
    </div>
  );
}

interface GridRowProps {
  children: React.ReactNode;
  className?: string;
}

export function GridRow({ children, className = '' }: GridRowProps) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-[1.5rem] gap-y-[3rem] ${className}`}>
      {children}
    </div>
  );
}