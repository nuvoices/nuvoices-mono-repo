import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-pink-50">
      {/* Main content */}
      <main className="pt-16 pb-16">
        <div className="container mx-auto px-6 max-w-4xl">
          {/* Page header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-serif mb-4">About Us</h1>
            <p className="text-3xl">关于我们</p>
          </div>

          {/* Introduction */}
          <div className="prose prose-lg max-w-none mb-12">
            <p className="mb-6">
              NüVoices is an international editorial collective. We celebrate and support the diverse creative work of women and other underrepresented communities working on the subject of China (broadly defined).
            </p>
            <p>
              More women and marginalized groups are writing about China, doing business in China and generally doing interesting things on China than ever before. We're an independent not-for-profit organization that enables more of their voices to be heard.
            </p>
          </div>

          {/* Event photo */}
          <div className="mb-12">
            <div className="relative h-96 bg-gray-300 overflow-hidden">
              {/* Placeholder for event photo with pink tint overlay */}
              <div className="absolute inset-0 bg-pink-900/20"></div>
              <div className="absolute inset-0 flex items-center justify-center text-white/50">
                [Event Photo]
              </div>
            </div>
          </div>

          {/* Our Story section */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
            <p className="text-gray-700 leading-relaxed">
              Founded in 2018 and supported by Patreon donors, NüVoices was launched to amplify women's voices on China. Our name comes from the Mandarin Chinese word for woman ("nü"), which helpfully is pronounced like the English word "new" — so you see what we did there. But our scope has since broadened.
            </p>
          </section>

          {/* Our Mission section */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="text-gray-700 leading-relaxed">
              As a group, we pledge to support, nurture, and celebrate the amazing, diverse, underrepresented groups in this field — to publish their work and shout about it from the rooftops (and the internet). We aim to showcase the work of women and BIPOC writers, researchers and artists, as well as those who identify as non-binary and trans.
            </p>
          </section>

          {/* Our Values section */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Our Values</h2>
            <p className="text-gray-700 leading-relaxed">
              We heartily welcome the involvement of people of all genders, including the many good men who contribute to our cause. We expect everyone within our organization to be treated fairly and respectfully, as well as to treat others in the same way. Our editorial board reserves the right to make editorial decisions.
            </p>
          </section>

          {/* Our Location section */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Our Location</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Some of us live and work in China, others are based around the world. You do not need to be geographically in China to be part of this project, although you do need to be passionate about the subject of China. This is broadly defined and includes work on the PRC, Hong Kong, Macau, Taiwan, and Chinese influences in the wider world.
            </p>
            <p className="text-gray-700">
              Get in touch with our team at{" "}
              <a href="mailto:nuvoices@protonmail.com" className="text-blue-600 hover:underline">
                nuvoices@protonmail.com
              </a>
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
              <a href="/contact" className="hover:underline">Contact</a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}