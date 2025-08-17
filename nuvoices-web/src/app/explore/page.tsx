import Image from "next/image";

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-pink-50">
      {/* Main content */}
      <main className="pt-16 pb-16">
        <div className="container mx-auto px-6 max-w-4xl">
          {/* Page header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-serif mb-8">Explore</h1>
            <p className="text-xl leading-relaxed max-w-2xl mx-auto">
              From our online magazine to our regular podcasts, we support the work of our members in various ways.
            </p>
          </div>

          {/* Event photo */}
          <div className="mb-16">
            <div className="relative h-96 bg-gray-300 overflow-hidden">
              {/* Placeholder for event photo with pink tint */}
              <div className="absolute inset-0 bg-pink-900/30"></div>
              <div className="absolute inset-0 flex items-center justify-center text-white/50">
                [Event/Panel Photo]
              </div>
            </div>
          </div>

          {/* NuStories Magazine section */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">NuStories Magazine</h2>
            <p className="text-gray-700 leading-relaxed">
              Our <a href="/magazine" className="underline hover:no-underline">magazine</a>, NuStories, reaches audiences all around the world. We regularly publish narrative essays, event reviews, articles, multimedia projects and other original content.
            </p>
          </section>

          {/* NuVoices Podcast section */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">NuVoices Podcast</h2>
            <p className="text-gray-700 leading-relaxed">
              Our <a href="/podcast" className="underline hover:no-underline">podcast</a> regularly features women's and minorities' voices on a range of topical issues. It has been named by numerous publications as one of the best podcasts on China today.
            </p>
          </section>

          {/* NuVoices Events section */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">NuVoices Events</h2>
            <p className="text-gray-700 leading-relaxed">
              Our <a href="/events" className="underline hover:no-underline">events</a> and discussion forums aim to foster collaboration among people working across different mediums.
            </p>
          </section>

          {/* NuVoices Directory section */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">NuVoices Directory</h2>
            <p className="text-gray-700 leading-relaxed">
              Our <a href="/directory" className="underline hover:no-underline">directory</a> of more than 600 international experts on Greater China is a popular tool for journalists and event organizers. It has significantly boosted women and minorities' representation in media and events.
            </p>
          </section>
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
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}