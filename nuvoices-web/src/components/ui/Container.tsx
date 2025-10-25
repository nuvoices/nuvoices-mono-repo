import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Container variant:
   * - 'default': Standard content width (max-w-[45rem])
   * - 'narrow': Narrower width for text-heavy content (max-w-[35rem])
   * - 'wide': Wider for grids and layouts (max-w-[60rem])
   */
  variant?: 'default' | 'narrow' | 'wide';
  /**
   * Padding variant:
   * - 'default': Responsive padding (px-4 sm:px-6 md:px-8)
   * - 'none': No horizontal padding
   */
  padding?: 'default' | 'none';
}

/**
 * Responsive container component for consistent content width across all pages
 *
 * Mobile: 100% width with responsive padding
 * Tablet/Desktop: Centered with max-width constraint
 *
 * @example
 * <Container>
 *   <h1>Page Content</h1>
 * </Container>
 *
 * @example
 * <Container variant="narrow" padding="none">
 *   <article>Text content</article>
 * </Container>
 */
export function Container({
  children,
  className = '',
  variant = 'default',
  padding = 'default'
}: ContainerProps) {
  const maxWidthClasses = {
    default: 'max-w-[45rem]',
    narrow: 'max-w-[35rem]',
    wide: 'max-w-[60rem]',
  };

  const paddingClasses = {
    default: 'px-4 sm:px-6 md:px-8',
    none: '',
  };

  return (
    <div
      className={`
        w-full
        ${maxWidthClasses[variant]}
        ${paddingClasses[padding]}
        mx-auto
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {children}
    </div>
  );
}
