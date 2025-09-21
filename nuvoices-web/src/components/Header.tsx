"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  const pathname = usePathname();
  const isHomepage = pathname === '/';

  return (
    <header className="bg-[#f4ecea] h-[3.75rem] w-full relative">
      {/* NüVoices Logo - Show only when not on homepage */}
      {!isHomepage && (
        <Link href="/" className="absolute left-[1.438rem] top-[0.875rem]">
          <Image
            src="/nuvoices-logo-header.png"
            alt="NüVoices"
            width={57}
            height={75}
            className="w-[1.781rem] h-[2.344rem]"
          />
        </Link>
      )}

      <div className={`absolute ${!isHomepage ? 'left-[4.094rem]' : 'left-[1.906rem]'} top-[1.5rem] flex gap-[0.781rem]`}>
        {/* Social Icons */}
        <a href="#" aria-label="Twitter" className="w-[0.844rem] h-[0.844rem]">
          <img src="/icons/twitter.svg" alt="Twitter" className="w-full h-full" />
        </a>
        <a href="#" aria-label="Instagram" className="w-[0.781rem] h-[0.844rem]">
          <img src="/icons/instagram.svg" alt="Instagram" className="w-full h-full" />
        </a>
        <a href="#" aria-label="LinkedIn" className="w-[0.844rem] h-[0.844rem]">
          <img src="/icons/linkedin.svg" alt="LinkedIn" className="w-full h-full" />
        </a>
        <a href="#" aria-label="Email" className="w-[1.125rem] h-[1.125rem]">
          <img src="/icons/email.svg" alt="Email" className="w-full h-full" />
        </a>
      </div>

      {/* Navigation - 22px = 0.688rem */}
      <nav className="absolute right-[1.875rem] top-[1.531rem] flex gap-[1.25rem]">
        <a href="/about" className="font-sans font-semibold text-[0.688rem] text-[#3c2e24] capitalize tracking-[-0.021rem] hover:opacity-80 transition">About</a>
        <a href="/magazine" className="font-sans font-semibold text-[0.688rem] text-[#3c2e24] capitalize tracking-[-0.021rem] hover:opacity-80 transition">Magazine</a>
        <a href="/podcast" className="font-sans font-semibold text-[0.688rem] text-[#3c2e24] capitalize tracking-[-0.021rem] hover:opacity-80 transition">Podcast</a>
        <a href="/news" className="font-sans font-semibold text-[0.688rem] text-[#3c2e24] capitalize tracking-[-0.021rem] hover:opacity-80 transition">News</a>
        <a href="/directory" className="font-sans font-semibold text-[0.688rem] text-[#3c2e24] capitalize tracking-[-0.021rem] hover:opacity-80 transition">Directory</a>
      </nav>
    </header>
  );
}