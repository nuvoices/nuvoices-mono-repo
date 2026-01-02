import Image from "next/image";
import { Content } from "@/components/ui/Content";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { TaxInformation } from "@/components/TaxInformation";
import { PageLayout } from "@/components/layouts/PageLayout";

export default function AboutPage() {
  return (
    <PageLayout>
      {/* Main content */}
      <main className="flex flex-col items-center py-[2.5rem]">
        <Content className="space-y-[1.25rem]">
          <PageHeader title="About Us" />

          {/* Introduction - 40px = 1.25rem, 50px line height = 1.5625rem */}
          <p className="text-[1.25rem] font-serif leading-[1.5625rem] text-black text-justify">
            NüVoices is an international editorial collective. We celebrate and support the diverse creative work of women and other underrepresented communities working on the subject of China (broadly defined).
          </p>

          {/* 30px = 0.9375rem */}
          <p className="text-[0.9375rem] font-serif leading-[1.6] text-black">
            More women and marginalized groups are writing about China, doing business in China and generally doing interesting things on China than ever before. We're an independent not-for-profit organization that enables more of their voices to be heard.
          </p>

          {/* Event photo - 800px = 25rem, 532px = 16.625rem */}
          <div className="my-[1.25rem]">
            <Image
              src="/nuvoices-event.png"
              alt="NüVoices event"
              width={800}
              height={532}
              className="w-full h-auto"
            />
          </div>

          {/* Content sections - 30px = 0.9375rem */}
          <div className="space-y-[1rem]">
            <Section title="Our Story">
              <p>
                Founded in 2018 and supported by Patreon donors, NüVoices was launched to amplify women's voices on China. Our name comes from the Mandarin Chinese word for woman ("nü"), which helpfully is pronounced like the English word "new" — so you see what we did there. But our scope has since broadened.
              </p>
            </Section>

            <Section title="Our Mission">
              <p>
                As a group, we pledge to support, nurture, and celebrate the amazing, diverse, underrepresented groups in this field — to publish their work and shout about it from the rooftops (and the internet). We aim to showcase the work of women and BIPOC writers, researchers and artists, as well as those who identify as non-binary and trans.
              </p>
            </Section>

            <Section title="Our Values">
              <p>
                We heartily welcome the involvement of people of all genders, including the many good men who contribute to our cause. We expect everyone within our organization to be treated fairly and respectfully, as well as to treat others in the same way. Our editorial board reserves the right to make editorial decisions.
              </p>
            </Section>

            <Section title="Our Location">
              <p className="mb-[0.5rem]">
                Some of us live and work in China, others are based around the world. You do not need to be geographically in China to be part of this project, although you do need to be passionate about the subject of China. This is broadly defined and includes work on the PRC, Hong Kong, Macau, Taiwan, and Chinese influences in the wider world.
              </p>
              <p>
                <span>Get in touch with our team at </span><a href="mailto:nuvoices@protonmail.com" className="text-black no-underline hover:bg-yellow-200 transition-colors">nuvoices@protonmail.com</a>
              </p>
            </Section>

            <TaxInformation>
              <p className="mt-[0.5rem]">
                Read our impact report{' '}
                <a href="https://nuvoices.com/2020/08/25/support-nuvoices-on-patreon/" className="text-black underline hover:opacity-70 transition">
                  here
                </a>
                .
              </p>
            </TaxInformation>
          </div>
        </Content>
      </main>
    </PageLayout>
  );
}