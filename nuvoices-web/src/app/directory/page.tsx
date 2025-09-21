export default function DirectoryPage() {
  return (
    <div className="min-h-screen bg-[#f4ecea]">
      <main className="max-w-[35.71875rem] mx-auto px-[1.875rem] py-[3rem]">
        {/* Title */}
        <h1 className="text-[2.96875rem] font-serif font-normal leading-[1.1] tracking-[-0.089rem] text-[#3c2e24] mb-[1.5rem] text-center">
          Expert Directory
        </h1>

        {/* Intro paragraph */}
        <p className="text-[0.9375rem] leading-[1.6] text-black font-serif mb-[2rem] text-center">
          Our directory of international experts on China is a popular tool for journalists and event organizers.
        </p>

        {/* Access button */}
        <div className="flex justify-center mb-[2.5rem]">
          <button className="bg-[#3c2e24] text-[#f5f4f1] px-[2.5rem] py-[0.75rem] text-[0.781rem] font-sans font-extrabold uppercase rounded-[0.313rem] hover:bg-opacity-90 transition">
            ACCESS OUR DIRECTORY HERE
          </button>
        </div>

        {/* Main content */}
        <div className="mb-[2.5rem]">
          <p className="text-[0.9375rem] leading-[1.6] text-black font-serif mb-[1rem]">
            Featuring nearly 700 female, non-binary and BIPOC experts on China, our directory has significantly boosted
            the representation of women and minorities in media and events. See press articles from{" "}
            <a href="#" className="text-[#3c2e24] underline hover:text-amber-700">Foreign Policy</a> and{" "}
            <a href="#" className="text-[#3c2e24] underline hover:text-amber-700">Globe and Mail</a> and positive testimonials such as this:
          </p>

          <blockquote className="italic text-[0.9375rem] leading-[1.6] text-black font-serif mb-[2.5rem] pl-[1rem] border-l-4 border-[#dd9ca1]">
            "The other week I was asked by British magazine/radio station to give a live radio interview on some China-related
            topics. It was a really great opportunity, and I have NüVoices to thank for it! The outlet told me they found me
            when they were searching the NüVoices directory for a London-based China watcher."
          </blockquote>
        </div>

        {/* Looking for other resources section */}
        <div className="mb-[3rem]">
          <h2 className="text-[1.25rem] font-bold text-[#3c2e24] font-serif mb-[1rem]">Looking for other resources?</h2>
          <ul className="space-y-[0.625rem] text-[0.9375rem] leading-[1.6] text-black font-serif ps-[1.5rem]">
            <li className="flex">
              <span className="mr-[0.5rem]">•</span>
              <span>
                For work by Black practitioners, artists, & scholars on Greater China, check out the{" "}
                <a href="#" className="text-[#3c2e24] underline hover:text-amber-700">Black Voices on Greater China</a> crowdsourced directory.
              </span>
            </li>
            <li className="flex">
              <span className="mr-[0.5rem]">•</span>
              <span>
                For resources on fighting anti-East and Southeast Asian racism, see our guide{" "}
                <a href="#" className="text-[#3c2e24] underline hover:text-amber-700">here</a>.
              </span>
            </li>
          </ul>
        </div>

        {/* Image */}
        <div className="flex justify-center">
          <img
            src="/nuvoices-directory.png"
            alt="Historical protest scene with people holding signs"
            className="w-full rounded-[0.313rem]"
          />
        </div>
      </main>
    </div>
  );
}