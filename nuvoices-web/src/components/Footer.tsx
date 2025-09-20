export default function Footer() {
  return (
    <footer className="bg-[#dd9ca1] h-[10.563rem] relative w-full text-[#3c2e24]">
      {/* Main description - 40px = 1.25rem */}
      <p className="absolute left-[1.906rem] top-[2.063rem] font-serif text-[1.25rem] leading-[1.2] tracking-[-0.038rem] w-[41.25rem]">
        <span className="font-bold">NüVoices</span>
        <span className="font-normal"> is an international editorial collective of women and other underrepresented communities working on the subject of China.</span>
      </p>

      {/* WordPress credit - 20px = 0.625rem */}
      <p className="absolute left-[1.875rem] top-[8.219rem] font-sans font-normal text-[0.625rem] tracking-[-0.019rem]">
        Powered by WordPress
      </p>

      {/* Footer navigation - 22px = 0.688rem */}
      <nav className="absolute right-[1.875rem] top-[8.188rem] flex gap-[1rem]">
        <a href="/about" className="font-sans font-semibold text-[0.688rem] capitalize tracking-[-0.021rem] hover:opacity-80 transition">About</a>
        <a href="/join" className="font-sans font-semibold text-[0.688rem] capitalize tracking-[-0.021rem] hover:opacity-80 transition">Join</a>
        <a href="#" className="font-sans font-semibold text-[0.688rem] capitalize tracking-[-0.021rem] hover:opacity-80 transition">Donate</a>
        <a href="/submissions" className="font-sans font-semibold text-[0.688rem] capitalize tracking-[-0.021rem] hover:opacity-80 transition">Submit</a>
        <a href="#" className="font-sans font-semibold text-[0.688rem] capitalize tracking-[-0.021rem] hover:opacity-80 transition">Contact</a>
      </nav>
    </footer>
  );
}