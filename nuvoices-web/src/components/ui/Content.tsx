import React from 'react';

interface ContentProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Padding variant:
   * - 'default': Responsive padding (px-4 sm:px-6 md:px-8)
   * - 'none': No horizontal padding
   */
  padding?: 'default' | 'none';
}

/**
 * Responsive content wrapper for consistent width and padding across all pages
 *
 * Mobile: 100% width with responsive padding
 * Tablet/Desktop: Centered with max-width constraint (45rem / 720px)
 *
 * @example
 * <Content>
 *   <h1>Page Content</h1>
 * </Content>
 *
 * @example
 * <Content padding="none">
 *   <article>Full width content</article>
 * </Content>
 */
export function Content({
  children,
  className = '',
  padding = 'default'
}: ContentProps) {
  const paddingClasses = {
    default: 'px-4 sm:px-6 md:px-8',
    none: '',
  };

  return (
    <div
      className={`
        w-full
        max-w-[45rem]
        ${paddingClasses[padding]}
        mx-auto
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {children}
    </div>
  );
}
