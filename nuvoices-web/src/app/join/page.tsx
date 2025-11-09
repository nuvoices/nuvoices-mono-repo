import Image from "next/image";
import { Content } from "@/components/ui/Content";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { PageLayout } from "@/components/layouts/PageLayout";

export default function JoinPage() {
  return (
    <PageLayout>
      {/* Main content */}
      <main className="flex flex-col items-center py-[2.5rem]">
        <Content className="space-y-[1.25rem]">
          <PageHeader title="Join" />

          {/* Introduction - 40px = 1.25rem, 50px line height = 1.5625rem */}
          <p className="text-[1.25rem] font-serif leading-[1.5625rem] text-black text-justify mb-[1.25rem]">
            Come join our vibrant community to find out about opportunities, take part in discussions and meet like-minded people.
          </p>

          {/* Content sections - 30px = 0.9375rem */}
          <div className="space-y-[1rem]">
            <Section title="Join a local chapter">
              <p>
                We have active chapters in various cities and regions. Email{" "}
                <a href="mailto:nuvoices@protonmail.com" className="text-black underline hover:bg-yellow-200 transition-colors">
                  nuvoices@protonmail.com
                </a>{" "}
                with your WhatsApp number and/or WeChat handles to join a local group.
              </p>
            </Section>

            <Section title="Join our global community">
              <p>
                To be part of our wider NuVoices network, come join{" "}
                <a
                  href="https://www.facebook.com/groups/214309679373603/"
                  className="text-black underline hover:bg-yellow-200 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  our Facebook group
                </a>
                , where you can keep up with our updates and connect with others in this space.
              </p>
            </Section>
          </div>

          {/* Community photo - 800px = 25rem, 532px = 16.625rem */}
          <div className="my-[1.25rem]">
            <Image
              src="/nuvoices-community.png"
              alt="NüVoices community event"
              width={800}
              height={532}
              className="w-full h-auto"
            />
          </div>
        </Content>
      </main>
    </PageLayout>
  );
}