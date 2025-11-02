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
              <Link href="/" className="flex-shrink-0 mr-[1.25rem]">
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
        className={`fixed box-border top-[0px] left-[0px] h-screen w-full bg-[#3c2e24] z-50 md:hidden transition-opacity duration-300 flex flex-col items-center ${
          mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Header Section */}
        <div className="bg-[rgba(244,236,234,0.92)] h-[3.75rem] w-full relative flex items-center justify-center overflow-hidden shrink-0">
          {/* Logo */}
          <div className="relative h-[2rem] w-[1.75rem]">
            <Image
              src="/nuvoices-logo-header.png"
              alt="NüVoices"
              fill
              className="object-contain"
            />
          </div>

          {/* Close Button */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="absolute top-[1rem] right-[1.125rem] p-2 bg-transparent border-none flex items-center justify-center"
            aria-label="Close menu"
          >
            <X className="h-6 w-6 text-[#3c2e24]" strokeWidth={2.5} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-[1.5rem] mt-[1.5rem] px-[1.5rem] w-full box-border">
          {headerNavigationLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="font-serif text-[1.5rem] text-[#FFFFFF] leading-[1.2] tracking-[-0.075rem] hover:opacity-80 transition no-underline"
              style={{ fontFamily: 'Source Serif Pro, serif' }}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Mobile Social Icons */}
        <div className="mt-[2rem] mb-[25px] flex gap-[20px] items-center justify-center">
          <SocialIcons variant="mobile" />
        </div>
      </div>
    </>
  );
}