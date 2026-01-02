import { cn } from "@/lib/utils";
import NextLink from "next/link";

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: 'default' | 'subtle' | 'article';
  href: string;
  children: React.ReactNode;
}

export function Link({ variant = 'default', className, href, children, ...props }: LinkProps) {
  const styles = {
    default: 'text-black underline hover:bg-yellow-200 transition-colors',
    subtle: 'text-black underline hover:opacity-70 transition',
    article: 'text-[#3c2e24] underline hover:text-amber-700',
  };

  // Determine if it's an external link
  const isExternal = href.startsWith('http://') || href.startsWith('https://');
  const rel = isExternal ? 'noopener noreferrer' : undefined;

  // For internal links, use Next.js Link
  if (!isExternal) {
    return (
      <NextLink
        href={href}
        className={cn(styles[variant], className)}
        {...props}
      >
        {children}
      </NextLink>
    );
  }

  // For external links, use regular anchor tag
  return (
    <a
      href={href}
      className={cn(styles[variant], className)}
      rel={rel}
      target="_blank"
      {...props}
    >
      {children}
    </a>
  );
}
