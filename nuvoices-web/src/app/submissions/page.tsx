import Image from 'next/image'

export default function SubmissionsPage() {
  return (
    <div className="min-h-screen bg-pink-50">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-5xl font-serif text-center mb-12">Submissions</h1>
        
        <p className="text-lg text-center mb-16 max-w-3xl mx-auto">
          We accept writing and visual art from persons of all genders and backgrounds 
          for NüStories — an online magazine aimed for diverse voices on China subjects.
        </p>

        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-bold mb-6">Guidelines for written content</h2>
            <ul className="list-disc list-inside space-y-3 text-gray-700">
              <li>
                We're open to a range of formats, including reported features, narrative essays, 
                op-eds, tutorials, Q&As, fiction, translations and listicles
              </li>
              <li>
                Written pieces should be no more than 1,400 words and include links to sources if relevant
              </li>
              <li>
                In your pitch, please also include one or two ideas on accompanying visuals for your piece
              </li>
              <li>
                Submissions should include a short bio with links to any social media accounts
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6">Guidelines for visual works</h2>
            <ul className="list-disc list-inside space-y-3 text-gray-700">
              <li>
                We're open to a range of formats, including illustrations, photography, and videos
              </li>
              <li>
                Visual submissions should be of high digital quality but smaller than 1.5 MB
              </li>
              <li>
                In your pitch, please also provide a brief text explaining the work
              </li>
              <li>
                Submissions should include a short bio with links to any social media accounts
              </li>
            </ul>
          </section>
        </div>

        <div className="mt-16 flex justify-center">
          <div className="w-full max-w-2xl">
            <Image
              src="/placeholder-team.jpg"
              alt="NüVoices team"
              width={800}
              height={500}
              className="w-full h-auto rounded-lg"
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
            />
          </div>
        </div>
      </div>
    </div>
  )
}