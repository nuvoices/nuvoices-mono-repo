import React from 'react';

interface ArticleDateProps {
  date: string | Date;
  className?: string;
}

export function ArticleDate({ date, className = '' }: ArticleDateProps) {
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className={`text-[1rem] font-serif italic leading-[1.1] text-[#3c2e24] ${className}`}>
      {formattedDate}
    </div>
  );
}