import Image from 'next/image'
import Link from 'next/link'

export default function PodcastEpisodePage({ params }: { params: { slug: string } }) {
  return (
    <div className="min-h-screen bg-pink-50">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Episode Image */}
        <div className="aspect-[4/3] bg-gray-200 mb-8 overflow-hidden relative max-w-2xl mx-auto">
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            [Episode Featured Image]
          </div>
        </div>

        {/* Episode Title */}
        <h1 className="text-4xl md:text-5xl font-serif text-center mb-6 leading-tight">
          Wenchi Yu, a Career in Diplomacy, Influence and Impact
        </h1>

        {/* Episode Date */}
        <p className="text-center text-gray-600 mb-12">May 13, 2025</p>

        {/* Episode Info */}
        <div className="mb-8">
          <p className="font-semibold mb-4">NüVoices Podcast #121</p>
          
          <p className="mb-4">
            This week, we have co-hosts Chenni Xu and Solarina Ho in conversation with Wenchi 
            Yu on the current landscape of the US-China-Taiwan relationship and working as a 
            bridge-builder in this arena.
          </p>

          <p className="mb-4">
            In this episode, Wenchi discusses how her identity is the throughline of her career in 
            labor rights, civil rights, diplomacy, media and non-profit leadership from being 
            Hakka in Taiwan, to the US, to Mainland China and back to the US again.
          </p>

          <p className="mb-4">
            Wenchi has undergone a storied career working in the US Congress, the State 
            Department under Hillary Clinton, at Goldman Sachs scaling up the 10,000 women 
            program in Asia, and VIPKid, not to mention her non-profit{' '}
            <Link href="#" className="underline">Global Women Asia</Link>.
          </p>

          <p className="mb-8">
            Now she is heading up her eponymous podcast,{' '}
            <Link href="#" className="underline">Perspectives with Wenchi Yu</Link>, 
            discussing current events such as the semi-conductor industry, AI and bilateral trade 
            programs with key industry experts and practitioners, which is available on YouTube 
            and podcast platforms.
          </p>
        </div>

        {/* Divider */}
        <hr className="border-gray-300 my-12" />

        {/* About Guest Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">About our guest</h2>
          <p className="text-gray-700 italic">
            Wenchi Yu is a prominent advocate for expansive leadership and diverse perspectives. Her 
            career spans multiple sectors, including the U.S. Department of State, U.S. Congress, 
            Goldman Sachs, global technology companies, nonprofits, and media—making her a 
            versatile expert in Asia and Global affairs, market entry strategies, public and community 
            relations, diplomacy, and foreign policy. She is the host of TaiwanPlus' new program, DC 
            Insiders.
          </p>
        </section>

        {/* About Hosts Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">About our hosts</h2>
          <p className="text-gray-700 mb-4">
            <span className="italic">Chenni Xu</span> is NüVoices Chair and a communications expert in emerging markets' growth 
            fintechs, currently serving as comms lead for Nubank, and previously Head of North 
            America Comms for Ant Group.
          </p>
          <p className="text-gray-700">
            <span className="italic">Solarina Ho</span> is NüVoices board member (executive committee member) and a writer and 
            journalist based in Toronto, Canada.
          </p>
        </section>

        {/* Navigation */}
        <div className="border-t border-gray-300 pt-8 mt-12">
          <div className="flex justify-between items-start">
            <Link href="/podcast/previous-episode" className="flex-1 text-left">
              <p className="text-sm text-gray-500 mb-1">← Previous</p>
              <p className="text-sm hover:underline">
                Feminist Rebels from Face-Off: the U.S. vs China with Jane Perlez
              </p>
            </Link>
            <Link href="/podcast/next-episode" className="flex-1 text-right">
              <p className="text-sm text-gray-500 mb-1">Next →</p>
              <p className="text-sm hover:underline">
                Soualie Vignettes, Demystifying Eco-Living and Sustainability Myths
              </p>
            </Link>
          </div>
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