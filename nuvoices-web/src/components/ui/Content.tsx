import React from 'react';

interface ContentProps {
  children: React.ReactNode;
  className?: string;
}

interface FullWidthBreakoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Responsive content wrapper for consistent width and padding across all pages
 *
 * Mobile: 100% width with responsive padding (px-4 sm:px-6 md:px-8)
 * Tablet/Desktop: Centered with max-width constraint (45rem / 720px)
 *
 * @example
 * <Content>
 *   <h1>Page Content</h1>
 * </Content>
 *
 * @example
 * // For content that needs to break out to full width on mobile
 * <Content>
 *   <h1>Page Title</h1>
 *   <FullWidthBreakout>
 *     <Grid>...</Grid>
 *   </FullWidthBreakout>
 * </Content>
 */
export function Content({
  children,
  className = ''
}: ContentProps) {
  return (
    <div
      className={`
        w-full
        box-border
        max-w-[45rem]
        px-[1.5rem] sm:px-6 md:px-8
        mx-auto
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {children}
    </div>
  );
}

/**
 * Wrapper for content that should take full width of the screen on mobile,
 * breaking out of the Content component's padding.
 *
 * Uses negative margins to counteract the parent Content padding:
 * - Mobile: -mx-4 (counteracts px-4)
 * - Tablet: -mx-6 (counteracts px-6)
 * - Desktop: -mx-8 (counteracts px-8)
 *
 * @example
 * <Content>
 *   <h1>Regular Content</h1>
 *   <FullWidthBreakout>
 *     <Grid>
 *       <GridRow>...</GridRow>
 *     </Grid>
 *   </FullWidthBreakout>
 * </Content>
 */
export function FullWidthBreakout({ children, className = '' }: FullWidthBreakoutProps) {
  return (
    <div
      className={`
        -mx-4 sm:-mx-6 md:-mx-8
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {children}
    </div>
  );
}
