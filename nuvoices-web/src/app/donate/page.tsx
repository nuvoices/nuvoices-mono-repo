import Image from "next/image";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { TaxInformation } from "@/components/TaxInformation";
import { PageLayout } from "@/components/layouts/PageLayout";

export default function DonatePage() {
  return (
    <PageLayout>
      {/* Main content */}
      <main className="flex flex-col items-center px-6 py-[2.5rem]">
        <div className="max-w-[25rem] w-full space-y-[1.25rem]">
          <PageHeader title="Donate" />

          {/* Introduction - 40px = 1.25rem, 50px line height = 1.5625rem */}
          <p className="text-[1.25rem] font-serif leading-[1.5625rem] text-black text-justify mb-[1.25rem]">
            NüVoices is a registered non-profit charity in the United States. We are a 100% volunteer organization and need your support to provide even more amazing content, events, and opportunities to you.
          </p>

          {/* Donate image - 800px = 25rem, 532px = 16.625rem */}
          <div className="my-[1.25rem]">
            <Image
              src="/nuvoices-donate.png"
              alt="NüVoices donation support"
              width={800}
              height={532}
              className="w-full h-auto"
            />
          </div>

          {/* Content sections - 30px = 0.9375rem */}
          <div className="space-y-[1rem]">
            <Section title="Become a Patreon subscriber">
              <p>
                Join our{" "}
                <a
                  href="https://www.patreon.com/nuvoices"
                  className="text-black underline hover:bg-yellow-200 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Patreon
                </a>{" "}
                community for as little as $1 a month, and you'll get to receive great freebies — including a custom newsletter, exclusive podcast content, free books, shout-outs on our podcast and one-on-one career development sessions.
              </p>
            </Section>

            <Section title="Support us on FundJournalism.org">
              <p>
                Help us fundraise and build financial stability through our FundJournalism page. Here, you can choose between different donation options — from a one-time payment to a monthly or yearly contribution.
              </p>
            </Section>

            <Section title="One-time donation">
              <p>
                If you'd prefer to make a one-off donation, please visit our{" "}
                <a
                  href="https://www.paypal.com/donate?token=Pwm4Zffsus7PVSGbC59GPsIqHp89zG0yNGcBtJtLIeCXrkr7Bu1JsfMcy87FEZ1iUEUuqSGwTp8FDLap"
                  className="text-black underline hover:bg-yellow-200 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Paypal page
                </a>{" "}
                or email us at <a href="mailto:nuvoices@protonmail.com" className="text-black no-underline hover:bg-yellow-200 transition-colors">nuvoices@protonmail.com</a> for other options.
              </p>
            </Section>

            <TaxInformation />
          </div>
        </div>
      </main>
    </PageLayout>
  );
}