import Image from "next/image";

export default function JoinPage() {
  return (
    <div className="min-h-screen bg-[#f4ecea]">
      {/* Main content */}
      <main className="flex flex-col items-center px-6 py-[2.5rem]">
        <div className="max-w-[25rem] w-full space-y-[1.25rem]">
          {/* Page header - 80px = 2.5rem */}
          <div className="mb-[1.25rem]">
            <h1 className="text-[2.5rem] font-serif leading-[1.2] tracking-[-0.075rem] text-black">
              Join
            </h1>
          </div>

          {/* Introduction - 40px = 1.25rem, 50px line height = 1.5625rem */}
          <p className="text-[1.25rem] font-serif leading-[1.5625rem] text-black text-justify mb-[1.25rem]">
            Come join our vibrant community to find out about opportunities, take part in discussions and meet like-minded people.
          </p>

          {/* Content sections - 30px = 0.9375rem */}
          <div className="space-y-[1rem] text-[0.9375rem] font-serif leading-[1.6] text-black">
            {/* Join a local chapter section */}
            <div>
              <h2 className="font-bold mb-[0.25rem]">Join a local chapter</h2>
              <p>
                We have active chapters in various cities and regions. Email{" "}
                <a href="mailto:nuvoices@protonmail.com" className="text-black underline hover:bg-yellow-200 transition-colors">
                  nuvoices@protonmail.com
                </a>{" "}
                with your WhatsApp number and/or WeChat handles to join a local group.
              </p>
            </div>

            {/* Join our global community section */}
            <div>
              <h2 className="font-bold mb-[0.25rem]">Join our global community</h2>
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
            </div>
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
        </div>
      </main>
    </div>
  );
}