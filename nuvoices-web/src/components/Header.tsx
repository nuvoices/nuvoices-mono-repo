"use client";

import { usePathname } from "next/navigation";

const img = "http://localhost:3845/assets/da6895fc8ae7f5be1c5c8dcf154ac681260c1a74.svg";
const img1 = "http://localhost:3845/assets/9e63f01bcb82fa36c8d4d32adac3d2cc92422a7c.svg";
const img4 = "http://localhost:3845/assets/49319b92ffd2dbd8747134d566468d3ac4a6a693.svg";
const img5 = "http://localhost:3845/assets/e7168942a7e8a0d2a80d1caa0826121edd74fa1a.svg";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="bg-[#f4ecea] h-[3.75rem] w-full relative">
      <div className="absolute left-[1.906rem] top-[1.5rem] flex items-center gap-[0.781rem]">
        {/* Social Icons */}
        <a href="#" aria-label="Twitter" className="w-[0.844rem] h-[0.844rem]">
          <img src={img} alt="Twitter" className="w-full h-full" />
        </a>
        <a href="#" aria-label="Instagram" className="w-[0.781rem] h-[0.844rem]">
          <img src={img1} alt="Instagram" className="w-full h-full" />
        </a>
        <a href="#" aria-label="LinkedIn" className="w-[0.844rem] h-[0.844rem]">
          <img src={img4} alt="LinkedIn" className="w-full h-full" />
        </a>
        <a href="#" aria-label="Email" className="w-[1.125rem] h-[1.125rem]">
          <img src={img5} alt="Email" className="w-full h-full" />
        </a>
      </div>

      {/* Navigation - 22px = 0.688rem */}
      <nav className="absolute right-[1.875rem] top-[1.531rem] flex gap-[1.25rem]">
        <a href="/about" className="font-sans font-semibold text-[0.688rem] text-[#3c2e24] capitalize tracking-[-0.021rem] hover:opacity-80 transition">About</a>
        <a href="/magazine" className="font-sans font-semibold text-[0.688rem] text-[#3c2e24] capitalize tracking-[-0.021rem] hover:opacity-80 transition">Magazine</a>
        <a href="/podcast" className="font-sans font-semibold text-[0.688rem] text-[#3c2e24] capitalize tracking-[-0.021rem] hover:opacity-80 transition">Podcast</a>
        <a href="#" className="font-sans font-semibold text-[0.688rem] text-[#3c2e24] capitalize tracking-[-0.021rem] hover:opacity-80 transition">Events</a>
        <a href="/directory" className="font-sans font-semibold text-[0.688rem] text-[#3c2e24] capitalize tracking-[-0.021rem] hover:opacity-80 transition">Directory</a>
      </nav>
    </header>
  );
}