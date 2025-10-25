export default function Footer() {
  return (
    <footer className="box-border bg-[#dd9ca1] w-full text-[#3c2e24] flex flex-col pt-[2.063rem] pl-[1.906rem] pr-[1.875rem] pb-[2.375rem]">
      {/* Main description - 40px = 1.25rem */}
      <p className="font-serif text-[1.25rem] leading-[1.2] tracking-[-0.038rem] max-w-[41.25rem]">
        <span className="font-bold">NüVoices</span>
        <span className="font-normal"> is an international editorial collective of women and other underrepresented communities working on the subject of China.</span>
      </p>

      {/* Footer navigation - 22px = 0.688rem */}
      <nav className="mt-auto self-end flex gap-[1rem]">
        <a href="/about" className="font-sans font-semibold text-[0.688rem] text-[#3c2e24] capitalize tracking-[-0.021rem] no-underline hover:opacity-80 transition">About</a>
        <a href="/join" className="font-sans font-semibold text-[0.688rem] text-[#3c2e24] capitalize tracking-[-0.021rem] no-underline hover:opacity-80 transition">Join</a>
        <a href="#" className="font-sans font-semibold text-[0.688rem] text-[#3c2e24] capitalize tracking-[-0.021rem] no-underline hover:opacity-80 transition">Donate</a>
        <a href="/submissions" className="font-sans font-semibold text-[0.688rem] text-[#3c2e24] capitalize tracking-[-0.021rem] no-underline hover:opacity-80 transition">Submit</a>
        <a href="#" className="font-sans font-semibold text-[0.688rem] text-[#3c2e24] capitalize tracking-[-0.021rem] no-underline hover:opacity-80 transition">Contact</a>
      </nav>
    </footer>
  );
}