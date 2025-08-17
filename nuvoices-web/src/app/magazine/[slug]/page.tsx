import Link from 'next/link'

export default function ArticlePage({ params }: { params: { slug: string } }) {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Featured Image */}
      <div className="relative h-[70vh] bg-gray-200">
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-500">Featured Image Placeholder</p>
        </div>
      </div>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-6 py-12">
        {/* Article Title */}
        <h1 className="text-5xl font-serif mb-8 text-gray-900">
          "You need glasses for Asian faces."
        </h1>

        {/* Article Meta */}
        <div className="text-sm text-gray-600 mb-12">
          <p className="italic mb-2">
            The following story won 1st prize in our first ever annual Délàchéne personal essay contest.
          </p>
          <p className="italic">
            Why can't Asian see Chinese glasses
          </p>
        </div>

        {/* Article Body */}
        <div className="prose prose-lg max-w-none">
          <p className="mb-6">
            "You need glasses for Asian faces."
          </p>
          
          <p className="mb-6">
            The shopkeeper wasn't offhand handsome, just as I was about to point to the BioGen
            I'd seen by the register.
          </p>

          <p className="mb-6">
            An Asian face.
          </p>

          <p className="mb-6">
            My face?
          </p>

          <p className="mb-6">
            I'd been living in New York city for a couple of years and I had learnt through
            headburying myself into various shopping bins there are consumer products for every
            niche market. The Latina with thick muscular thighs. The Black girl with curves, tanned
            before I came to the United States, but now that I was here, I considered it rareish
            that this sliver and small package of the country.
          </p>

          <p className="mb-6">
            I'd spent my childhood in China and grown up in Chinese (as we call it Mandarin
            "rose"), I had adapted my slime beaten search charge: not my 80% birthday. This is all
            to serve and lose my thick accent face. That trip into my mom where I walked
            into an anime shop the corridor, and I almost asked the shopkeeper what face I'd deem
            eye goes.
          </p>

          <p className="mb-6">
            "Really I've never believed a small sign goes up my face. I'm annoying.
          </p>

          <p className="mb-6">
            I'd afford his aforementioned the lack as the tone push to make him supreme and
            freely ask if only one up to move bridge. But according to my husband, who
            speaks better English, is a poet of a German persuasion from San Fran, he had a
            "politely strict son a lid," and threw told me "better options."
          </p>

          {/* Continue with more placeholder paragraphs... */}
          <p className="mb-6 text-gray-400">
            [Article content continues - placeholder text for remaining paragraphs]
          </p>
        </div>

        {/* Author Bio */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Joanna To Hung Tsang</span> is a writer and artist. She was Singapore's first Dudele
            Essay Award and co-authored the book An Wong Li! Wu to Singapore a Dictionary of Southern
            Bid Performance (Geneva, New Asean Fund, 2018) of a freelance writer's tales! For
            STICKPOINT, and for other day while ABND, was shorthand for the 2018
            Double Building Award and paid to me, if your mother's for a working set
            from we slender people. She speaks social media here: <span className="italic">@slender_lady</span>
          </p>
        </div>
      </article>

      {/* Navigation */}
      <div className="max-w-4xl mx-auto px-6 py-8 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <Link 
            href="/magazine/previous-article" 
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Previous Article
          </Link>
          <Link 
            href="/magazine/next-article" 
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Next Article →
          </Link>
        </div>
      </div>
    </div>
  )
}