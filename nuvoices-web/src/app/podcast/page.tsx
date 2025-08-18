import Image from 'next/image'
import Link from 'next/link'

export default function PodcastPage() {
  const episodes = [
    {
      id: 1,
      slug: "diplomacy-influence-impact",
      title: "Diplomacy, Influence & Impact",
      description: "Wenchi Yu talks about working in the US-China-Taiwan landscape",
      date: "May 13, 2025",
      image: "/placeholder-wenchi.jpg"
    },
    {
      id: 2,
      slug: "model-minority",
      title: "How I Stopped Being a Model Minority",
      description: "Anne Anlin Cheng discusses what it means to live firsthand as an Asian American woman",
      date: "April 16, 2025",
      image: "/placeholder-anne.jpg"
    },
    {
      id: 3,
      slug: "red-flowers-bloom",
      title: "Let Only Red Flowers Bloom",
      description: "A Conversation with Emily Feng about her new book",
      date: "March 12, 2025",
      image: "/placeholder-emily.jpg"
    }
  ]

  return (
    <div className="min-h-screen bg-pink-50">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h1 className="text-5xl font-serif text-center mb-6">Podcast</h1>
        <p className="text-xl italic text-center mb-16">
          A show coordinated, produced and edited by the NüVoices board.
        </p>

        {/* Episodes Grid - 3 rows of same episodes for demo */}
        <div className="space-y-12">
          {[1, 2, 3].map((row) => (
            <div key={row} className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {episodes.map((episode) => (
                <Link 
                  key={`${row}-${episode.id}`} 
                  href={`/podcast/${episode.slug}`}
                  className="group cursor-pointer"
                >
                  <div className="aspect-square bg-gray-200 mb-4 overflow-hidden relative">
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                      [Podcast Episode Image]
                    </div>
                  </div>
                  <h3 className="text-xl font-serif mb-2 group-hover:underline">
                    {episode.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2 italic">
                    {episode.description}
                  </p>
                  <p className="text-xs text-gray-500">{episode.date}</p>
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-pink-200 py-8 mt-16">
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
  )
}