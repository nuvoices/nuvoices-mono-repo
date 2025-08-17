import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section with gradient background */}
      <section className="relative bg-gradient-to-b from-pink-100 via-pink-50 to-white pt-16 pb-16">
        <div className="container mx-auto px-6 text-center">
          {/* Logo */}
          <div className="mb-8">
            <div className="w-32 h-32 mx-auto bg-pink-400 rounded-full flex items-center justify-center relative">
              <span className="text-white text-5xl font-bold">女</span>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-pink-400 rounded-full"></div>
            </div>
            <h1 className="mt-4 text-xl tracking-wider">NÜVOICES</h1>
          </div>

          {/* Tagline */}
          <h2 className="text-4xl md:text-5xl font-serif text-gray-900 mb-12 max-w-3xl mx-auto leading-tight" style={{ fontFamily: 'var(--font-serif)' }}>
            Amplifying the voices of women and minority experts on China
          </h2>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <a href="/join" className="px-8 py-3 bg-amber-900 text-white font-medium uppercase text-sm tracking-wider hover:bg-amber-800 transition inline-block">
              JOIN
            </a>
            <button className="px-8 py-3 bg-amber-900 text-white font-medium uppercase text-sm tracking-wider hover:bg-amber-800 transition">
              DONATE
            </button>
            <button className="px-8 py-3 bg-amber-900 text-white font-medium uppercase text-sm tracking-wider hover:bg-amber-800 transition">
              EXPLORE
            </button>
          </div>
        </div>
      </section>

      {/* Featured Content Section */}
      <section className="container mx-auto px-6 py-8">
        <h3 className="text-2xl font-semibold text-center mb-8">Featured Content</h3>
        
        {/* Mother Tongue Feature */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="relative h-96 bg-gray-200 mb-4">
            {/* Placeholder for Mother Tongue image */}
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
              [Mother Tongue Feature Image]
            </div>
          </div>
          <h4 className="text-3xl font-serif text-center mb-2">Mother Tongue</h4>
          <p className="text-center text-gray-600">June 1, 2025</p>
        </div>
      </section>

      {/* Magazine Section */}
      <section className="container mx-auto px-6 py-8">
        <h3 className="text-2xl font-semibold text-center mb-8">Magazine</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Article 1 */}
          <article className="group cursor-pointer">
            <div className="h-48 bg-gray-200 mb-4 overflow-hidden">
              <div className="h-full flex items-center justify-center text-gray-500">
                [Supermarket Image]
              </div>
            </div>
            <h4 className="font-semibold text-lg mb-2 group-hover:underline">
              A Trip to the Supermarket
            </h4>
            <p className="text-sm text-gray-600 mb-1">
              One writer shares the little joys she found living in China
            </p>
            <p className="text-xs text-gray-500">June 1, 2025</p>
          </article>

          {/* Article 2 */}
          <article className="group cursor-pointer">
            <div className="h-48 bg-gray-200 mb-4 overflow-hidden">
              <div className="h-full flex items-center justify-center text-gray-500">
                [Film Festival Image]
              </div>
            </div>
            <h4 className="font-semibold text-lg mb-2 group-hover:underline">
              Beijing International Film Festival
            </h4>
            <p className="text-sm text-gray-600 mb-1">
              One of our writers shares her thoughts on Chinese films in a global audience
            </p>
            <p className="text-xs text-gray-500">May 21, 2025</p>
          </article>

          {/* Article 3 */}
          <article className="group cursor-pointer">
            <div className="h-48 bg-gray-200 mb-4 overflow-hidden">
              <div className="h-full flex items-center justify-center text-gray-500">
                [Diaspora Image]
              </div>
            </div>
            <h4 className="font-semibold text-lg mb-2 group-hover:underline">
              In Queer Diaspora, My Fear Leaks Through
            </h4>
            <p className="text-sm text-gray-600 mb-1">
              Maybe this is another story of finding both inside and outside of China
            </p>
            <p className="text-xs text-gray-500">June 1, 2025</p>
          </article>
        </div>
      </section>

      {/* Podcast Section */}
      <section className="container mx-auto px-6 py-8">
        <h3 className="text-2xl font-semibold text-center mb-8">Podcast</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Podcast 1 */}
          <article className="group cursor-pointer">
            <div className="h-48 bg-gray-200 mb-4 overflow-hidden">
              <div className="h-full flex items-center justify-center text-gray-500">
                [Podcast Image 1]
              </div>
            </div>
            <h4 className="font-semibold text-lg mb-2 group-hover:underline">
              Diplomacy, Influence & Impact
            </h4>
            <p className="text-sm text-gray-600 mb-1">
              Xiaoqiu Yu discusses the "soft power" of US-China Taiwan landscape
            </p>
            <p className="text-xs text-gray-500">May 15, 2025</p>
          </article>

          {/* Podcast 2 */}
          <article className="group cursor-pointer">
            <div className="h-48 bg-gray-200 mb-4 overflow-hidden">
              <div className="h-full flex items-center justify-center text-gray-500">
                [Podcast Image 2]
              </div>
            </div>
            <h4 className="font-semibold text-lg mb-2 group-hover:underline">
              How I Stopped Being a Model Minority
            </h4>
            <p className="text-sm text-gray-600 mb-1">
              Anne shares how realizing she needed to pause to live firsthand as an Asian American woman
            </p>
            <p className="text-xs text-gray-500">April 16, 2025</p>
          </article>

          {/* Podcast 3 */}
          <article className="group cursor-pointer">
            <div className="h-48 bg-gray-200 mb-4 overflow-hidden">
              <div className="h-full flex items-center justify-center text-gray-500">
                [Podcast Image 3]
              </div>
            </div>
            <h4 className="font-semibold text-lg mb-2 group-hover:underline">
              Let Only Red Flowers Bloom
            </h4>
            <p className="text-sm text-gray-600 mb-1">
              A conversation with Emily Feng about her new book
            </p>
            <p className="text-xs text-gray-500">March 12, 2025</p>
          </article>
        </div>
      </section>

      {/* Events Section */}
      <section className="container mx-auto px-6 py-8 pb-16">
        <h3 className="text-2xl font-semibold text-center mb-8">Events</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Event 1 */}
          <article className="group cursor-pointer">
            <div className="h-48 bg-gray-200 mb-4 overflow-hidden">
              <div className="h-full flex items-center justify-center text-gray-500">
                [Event Image 1]
              </div>
            </div>
            <h4 className="font-semibold text-lg mb-2 group-hover:underline">
              Transforming Memory into Story
            </h4>
            <p className="text-sm text-gray-600 mb-1">
              Join us for a nonfiction writing course inspired by personal archives
            </p>
            <p className="text-xs text-gray-500">March 29, 2025</p>
          </article>

          {/* Event 2 */}
          <article className="group cursor-pointer">
            <div className="h-48 bg-gray-200 mb-4 overflow-hidden">
              <div className="h-full flex items-center justify-center text-gray-500">
                [Event Image 2]
              </div>
            </div>
            <h4 className="font-semibold text-lg mb-2 group-hover:underline">
              2025 NüStories Essay Contest
            </h4>
            <p className="text-sm text-gray-600 mb-1">
              Our first non-fiction personal essay contest focusing on the theme of Chinese identity
            </p>
            <p className="text-xs text-gray-500">January 1, 2025</p>
          </article>

          {/* Event 3 */}
          <article className="group cursor-pointer">
            <div className="h-48 bg-gray-200 mb-4 overflow-hidden">
              <div className="h-full flex items-center justify-center text-gray-500">
                [Event Image 3]
              </div>
            </div>
            <h4 className="font-semibold text-lg mb-2 group-hover:underline">
              Freelance Writing and Pitching
            </h4>
            <p className="text-sm text-gray-600 mb-1">
              Learn the essentials of freelance writing, everything that goes into a stand out pitch
            </p>
            <p className="text-xs text-gray-500">June 1, 2025</p>
          </article>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-pink-100 py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-gray-700">
                <strong>Nuvoices</strong> is an international editorial collective of women and other underrepresented communities working on the subject of China.
              </p>
            </div>
            <div className="flex gap-6 text-sm">
              <a href="/about" className="hover:underline">About</a>
              <a href="/join" className="hover:underline">Join</a>
              <a href="/donate" className="hover:underline">Donate</a>
              <a href="/submit" className="hover:underline">Submit</a>
              <a href="/contact" className="hover:underline">Contact</a>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-4">Powered by WordPress</p>
        </div>
      </footer>
    </div>
  );
}