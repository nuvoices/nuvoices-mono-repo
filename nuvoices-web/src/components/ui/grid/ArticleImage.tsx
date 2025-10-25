import React from 'react';
import Image from 'next/image';

interface ArticleImageProps {
  src?: string;
  alt: string;
  rotation?: 'left' | 'right' | 'none';
  className?: string;
}

export function ArticleImage({ src, alt, rotation = 'none', className = '' }: ArticleImageProps) {
  const rotationClass = rotation === 'left' ? '-rotate-2' : rotation === 'right' ? 'rotate-2' : '';

  return (
    <div className={`relative w-full aspect-[4/3] ${className}`}>
      <div className={`w-full h-full ${rotationClass}`}>
        {src ? (
          <Image
            src={src}
            alt={alt}
            width={424}
            height={326}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 aspect-[4/3]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
            <span className="text-[0.875rem]">[No Image]</span>
          </div>
        )}
      </div>
    </div>
  );
}