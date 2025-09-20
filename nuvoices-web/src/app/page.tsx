const imgTempImagewflfZt1 = "http://localhost:3845/assets/1f87e050f6dd3f83d65ae95315563b29fd0838e0.png";
const img2062PxEthelWatersWilliamP1 = "http://localhost:3845/assets/42a7a20f92a56bf377430eb95431e26b7160bead.png";
const img2062PxEthelWatersWilliamP2 = "http://localhost:3845/assets/63f13d78f275b71f202c2244f752e22cc2cb5093.png";
const img847PxCabCallowayGottlieb14 = "http://localhost:3845/assets/0a8e610601c791faa431b7506868610b224a6101.png";
const img847PxCabCallowayGottlieb15 = "http://localhost:3845/assets/0e76be374e03c475c38f45121b56a5e1cbf7a9ee.png";
const img2062PxEthelWatersWilliamP3 = "http://localhost:3845/assets/39856c3f6ce58a506f2b1db8bea1b7e1162b44fd.png";
const img847PxCabCallowayGottlieb16 = "http://localhost:3845/assets/f7b8812df0596ce7582f36b2382cd28596fa37f8.png";
const img847PxCabCallowayGottlieb17 = "http://localhost:3845/assets/d46c2f820647e4d121f6e377731a54335fc301fe.png";
const img2062PxEthelWatersWilliamP4 = "http://localhost:3845/assets/ed4b63a872fe5c274cadc8e98c5773640f829db5.png";
const img847PxCabCallowayGottlieb18 = "http://localhost:3845/assets/dea6d5963562ca3f7428c30f3d53593f4e6a4f41.png";
const img847PxCabCallowayGottlieb19 = "http://localhost:3845/assets/6b3cef217f04cde54161c430dbaa4803a7dbdebe.png";

