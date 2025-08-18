export default function DirectoryPage() {
  return (
    <div className="min-h-screen bg-pink-50">
      <main className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl font-serif text-gray-900 mb-8">Expert Directory</h1>
          
          <p className="text-xl text-gray-700 mb-12 leading-relaxed">
            Our directory of international experts on China is a popular tool for journalists and event organizers.
          </p>
          
          <button className="bg-gray-800 text-white px-8 py-4 text-lg font-medium hover:bg-gray-700 transition-colors mb-16">
            ACCESS OUR DIRECTORY HERE
          </button>
          
          <div className="mb-12">
            <p className="text-lg text-gray-700 leading-relaxed mb-4">
              Featuring nearly 700 female, non-binary and BIPOC experts on China, our directory has significantly boosted 
              the representation of women and minorities in media and events. See press articles from{" "}
              <span className="underline">Foreign Policy</span> and{" "}
              <span className="underline">Globe and Mail</span> and positive testimonials such as this:
            </p>
            
            <blockquote className="italic text-lg text-gray-700 leading-relaxed mb-12 pl-4 border-l-4 border-gray-300">
              "The other week I was asked by British magazine/radio station to give a live radio interview on some China-related 
              topics. It was a really great opportunity, and I have NüVoices to thank for it! The outlet told me they found me 
              when they were searching the NüVoices directory for a London-based China watcher."
            </blockquote>
          </div>
          
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Looking for other resources?</h2>
            <ul className="space-y-4 text-lg text-gray-700">
              <li>
                • For work by Black practitioners, artists, & scholars on Greater China, check out the{" "}
                <span className="underline">Black Voices on Greater China</span> crowdsourced directory.
              </li>
              <li>
                • For resources on fighting anti-East and Southeast Asian racism, see our guide{" "}
                <span className="underline">here</span>.
              </li>
            </ul>
          </div>
          
          <div className="flex justify-center">
            <img 
              src="/api/placeholder/600/400" 
              alt="Historical protest scene with people holding signs"
              className="w-full max-w-lg rounded-lg shadow-lg"
            />
          </div>
        </div>
      </main>
    </div>
  );
}