import Image from 'next/image';

export default function SubmissionsPage() {
  return (
    <div className="min-h-screen bg-[#f4ecea]">
      <div className="max-w-[23.813rem] mx-auto px-[1.875rem] py-[3.125rem]">
        {/* Title - 80px = 2.5rem */}
        <h1 className="font-serif text-[2.5rem] leading-[1.2] text-black tracking-[-0.075rem] mb-[1.25rem]">Submissions</h1>

        {/* Introduction text - 40px = 1.25rem */}
        <p className="font-serif text-[1.25rem] leading-[1.5625rem] text-black text-justify mb-[1.25rem]">
          We accept writing and visual art from persons of all genders and backgrounds
          for NüStories — an online magazine aimed for diverse voices on China subjects.
        </p>

        <div className="space-y-[1.25rem]">
          {/* Guidelines for written content */}
          <section>
            <h2 className="font-serif font-bold text-[0.938rem] leading-[1.6] text-black mb-[0.625rem]">Guidelines for written content</h2>
            <ul className="list-disc list-outside space-y-[0.313rem]" style={{ paddingInlineStart: '1.5rem' }}>
              <li className="font-serif text-[0.938rem] leading-[1.6] text-black">
                We're open to a range of formats, including reported features, narrative essays,
                op-eds, tutorials, Q&As, fiction, translations and listicles
              </li>
              <li className="font-serif text-[0.938rem] leading-[1.6] text-black">
                Written pieces should be no more than 1,400 words and include links to sources if relevant
              </li>
              <li className="font-serif text-[0.938rem] leading-[1.6] text-black">
                In your pitch, please also include one or two ideas on accompanying visuals for your piece
              </li>
              <li className="font-serif text-[0.938rem] leading-[1.6] text-black">
                Submissions should include a short bio with links to any social media accounts
              </li>
            </ul>
          </section>

          {/* Guidelines for visual works */}
          <section>
            <h2 className="font-serif font-bold text-[0.938rem] leading-[1.6] text-black mb-[0.625rem]">Guidelines for visual works</h2>
            <ul className="list-disc list-outside space-y-[0.313rem]" style={{ paddingInlineStart: '1.5rem' }}>
              <li className="font-serif text-[0.938rem] leading-[1.6] text-black">
                We're open to a range of formats, including illustrations, photography, and videos
              </li>
              <li className="font-serif text-[0.938rem] leading-[1.6] text-black">
                Visual submissions should be of high digital quality but smaller than 1.5 MB
              </li>
              <li className="font-serif text-[0.938rem] leading-[1.6] text-black">
                In your pitch, please also provide a brief text explaining the work
              </li>
              <li className="font-serif text-[0.938rem] leading-[1.6] text-black">
                Submissions should include a short bio with links to any social media accounts
              </li>
            </ul>
          </section>
        </div>

        {/* Team image - 539px height = 16.844rem, 780.405px width = 24.388rem */}
        <div className="mt-[1.25rem] flex justify-center">
          <div className="w-[24.388rem] h-[16.844rem] relative">
            <Image
              src="/group-pic.png"
              alt="NüVoices team"
              width={780}
              height={539}
              className="w-full h-full object-cover mix-blend-multiply"
            />
          </div>
        </div>
      </div>
    </div>
  )
}