import Image from "next/image";

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-[#f4ecea]">
      {/* Main content */}
      <main className="flex flex-col items-center px-6 py-[2.5rem]">
        <div className="max-w-[23.8125rem] w-full space-y-[1.25rem]">
          {/* Page header - 80px = 2.5rem */}
          <div className="mb-[1.25rem]">
            <h1 className="text-[2.5rem] font-serif leading-[1.2] tracking-[-0.075rem] text-black">
              Explore
            </h1>
          </div>

          {/* Introduction - 40px = 1.25rem, 50px line height = 1.5625rem */}
          <p className="text-[1.25rem] font-serif leading-[1.5625rem] text-black text-justify mb-[1.25rem]">
            From our online magazine to our regular podcasts, we support the work of our members in various ways.
          </p>

          {/* Panel photo - 762px = 23.8125rem, 508px = 15.875rem */}
          <div className="my-[1.25rem]">
            <Image
              src="/nuvoices-explore.png"
              alt="NüVoices panel discussion"
              width={762}
              height={508}
              className="w-full h-auto"
            />
          </div>

          {/* Content sections - 30px = 0.9375rem */}
          <div className="space-y-[1rem] text-[0.9375rem] font-serif leading-[1.6] text-black">
            {/* NuStories Magazine section */}
            <div>
              <h2 className="font-bold mb-[0.25rem]">NuStories Magazine</h2>
              <p>
                Our{" "}
                <a href="/magazine" className="text-black underline hover:bg-yellow-200 transition-colors">
                  magazine
                </a>
                , NüStories, reaches audiences all around the world. We regularly publish narrative essays, event reviews, articles, multimedia projects and other original content.
              </p>
            </div>

            {/* NuVoices Podcast section */}
            <div>
              <h2 className="font-bold mb-[0.25rem]">NuVoices Podcast</h2>
              <p>
                Our{" "}
                <a href="/podcast" className="text-black underline hover:bg-yellow-200 transition-colors">
                  podcast
                </a>{" "}
                regularly features women's and minorities' voices on a range of topical issues. It has been{" "}
                <a
                  href="https://www.timeoutshanghai.com/features/City_Life_/52265/Listen-up-8-brilliant-podcasts-all-about-China.html"
                  className="text-black underline hover:bg-yellow-200 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  named
                </a>{" "}
                by numerous publications as one of the best podcasts on China today.
              </p>
            </div>

            {/* NuVoices Events section */}
            <div>
              <h2 className="font-bold mb-[0.25rem]">NuVoices Events</h2>
              <p>
                Our events and discussion forums aim to foster collaboration among people working across different mediums.
              </p>
            </div>

            {/* NuVoices Directory section */}
            <div>
              <h2 className="font-bold mb-[0.25rem]">NuVoices Directory</h2>
              <p>
                Our{" "}
                <a
                  href="https://docs.google.com/spreadsheets/d/13l9IH7kWahhXwWFsMtBdrMs11gWYGOKqNI6rfUM84k4/edit#gid=0"
                  className="text-black underline hover:bg-yellow-200 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  directory
                </a>{" "}
                of more than 600 international experts on Greater China is a popular tool for journalists and event organizers. It has significantly boosted women and minorities' representation in media and events.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}