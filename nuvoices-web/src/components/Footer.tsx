'use client';

import { usePathname } from 'next/navigation';
import NavigationLinks, { type NavLink } from './NavigationLinks';

const footerNavigationLinks: NavLink[] = [
  { href: '/masthead', label: 'Masthead' },
  { href: '/join', label: 'Join' },
  { href: '/donate', label: 'Donate' },
  { href: '/submissions', label: 'Submit' },
  { href: '/contact', label: 'Contact' },
];

export default function Footer() {
  const pathname = usePathname();
  const isHomepage = pathname === '/';
  console.log('pathname', usePathname())
  return (
    <footer className="box-border bg-[#dd9ca1] w-full text-[#3c2e24] flex flex-col p-[2.063rem] min-h-[12.8125rem]">
      {/* Main description - 40px = 1.25rem - Only visible on homepage */}
      {isHomepage && (
        <p className="font-serif text-[1.25rem] leading-[1.2] tracking-[-0.038rem] max-w-[41.25rem] m-0">
          <span className="font-bold">NüVoices</span>
          <span className="font-normal"> is an international editorial collective of women and other underrepresented communities working on the subject of China.</span>
        </p>
      )}

      {/* Footer navigation - 22px = 0.688rem */}
      <nav className="mt-auto self-end flex flex-wrap gap-[1rem]">
        <NavigationLinks links={footerNavigationLinks} variant="footer" />
      </nav>
    </footer>
  );
}