export default function Home() {
  return (
    <div className="bg-[#f4ecea] flex flex-col gap-[1.563rem] items-center min-h-screen">
      {/* Hero Section */}
      <div className="relative w-full max-w-[45rem] mx-auto">
        <div className="flex flex-col items-center gap-[1.563rem] pt-[1.563rem]">
          {/* Logo placeholder - 270px x 354px */}
          <div className="w-[8.438rem] h-[11.063rem] relative">
            <img
              src={imgTempImagewflfZt1}
              alt="NüVoices Logo"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Tagline - 110px = 3.438rem */}
          <div className="font-serif text-[3.438rem] leading-[1.2] text-[#3c2e24] text-center tracking-[-0.103rem] max-w-[38.844rem]">
            Amplifying the voices of women and minority experts on China
          </div>

          {/* Buttons - 252px x 99px, 35px text */}
          <div className="flex gap-[0.938rem]">
            <a href="/join" className="bg-[#3c2e24] rounded-[0.313rem] w-[7.875rem] h-[3.094rem] flex items-center justify-center transition-all duration-200 hover:bg-[#5a4638] hover:scale-105 hover:shadow-lg no-underline hover:no-underline border-0">
              <span className="font-sans font-extrabold text-[1.094rem] text-[#f5f4f1] uppercase">JOIN</span>
            </a>
            <button className="bg-[#3c2e24] rounded-[0.313rem] w-[7.875rem] h-[3.094rem] flex items-center justify-center transition-all duration-200 hover:bg-[#5a4638] hover:scale-105 hover:shadow-lg border-0">
              <span className="font-sans font-extrabold text-[1.094rem] text-[#f5f4f1] uppercase">DONATE</span>
            </button>
            <a href="/explore" className="bg-[#3c2e24] rounded-[0.313rem] w-[7.875rem] h-[3.094rem] flex items-center justify-center transition-all duration-200 hover:bg-[#5a4638] hover:scale-105 hover:shadow-lg no-underline hover:no-underline border-0">
              <span className="font-sans font-extrabold text-[1.094rem] text-[#f5f4f1] uppercase">EXPLORE</span>
            </a>
          </div>
        </div>
      </div>

      {/* Featured Section */}
      <div className="flex flex-col gap-[0.938rem] items-center w-full">
        <div className="font-sans font-semibold text-[1.25rem] text-black text-center">
          Featured Content
        </div>
        <div className="flex flex-col gap-[0.625rem] items-center w-full max-w-[45rem]">
          <div className="h-[18.75rem] w-full relative">
            <img
              src={img2062PxEthelWatersWilliamP1}
              alt="Mother Tongue"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="font-serif text-[1.875rem] text-[#3c2e24] text-center tracking-[-0.056rem]">
            Mother Tongue
          </div>
          <div className="font-serif italic text-[0.938rem] text-[#3c2e24] text-center">
            June 1, 2025
          </div>
        </div>
      </div>

      {/* Magazine Section */}
      <div className="flex flex-col gap-[0.938rem] items-center w-full">
        <div className="font-sans font-semibold text-[1.25rem] text-[#3c2e24] text-center">
          Magazine
        </div>
        <div className="flex gap-[0.313rem] w-full max-w-[45.188rem] px-3">
          {/* Article 1 */}
          <div className="flex flex-col gap-[0.313rem] items-center w-[14.813rem]">
            <div className="w-[12.906rem] h-[10.219rem] relative rotate-[-2deg]">
              <img
                src={img2062PxEthelWatersWilliamP2}
                alt="A Trip to the Supermarket"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="font-serif text-[1.563rem] text-[#3c2e24] text-center tracking-[-0.047rem] w-[11.906rem] leading-[1.1]">
              A Trip to the<br />Supermarket
            </div>
            <div className="font-serif italic text-[0.688rem] text-[#3c2e24] text-center w-[11.625rem] leading-[1.1]">
              There's a burden you feel when you don't know how to write your own name
            </div>
            <div className="font-serif italic text-[0.688rem] text-[#3c2e24]">
              June 1, 2025
            </div>
          </div>

          {/* Article 2 */}
          <div className="flex flex-col gap-[0.313rem] items-center w-[14.813rem]">
            <div className="w-[13.25rem] h-[10.188rem] relative rotate-[2deg]">
              <img
                src={img847PxCabCallowayGottlieb14}
                alt="Beijing International Film Festival"
                className="w-full h-full object-cover mix-blend-multiply"
              />
            </div>
            <div className="font-serif text-[1.563rem] text-[#3c2e24] text-center tracking-[-0.047rem] w-[13.625rem] leading-[1.1]">
              Beijing International Film Festival
            </div>
            <div className="font-serif italic text-[0.688rem] text-[#3c2e24] text-center w-[13.625rem] leading-[1.1]">
              The special screening event in London brought Chinese films to a global audience
            </div>
            <div className="font-serif italic text-[0.688rem] text-[#3c2e24]">
              May 21, 2025
            </div>
          </div>

          {/* Article 3 */}
          <div className="flex flex-col gap-[0.313rem] items-center w-[14.813rem]">
            <div className="w-[13.25rem] h-[10.188rem] relative rotate-[-2deg]">
              <img
                src={img847PxCabCallowayGottlieb15}
                alt="In Queer Diaspora"
                className="w-full h-full object-cover mix-blend-multiply"
              />
            </div>
            <div className="font-serif text-[1.406rem] text-[#3c2e24] text-center tracking-[-0.042rem] w-[13.625rem] leading-[1.1]">
              In Queer Diaspora, My Fear Leaks Through
            </div>
            <div className="font-serif italic text-[0.688rem] text-[#3c2e24] text-center w-[12.344rem] leading-[1.1]">
              Maybe this is another story of feeling both inside and outside of China
            </div>
            <div className="font-serif italic text-[0.688rem] text-[#3c2e24]">
              June 1, 2025
            </div>
          </div>
        </div>
      </div>

      {/* Podcast Section */}
      <div className="flex flex-col gap-[0.938rem] items-center w-full">
        <div className="font-sans font-semibold text-[1.25rem] text-[#3c2e24] text-center">
          Podcast
        </div>
        <div className="flex gap-[0.313rem] w-full max-w-[45.188rem] px-3">
          {/* Podcast 1 */}
          <div className="flex flex-col gap-[0.313rem] items-center w-[14.813rem]">
            <div className="w-[12.906rem] h-[10.219rem] relative rotate-[-2deg]">
              <img
                src={img2062PxEthelWatersWilliamP3}
                alt="Diplomacy, Influence & Impact"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="font-serif text-[1.406rem] text-[#3c2e24] text-center tracking-[-0.042rem] w-[11.906rem] leading-[1.1]">
              Diplomacy, Influence & Impact
            </div>
            <div className="font-serif italic text-[0.688rem] text-[#3c2e24] text-center w-[11.625rem] leading-[1.1]">
              Wenchi Yu talks about working in the US-China-Taiwan landscape
            </div>
            <div className="font-serif italic text-[0.688rem] text-[#3c2e24]">
              May 13, 2025
            </div>
          </div>

          {/* Podcast 2 */}
          <div className="flex flex-col gap-[0.313rem] items-center w-[14.813rem]">
            <div className="w-[13.25rem] h-[10.188rem] relative rotate-[2deg]">
              <img
                src={img847PxCabCallowayGottlieb16}
                alt="How I Stopped Being a Model Minority"
                className="w-full h-full object-contain mix-blend-multiply"
              />
            </div>
            <div className="font-serif text-[1.406rem] text-[#3c2e24] text-center tracking-[-0.042rem] w-[13.625rem] leading-[1.1]">
              How I Stopped Being a Model Minority
            </div>
            <div className="font-serif italic text-[0.688rem] text-[#3c2e24] text-center w-[13.625rem] leading-[1.1]">
              Anne Anlin Cheng discusses what it means to live firsthand as an Asian American woman
            </div>
            <div className="font-serif italic text-[0.688rem] text-[#3c2e24]">
              April 16, 2025
            </div>
          </div>

          {/* Podcast 3 */}
          <div className="flex flex-col gap-[0.313rem] items-center w-[14.813rem]">
            <div className="w-[13.25rem] h-[10.188rem] relative rotate-[-2deg]">
              <img
                src={img847PxCabCallowayGottlieb17}
                alt="Let Only Red Flowers Bloom"
                className="w-full h-full object-cover mix-blend-multiply"
              />
            </div>
            <div className="font-serif text-[1.406rem] text-[#3c2e24] text-center tracking-[-0.042rem] w-[13.625rem] leading-[1.1]">
              Let Only Red Flowers Bloom
            </div>
            <div className="font-serif italic text-[0.688rem] text-[#3c2e24] text-center w-[12.344rem] leading-[1.1]">
              A Conversation with Emily Feng about her new book
            </div>
            <div className="font-serif italic text-[0.688rem] text-[#3c2e24]">
              March 12, 2025
            </div>
          </div>
        </div>
      </div>

      {/* Events Section */}
      <div className="flex flex-col gap-[0.938rem] items-center w-full pb-[1.563rem]">
        <div className="font-sans font-semibold text-[1.25rem] text-[#3c2e24] text-center">
          Events
        </div>
        <div className="flex gap-[0.313rem] w-full max-w-[45.188rem] px-3">
          {/* Event 1 */}
          <div className="flex flex-col gap-[0.313rem] items-center w-[14.813rem]">
            <div className="w-[12.906rem] h-[10.219rem] relative rotate-[-2deg]">
              <img
                src={img2062PxEthelWatersWilliamP4}
                alt="Transforming Memory into Story"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="font-serif text-[1.406rem] text-[#3c2e24] text-center tracking-[-0.042rem] w-[11.906rem] leading-[1.1]">
              Transforming Memory into Story
            </div>
            <div className="font-serif italic text-[0.688rem] text-[#3c2e24] text-center w-[11.625rem] leading-[1.1]">
              Karen Cheung on drawing from raw material in personal archives
            </div>
            <div className="font-serif italic text-[0.688rem] text-[#3c2e24]">
              March 29, 2025
            </div>
          </div>

          {/* Event 2 */}
          <div className="flex flex-col gap-[0.313rem] items-center w-[14.813rem]">
            <div className="w-[13.25rem] h-[10.188rem] relative rotate-[2deg]">
              <img
                src={img847PxCabCallowayGottlieb18}
                alt="2025 NüStories Essay Contest"
                className="w-full h-full object-cover mix-blend-multiply"
              />
            </div>
            <div className="font-serif text-[1.563rem] text-[#3c2e24] text-center tracking-[-0.047rem] w-[13.625rem] leading-[1.1]">
              2025 NüStories<br />Essay Contest
            </div>
            <div className="font-serif italic text-[0.688rem] text-[#3c2e24] text-center w-[13.625rem] leading-[1.1]">
              Our first non-fiction personal essay contest focuses on the theme of Chinese identity
            </div>
            <div className="font-serif italic text-[0.688rem] text-[#3c2e24]">
              January 22, 2025
            </div>
          </div>

          {/* Event 3 */}
          <div className="flex flex-col gap-[0.313rem] items-center w-[14.813rem]">
            <div className="w-[13.25rem] h-[10.188rem] relative rotate-[-2deg]">
              <img
                src={img847PxCabCallowayGottlieb19}
                alt="Freelance Writing and Pitching"
                className="w-full h-full object-cover mix-blend-multiply"
              />
            </div>
            <div className="font-serif text-[1.406rem] text-[#3c2e24] text-center tracking-[-0.042rem] w-[13.625rem] leading-[1.1]">
              Freelance Writing and Pitching
            </div>
            <div className="font-serif italic text-[0.688rem] text-[#3c2e24] text-center w-[12.344rem] leading-[1.1]">
              Suyin Haynes and Jessie Lau cover everything that goes into a stand-out pitch
            </div>
            <div className="font-serif italic text-[0.688rem] text-[#3c2e24]">
              June 1, 2025
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}