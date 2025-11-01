"use client";

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import NavigationLinks, { type NavLink } from './NavigationLinks';
import SocialIcons from './SocialIcons';

const headerNavigationLinks: NavLink[] = [
  { href: '/about', label: 'About' },
  { href: '/magazine', label: 'Magazine' },
  { href: '/podcast', label: 'Podcast' },
  { href: '/news', label: 'News' },
  { href: '/directory', label: 'Directory' },
];

export default function Header() {
  const pathname = usePathname();
  const isHomepage = pathname === '/';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="bg-[#f4ecea] h-[3.75rem] w-full box-border relative z-40 p-[1.5rem]">
        <div className="h-full flex items-center justify-between px-4 sm:px-6 md:px-8">
          {/* Left Section: Logo + Social Icons */}
          <div className="flex items-center gap-4 sm:gap-8">
            {/* NüVoices Logo - Show only when not on homepage */}
            {!isHomepage && (
              <Link href="/" className="flex-shrink-0">
                <Image
                  src="/nuvoices-logo-header.png"
                  alt="NüVoices"
                  width={18}
                  height={24}
                  className="w-[18px] h-[24px] block"
                />
              </Link>
            )}

            {/* Social Icons - Desktop */}
            <SocialIcons variant="desktop" />
          </div>

          {/* Right Section: Navigation */}
          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-[1.25rem]">
            <NavigationLinks links={headerNavigationLinks} variant="header" />
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded transition flex items-center justify-center min-w-[44px] min-h-[44px] bg-transparent border-none mr-[-10px]"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            type="button"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-[#3c2e24]" strokeWidth={2.5} />
            ) : (
              <Menu className="h-6 w-6 text-[#3c2e24]" strokeWidth={2.5} />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${
          mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Mobile Menu Panel */}
      <div
        className={`fixed box-border top-[0px] left-[0x] h-screen w-full max-w-sm bg-[#3c2e24] p-[1.5rem] z-50 shadow-2xl md:hidden transition-opacity duration-300 ${
          mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="h-full overflow-y-auto p-6">
          {/* Close Button */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="absolute top-[0px] right-[0px] p-2 rounded-lg transition bg-transparent border-none w-[48px] h-[48px]"
            aria-label="Close menu"
          >
            <X className="h-6 w-6 text-[#f4ecea]" strokeWidth={2.5} />
          </button>

          {/* Mobile Navigation Links */}
          <nav className="flex flex-col gap-6 border-t border-[#3c2e24]/10 pt-6">
            <NavigationLinks links={headerNavigationLinks} variant="mobile" onLinkClick={() => setMobileMenuOpen(false)} />
          </nav>

          {/* Mobile Social Icons */}
          <SocialIcons variant="mobile" />
        </div>
      </div>
    </>
  );
}