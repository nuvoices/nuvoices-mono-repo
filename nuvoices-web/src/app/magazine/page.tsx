import Image from "next/image";

export default function MagazinePage() {
  return (
    <div className="min-h-screen bg-pink-50">
      {/* Main content */}
      <main className="pt-16 pb-16">
        <div className="container mx-auto px-6 max-w-6xl">
          {/* Page header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-serif mb-4">NüStories</h1>
            <p className="text-xl italic mb-8">A magazine of ideas from minority voices on China subjects</p>
            <a href="/submissions" className="px-8 py-3 bg-amber-900 text-white font-medium uppercase text-sm tracking-wider hover:bg-amber-800 transition inline-block">
              SUBMISSIONS
            </a>
          </div>

          {/* Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {/* Row 1 */}
            <article className="group cursor-pointer">
              <div className="h-48 bg-gray-200 mb-4 overflow-hidden">
                <div className="h-full flex items-center justify-center text-gray-500">
                  [Supermarket Image]
                </div>
              </div>
              <h3 className="text-xl font-serif mb-2 group-hover:underline">
                A Trip to the Supermarket
              </h3>
              <p className="text-sm text-gray-600 mb-2 italic">
                There's a burden you feel when you don't know how to write your own name
              </p>
              <p className="text-xs text-gray-500">June 1, 2025</p>
            </article>

            <article className="group cursor-pointer">
              <div className="h-48 bg-gray-200 mb-4 overflow-hidden">
                <div className="h-full flex items-center justify-center text-gray-500">
                  [Film Festival Image]
                </div>
              </div>
              <h3 className="text-xl font-serif mb-2 group-hover:underline">
                Beijing International Film Festival
              </h3>
              <p className="text-sm text-gray-600 mb-2 italic">
                The special screening event in London brought Chinese films to a global audience
              </p>
              <p className="text-xs text-gray-500">May 21, 2025</p>
            </article>

            <article className="group cursor-pointer">
              <div className="h-48 bg-gray-200 mb-4 overflow-hidden">
                <div className="h-full flex items-center justify-center text-gray-500">
                  [Diaspora Image]
                </div>
              </div>
              <h3 className="text-xl font-serif mb-2 group-hover:underline">
                In Queer Diaspora, My Fear Leaks Through
              </h3>
              <p className="text-sm text-gray-600 mb-2 italic">
                Maybe this is another story of feeling both inside and outside of China
              </p>
              <p className="text-xs text-gray-500">June 1, 2025</p>
            </article>

            {/* Row 2 */}
            <article className="group cursor-pointer">
              <div className="h-48 bg-gray-200 mb-4 overflow-hidden">
                <div className="h-full flex items-center justify-center text-gray-500">
                  [Mother Tongue Image]
                </div>
              </div>
              <h3 className="text-xl font-serif mb-2 group-hover:underline">
                Mother Tongue
              </h3>
              <p className="text-sm text-gray-600 mb-2 italic">
                Identity is an ambiguous, elusive thing. It both arises from the self and is shaped by others in myriad ways.
              </p>
              <p className="text-xs text-gray-500">June 1, 2025</p>
            </article>

            <article className="group cursor-pointer">
              <div className="h-48 bg-gray-200 mb-4 overflow-hidden">
                <div className="h-full flex items-center justify-center text-gray-500">
                  [Hong Kong Exhibition Image]
                </div>
              </div>
              <h3 className="text-xl font-serif mb-2 group-hover:underline">
                Ways of Remembering Hong Kong
              </h3>
              <p className="text-sm text-gray-600 mb-2 italic">
                An exhibition explores how, for Hongkongers, remembering is an act of resistance.
              </p>
              <p className="text-xs text-gray-500">May 23, 2025</p>
            </article>

            <article className="group cursor-pointer">
              <div className="h-48 bg-gray-200 mb-4 overflow-hidden">
                <div className="h-full flex items-center justify-center text-gray-500">
                  [Shanghai Dolls Image]
                </div>
              </div>
              <h3 className="text-xl font-serif mb-2 group-hover:underline">
                Amy Ng on playwriting and 'Shanghai Dolls'
              </h3>
              <p className="text-sm text-gray-600 mb-2 italic">
                Ng's newest play is a feminist retelling of two women in the Cultural Revolution
              </p>
              <p className="text-xs text-gray-500">May 9, 2025</p>
            </article>

            {/* Row 3 */}
            <article className="group cursor-pointer">
              <div className="h-48 bg-gray-200 mb-4 overflow-hidden">
                <div className="h-full flex items-center justify-center text-gray-500">
                  [Midwestern Chinese Girl Image]
                </div>
              </div>
              <h3 className="text-xl font-serif mb-2 group-hover:underline">
                I am a Midwestern Chinese Girl
              </h3>
              <p className="text-sm text-gray-600 mb-2 italic">
                It was hard to escape the subconscious pressure to measure our Asian-ness
              </p>
              <p className="text-xs text-gray-500">May 6, 2025</p>
            </article>

            <article className="group cursor-pointer">
              <div className="h-48 bg-gray-200 mb-4 overflow-hidden">
                <div className="h-full flex items-center justify-center text-gray-500">
                  [Beauty Queen Image]
                </div>
              </div>
              <h3 className="text-xl font-serif mb-2 group-hover:underline">
                Beauty Queen
              </h3>
              <p className="text-sm text-gray-600 mb-2 italic">
                Anne Anlin Cheng reflects on beauty—its judgment, care, and attention—in this excerpt from her memoir, 'Ordinary Disasters'
              </p>
              <p className="text-xs text-gray-500">May 8, 2025</p>
            </article>

            <article className="group cursor-pointer">
              <div className="h-48 bg-gray-200 mb-4 overflow-hidden">
                <div className="h-full flex items-center justify-center text-gray-500">
                  [What You Know Image]
                </div>
              </div>
              <h3 className="text-xl font-serif mb-2 group-hover:underline">
                What You Know (And Didn't Know)
              </h3>
              <p className="text-sm text-gray-600 mb-2 italic">
                She loved you, but you fell asleep at her funeral.
              </p>
              <p className="text-xs text-gray-500">May 5, 2025</p>
            </article>
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
              <a href="/submissions" className="hover:underline">Submit</a>
              <a href="/contact" className="hover:underline">Contact</a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}