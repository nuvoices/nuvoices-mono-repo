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
    <div className={`flex gap-[0.313rem] justify-center ${className}`}>
      {children}
    </div>
  );
}