import Image from "next/image";

export default function JoinPage() {
  return (
    <div className="min-h-screen bg-pink-50">
      {/* Main content */}
      <main className="pt-16 pb-16">
        <div className="container mx-auto px-6 max-w-4xl">
          {/* Page header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-serif mb-8">Join</h1>
            <p className="text-xl leading-relaxed max-w-2xl mx-auto">
              Come join our vibrant community to find out about opportunities, take part in discussions and meet like-minded people.
            </p>
          </div>

          {/* Join a local chapter section */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Join a local chapter</h2>
            <p className="text-gray-700 leading-relaxed">
              We have active chapters in various cities and regions. Email{" "}
              <a href="mailto:nuvoices@protonmail.com" className="text-blue-600 hover:underline">
                nuvoices@protonmail.com
              </a>{" "}
              with your WhatsApp number and/or WeChat handles to join a local group.
            </p>
          </section>

          {/* Join our global community section */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Join our global community</h2>
            <p className="text-gray-700 leading-relaxed">
              To be part of our wider NuVoices network, come join{" "}
              <a href="#" className="text-blue-600 hover:underline">
                our Facebook group
              </a>
              , where you can keep up with our updates and connect with others in this space.
            </p>
          </section>

          {/* Community photo */}
          <div className="mb-12">
            <div className="relative h-96 bg-gray-300 overflow-hidden">
              {/* Placeholder for community photo with red/burgundy tint overlay */}
              <div className="absolute inset-0 bg-red-900/40"></div>
              <div className="absolute inset-0 flex items-center justify-center text-white/50">
                [Community Event Photo]
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-pink-200 py-8">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-700">Powered by WordPress</p>
            <nav className="flex gap-6 text-sm">
              <a href="/about" className="hover:underline">About</a>
              <a href="/join" className="hover:underline">Join</a>
              <a href="/donate" className="hover:underline">Donate</a>
              <a href="/submit" className="hover:underline">Submit</a>
              <a href="/contact" className="hover:underline">Contact</a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}