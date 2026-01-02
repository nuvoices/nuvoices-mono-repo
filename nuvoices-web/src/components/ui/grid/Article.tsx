import React from 'react';
import Link from 'next/link';

interface ArticleProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function Article({ href, children, className = '' }: ArticleProps) {
  return (
    <Link
      href={href}
      className={`block no-underline ${className}`}
      style={{ textDecoration: 'none' }}
    >
      <article className="group cursor-pointer w-full flex flex-col gap-[0.7rem]">
        {children}
      </article>
    </Link>
  );
}

interface ArticleContentProps {
  children: React.ReactNode;
  className?: string;
}

export function ArticleContent({ children, className = '' }: ArticleContentProps) {
  return (
    <div className={`flex flex-col gap-[0.313rem] ${className}`}>
      {children}
    </div>
  );
}