export const navigationLinks = [
  { href: '/about', label: 'About' },
  { href: '/magazine', label: 'Magazine' },
  { href: '/podcast', label: 'Podcast' },
  { href: '/news', label: 'News' },
  { href: '/directory', label: 'Directory' },
];

interface NavigationLinksProps {
  variant?: 'header' | 'footer' | 'mobile';
  onLinkClick?: () => void;
}

export default function NavigationLinks({ variant = 'header', onLinkClick }: NavigationLinksProps) {
  const baseStyles = "font-sans font-semibold text-[1rem] text-[#3c2e24] capitalize tracking-[-0.021rem] no-underline hover:opacity-80 transition";
  const mobileStyles = "font-sans font-semibold text-lg text-[#f4ecea] capitalize hover:opacity-70 transition py-2 border-b border-[#3c2e24]/5 no-underline";
  const footerStyles = "font-sans font-semibold text-[1rem] text-[#3c2e24] capitalize tracking-[-0.021rem] no-underline hover:opacity-80 transition";

  const styles = variant === 'mobile' ? mobileStyles : variant === 'footer' ? footerStyles : baseStyles;

  return (
    <>
      {navigationLinks.map((link) => (
        <a
          key={link.href}
          href={link.href}
          onClick={onLinkClick}
          className={styles}
        >
          {link.label}
        </a>
      ))}
    </>
  );
}
