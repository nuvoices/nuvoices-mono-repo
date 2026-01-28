import Image from "next/image";
import Link from "next/link";
import { Content } from "@/components/ui/Content";

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-[#f4ecea]">
      <Content>
        <main className="py-[1.5625rem] flex flex-col gap-[1.5625rem]">
          {/* Heading Section */}
          <div className="flex flex-col gap-[1.25rem]">
            {/* Title */}
            <h1 className="font-serif font-normal text-[2.5rem] leading-[1.2] tracking-[-0.075rem] text-black m-0">
              Explore
            </h1>

            {/* Introduction */}
            <p className="font-serif text-[1.25rem] leading-[1.5625rem] text-black text-justify m-0">
              From our online magazine to our regular podcasts, we support the work of our members in various ways.
            </p>

            {/* Panel Image with Overlay */}
            <div className="relative w-full aspect-[762/508] overflow-hidden">
              <Image
                src="/nuvoices-explore.png"
                alt="NüVoices panel discussion"
                fill
                className="object-cover"
                priority
              />
              {/* Pink overlay using mix-blend-mode */}
              <div className="absolute inset-0 bg-[#dd9ca1] mix-blend-color pointer-events-none" />
            </div>
          </div>

          {/* Grid Section - 2x2 on desktop, 1 column on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-[3.75rem] gap-y-[3.15625rem] py-[1.5rem] justify-items-center md:justify-items-start">
            {/* Magazine */}
            <div className="flex flex-col gap-[1rem] max-w-[18.75rem] items-center">
              <Link
                href="/magazine"
                className="bg-[#3c2e24] rounded-[0.3125rem] px-[1.5rem] py-[0.75rem] text-center no-underline hover:opacity-90 transition max-w-[14rem] box-border flex flex-col gap-0"
              >
                <div className="font-sans font-extrabold text-[0.875rem] text-[#f5f4f1] uppercase">
                  NÜVOICES
                </div>
                <div className="font-sans font-extrabold text-[0.875rem] text-[#f5f4f1] uppercase">
                  MAGAZINE
                </div>
              </Link>
              <p className="font-serif text-[0.8rem] leading-[1.6] text-black text-center m-0">
                Our magazine reaches audiences all around the world. We regularly publish narrative essays, event reviews, articles, multimedia projects and other original content.
              </p>
            </div>

            {/* Podcast */}
            <div className="flex flex-col gap-[1rem] max-w-[18.75rem] items-center">
              <Link
                href="/podcast"
                className="bg-[#3c2e24] rounded-[0.3125rem] px-[1.5rem] py-[0.75rem] text-center no-underline hover:opacity-90 transition max-w-[14rem] box-border flex flex-col gap-0"
              >
                <div className="font-sans font-extrabold text-[0.875rem] text-[#f5f4f1] uppercase">
                  NÜVOICES
                </div>
                <div className="font-sans font-extrabold text-[0.875rem] text-[#f5f4f1] uppercase">
                  PODCAST
                </div>
              </Link>
              <p className="font-serif text-[0.8rem] leading-[1.6] text-black text-center m-0">
                Our podcast regularly features women's and minorities' voices on a range of topical issues. It has been named by numerous publications as one of the best podcasts on China today.
              </p>
            </div>

            {/* News */}
            <div className="flex flex-col gap-[1rem] max-w-[18.75rem] items-center">
              <Link
                href="/news"
                className="bg-[#3c2e24] rounded-[0.3125rem] px-[1.5rem] py-[0.75rem] text-center no-underline hover:opacity-90 transition max-w-[14rem] box-border flex flex-col gap-0"
              >
                <div className="font-sans font-extrabold text-[0.875rem] text-[#f5f4f1] uppercase">
                  NÜVOICES
                </div>
                <div className="font-sans font-extrabold text-[0.875rem] text-[#f5f4f1] uppercase">
                  NEWS
                </div>
              </Link>
              <p className="font-serif text-[0.8rem] leading-[1.6] text-black text-center m-0">
                Our events and discussion forums aim to foster collaboration among people working across different mediums.
              </p>
            </div>

            {/* Directory */}
            <div className="flex flex-col gap-[1rem] max-w-[18.75rem] items-center">
              <Link
                href="/directory"
                className="bg-[#3c2e24] rounded-[0.3125rem] px-[1.5rem] py-[0.75rem] text-center no-underline hover:opacity-90 transition max-w-[14rem] box-border flex flex-col gap-0"
              >
                <div className="font-sans font-extrabold text-[0.875rem] text-[#f5f4f1] uppercase">
                  NÜVOICES
                </div>
                <div className="font-sans font-extrabold text-[0.875rem] text-[#f5f4f1] uppercase">
                  DIRECTORY
                </div>
              </Link>
              <p className="font-serif text-[0.8rem] leading-[1.6] text-black text-center m-0">
                Our directory of more than 600 international experts on Greater China is a popular tool for journalists and event organizers. It has significantly boosted women and minorities' representation in media and events.
              </p>
            </div>
          </div>
        </main>
      </Content>
    </div>
  );
}