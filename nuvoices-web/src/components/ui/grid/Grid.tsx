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
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {children}
    </div>
  );
}