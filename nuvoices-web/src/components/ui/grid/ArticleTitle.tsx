import React from 'react';

interface ArticleTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function ArticleTitle({ children, className = '' }: ArticleTitleProps) {
  return (
    <h3
      className={`text-[1.25rem] font-serif leading-[1.1] tracking-[-0.047rem] text-[#3c2e24] font-normal ${className}`}
      style={{ marginBlock: 0 }}
    >
      {children}
    </h3>
  );
}

interface ArticleExcerptProps {
  children: React.ReactNode;
  className?: string;
}

export function ArticleExcerpt({ children, className = '' }: ArticleExcerptProps) {
  return (
    <div className={`text-sm font-serif italic leading-[1.1] text-[#3c2e24] ${className}`}>
      {children}
    </div>
  );
}