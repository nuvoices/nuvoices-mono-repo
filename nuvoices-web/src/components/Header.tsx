"use client";

import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import NavigationLinks, { type NavLink } from './NavigationLinks';
import SocialIcons from './SocialIcons';
import SearchIcon from '../../public/search-normal.svg';

const headerNavigationLinks: NavLink[] = [
  { href: '/about', label: 'About' },
  { href: '/magazine', label: 'Magazine' },
  { href: '/podcast', label: 'Podcast' },
  { href: '/news', label: 'News' },
  { href: '/directory', label: 'Directory' },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const isHomepage = pathname === '/';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    if (mobileMenuOpen && mobileSearchInputRef.current) {
      // Small delay to let the panel animate in
      const timer = setTimeout(() => mobileSearchInputRef.current?.focus(), 300);
      return () => clearTimeout(timer);
    }
  }, [mobileMenuOpen]);

  const handleDesktopSearch = () => {
    const trimmed = searchQuery.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleMobileSearch = () => {
    const trimmed = mobileSearchQuery.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
      setMobileMenuOpen(false);
      setMobileSearchQuery('');
    }
  };

  const handleDesktopKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleDesktopSearch();
    } else if (e.key === 'Escape') {
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleMobileKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleMobileSearch();
    }
  };

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

          {/* Right Section: Navigation or Search Input */}
          {/* Desktop: Search Mode */}
          {searchOpen ? (
            <div className="hidden md:flex items-center gap-[0.5rem]">
              <div className="flex items-stretch h-[2rem]">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleDesktopKeyDown}
                  placeholder="Search..."
                  className="bg-[#FFFAFA] border border-r-0 border-input rounded-l-md outline-none font-sans text-sm text-[#3c2e24] placeholder:text-muted-foreground tracking-[-0.021rem] w-[14rem] pl-[0.625rem] pr-2"
                />
                <button
                  onClick={handleDesktopSearch}
                  className="w-[2.75rem] bg-[#ece7e5] border border-input rounded-r-md cursor-pointer hover:bg-[#e2dcda] transition flex items-center justify-center flex-shrink-0"
                  aria-label="Submit search"
                >
                  <SearchIcon className="w-[14px] h-[14px] text-[#3c2e24]/70" />
                </button>
              </div>
              <button
                onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                className="bg-transparent border-none cursor-pointer hover:opacity-70 transition font-sans font-semibold text-[1rem] text-[#3c2e24] tracking-[-0.021rem]"
                aria-label="Close search"
              >
                Cancel
              </button>
            </div>
          ) : (
            /* Desktop: Normal Navigation */
            <nav className="hidden md:flex items-center gap-[1.25rem]">
              <NavigationLinks links={headerNavigationLinks} variant="header" />
              <button
                onClick={() => setSearchOpen(true)}
                className="bg-transparent border-none cursor-pointer w-[2.75rem] h-[2.75rem] -mx-[0.875rem] hover:opacity-70 transition flex items-center justify-center"
                aria-label="Search"
              >
                <SearchIcon className="w-[1rem] h-[1rem] text-[#3c2e24]" />
              </button>
            </nav>
          )}

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

        {/* Mobile Search Input */}
        <div className="w-full px-[1.5rem] mt-[1.5rem] box-border">
          <div className="flex items-center border-b border-[#FFFFFF]/30 pb-[6px]">
            <SearchIcon className="w-[1.125rem] h-[1.125rem] text-[#FFFFFF]/60 flex-shrink-0 mr-3" />
            <input
              ref={mobileSearchInputRef}
              type="text"
              value={mobileSearchQuery}
              onChange={(e) => setMobileSearchQuery(e.target.value)}
              onKeyDown={handleMobileKeyDown}
              placeholder="Search..."
              className="flex-1 bg-transparent border-none outline-none font-serif text-[1.25rem] text-[#FFFFFF] placeholder:text-[#FFFFFF]/40 tracking-[-0.047rem]"
              style={{ fontFamily: 'Source Serif Pro, serif' }}
            />
            {mobileSearchQuery.trim() && (
              <button
                onClick={handleMobileSearch}
                className="font-serif text-[1rem] text-[#FFFFFF]/80 bg-transparent border-none cursor-pointer hover:text-[#FFFFFF] transition"
                style={{ fontFamily: 'Source Serif Pro, serif' }}
              >
                Go
              </button>
            )}
          </div>
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
