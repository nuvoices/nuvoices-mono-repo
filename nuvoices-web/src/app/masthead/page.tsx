import Image from 'next/image';
import { Content } from '@/components/ui/Content';

export default function MastheadPage() {
  return (
    <div className="min-h-screen bg-[#f4ecea]">
      <Content>
        <main className="py-[1.5rem]">
          <div className="flex flex-col gap-[1.25rem] items-center">
            {/* Title */}
            <h1 className="font-serif font-normal text-[2.5rem] leading-[1.2] tracking-[-0.075rem] text-black m-0 text-center">
              Masthead
            </h1>

            {/* Masthead Image with Overlay */}
            <div className="relative w-full aspect-[800/532] overflow-hidden rounded-[0.313rem]">
              <Image
                src="/nuvoices-masthead.jpg"
                alt="NüVoices Team"
                fill
                className="object-cover"
                priority
              />
              {/* Pink overlay using mix-blend-mode */}
              <div className="absolute inset-0 bg-[#dd9ca1] mix-blend-color pointer-events-none" />
            </div>

            {/* Team Content */}
            <div className="font-serif text-[0.9375rem] leading-[1.6] text-black text-center w-full max-w-[23.8125rem]">
              <p className="m-0">
                <span className="font-bold">Executives</span>
                <br />
                <span className="italic">Founder: </span>
                <span>Joanna Chiu</span>
              </p>
              <p className="m-0">
                <span className="italic">Chair</span>
                <span>: Chenni Xu</span>
              </p>
              <p className="m-0">
                <span className="italic">Vice Chair</span>
                <span>: Joanna Chiu</span>
              </p>
              <p className="m-0">
                <span className="italic">Treasurer</span>
                <span>: Anne Henochowicz</span>
              </p>
              <p className="m-0">
                <span className="italic">Secretary</span>
                <span>: Solarina Ho</span>
              </p>
              <p className="m-0">
                <span className="italic">Board</span>
                <span>: Rui Zhong, Sophia Yan, Saga Ringmar, Cindy Gao, Jessie Lau, Megan Cattel, Elizabeth, Siodhbhra</span>
              </p>

              <p className="m-0">&nbsp;</p>

              <p className="font-bold m-0">Online</p>
              <p className="m-0">
                <span className="italic">Managing Editor</span>
                <span>: </span>
                <span>Jessie Lau</span>
              </p>
              <p className="m-0">
                <span className="italic">Digital Editor</span>
                <span>: Nicole Fan</span>
              </p>
              <p className="m-0">
                <span className="italic">Website Editor</span>
                <span>: David Chu</span>
              </p>
              <p className="m-0">
                <span className="italic">Social Editor</span>
                <span>: Daisy Singh Greaves</span>
              </p>
              <p className="m-0">
                <span className="italic">Deputy Social Editor</span>
                <span>: Angel Sun</span>
              </p>

              <p className="m-0">&nbsp;</p>

              <p className="font-bold m-0">Magazine</p>
              <p className="m-0">
                <span className="italic">Head of Editorial</span>
                <span>: Jessie Lau</span>
              </p>
              <p className="m-0">
                <span className="italic">Associate Editors</span>
                <span>: Suchita Thepkanjana, Heather Irvine</span>
              </p>
              <p className="m-0">
                <span className="italic">Contributing Editors</span>
                <span>: Lin Taylor, Lijia Zhang, Nerys Avery, Mary Hennock, Cleo Li-Schwartz, Rhoda Kwan</span>
              </p>

              <p className="m-0">&nbsp;</p>

              <p className="font-bold m-0">Podcast</p>
              <p className="m-0">
                <span className="italic">Managing Editor</span>
                <span>: Megan Cattel</span>
              </p>
              <p className="m-0">
                <span className="italic">Editor and Sound Designer</span>
                <span>: Rebecca Liu</span>
              </p>
              <p className="m-0">
                <span className="italic">Producer</span>
                <span>: Wing Kuang</span>
              </p>
              <p className="m-0">
                <span className="italic">Hosts</span>
                <span>: </span>
                <span>Solarina Ho, Sophia Yan, Joanna Chiu, Megan Cattel, Jessie Lau, Lijia Zhang, Chenni Xu</span>
              </p>

              <p>&nbsp;</p>
            </div>
          </div>
        </main>
      </Content>
    </div>
  );
}
