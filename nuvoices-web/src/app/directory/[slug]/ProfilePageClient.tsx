"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Content } from "@/components/ui/Content"
import { TagList } from "@/components/ui/Tag"
import { ArrowLeft, Share2, Mail, Globe, Twitter, Linkedin, Instagram, Check } from "lucide-react"

interface Record {
  airtable_id: string
  name: string
  title: string | null
  specialisations: string | null
  category: string | null
  location: string | null
  languages: string | null
  email: string | null
  website: string | null
  twitter: string | null
  linkedin: string | null
  instagram: string | null
  slug: string
}

async function fetchRecordBySlug(slug: string): Promise<Record | null> {
  try {
    const response = await fetch(
      `https://nuvoices-worker.storywithoutend.workers.dev/record/by-slug/${slug}`
    )

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching record:", error)
    return null
  }
}

export default function ProfilePageClient({ slug }: { slug: string }) {
  const [record, setRecord] = useState<Record | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!slug) return

    fetchRecordBySlug(slug)
      .then((data) => {
        if (!data) {
          setError("Profile not found")
        } else {
          setRecord(data)
        }
      })
      .catch((err) => {
        setError("Failed to load profile")
        console.error(err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [slug])

  const handleShare = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4ecea] flex items-center justify-center">
        <div className="text-[#3c2e24] font-serif text-xl">Loading...</div>
      </div>
    )
  }

  if (error || !record) {
    return (
      <div className="min-h-screen bg-[#f4ecea]">
        <Content>
          <main className="py-[1.5rem]">
            <Link
              href="/directory"
              className="inline-flex items-center gap-2 text-[#3c2e24] hover:text-amber-700 mb-8 font-serif"
            >
              <ArrowLeft size={20} />
              Back to Directory
            </Link>

            <div className="bg-white rounded-lg p-12 text-center">
              <h1 className="text-[2rem] font-serif font-normal text-[#3c2e24] mb-4">
                Profile Not Found
              </h1>
              <p className="text-[0.9375rem] font-serif text-gray-600 mb-6">
                {error || "The profile you're looking for doesn't exist."}
              </p>
              <Link
                href="/directory"
                className="inline-block bg-[#3c2e24] text-white px-6 py-3 rounded-md hover:bg-amber-700 transition-colors font-serif"
              >
                Return to Directory
              </Link>
            </div>
          </main>
        </Content>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f4ecea]">
      <Content>
        <main className="py-[1.5rem]">
          {/* Back Button */}
          <Link
            href="/directory"
            className="inline-flex items-center gap-2 text-[#3c2e24] hover:text-amber-700 mb-8 font-serif"
          >
            <ArrowLeft size={20} />
            Back to Directory
          </Link>

          {/* Profile Card */}
          <div className="bg-[#FFFAFA] border border-[#E9EAEB] rounded-[8px] overflow-hidden">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-[#f4ecea] to-[#e8d5d1] p-8 relative">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-[2.5rem] font-serif font-normal leading-[1.1] tracking-[-0.089rem] text-[#3c2e24] mb-2">
                    {record.name}
                  </h1>
                  {record.title && (
                    <p className="text-[1.125rem] font-serif text-[#3c2e24] mb-3">
                      {record.title}
                    </p>
                  )}
                  {record.location && (
                    <p className="text-[0.875rem] font-sans text-[#717680] flex items-center gap-2">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M8 0C5.24 0 3 2.24 3 5C3 8.5 8 14 8 14C8 14 13 8.5 13 5C13 2.24 10.76 0 8 0ZM8 6.75C7.03 6.75 6.25 5.97 6.25 5C6.25 4.03 7.03 3.25 8 3.25C8.97 3.25 9.75 4.03 9.75 5C9.75 5.97 8.97 6.75 8 6.75Z"
                          fill="#717680"
                        />
                      </svg>
                      {record.location}
                    </p>
                  )}
                </div>

                {/* Share Button */}
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 bg-white px-4 py-2 rounded-md border border-[#E9EAEB] hover:bg-gray-50 transition-colors font-sans text-[0.875rem]"
                  title="Copy profile link"
                >
                  {copied ? (
                    <>
                      <Check size={16} className="text-green-600" />
                      <span className="text-green-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 size={16} />
                      Share Profile
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-8 space-y-8">
              {/* Contact Information */}
              {(record.email || record.website) && (
                <div>
                  <h2 className="text-[1.25rem] font-serif font-semibold text-[#3c2e24] mb-4">
                    Contact
                  </h2>
                  <div className="flex flex-wrap gap-4">
                    {record.email && (
                      <a
                        href={`mailto:${record.email}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#E9EAEB] rounded-md hover:border-[#3c2e24] transition-colors font-sans text-[0.875rem]"
                      >
                        <Mail size={16} />
                        Email
                      </a>
                    )}
                    {record.website && (
                      <a
                        href={record.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#E9EAEB] rounded-md hover:border-[#3c2e24] transition-colors font-sans text-[0.875rem]"
                      >
                        <Globe size={16} />
                        Website
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Social Media */}
              {(record.twitter || record.linkedin || record.instagram) && (
                <div>
                  <h2 className="text-[1.25rem] font-serif font-semibold text-[#3c2e24] mb-4">
                    Social Media
                  </h2>
                  <div className="flex flex-wrap gap-4">
                    {record.twitter && (
                      <a
                        href={
                          record.twitter.startsWith("http")
                            ? record.twitter
                            : `https://twitter.com/${record.twitter.replace("@", "")}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#E9EAEB] rounded-md hover:border-[#1DA1F2] hover:text-[#1DA1F2] transition-colors font-sans text-[0.875rem]"
                      >
                        <Twitter size={16} />
                        Twitter
                      </a>
                    )}
                    {record.linkedin && (
                      <a
                        href={
                          record.linkedin.startsWith("http")
                            ? record.linkedin
                            : `https://linkedin.com/in/${record.linkedin}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#E9EAEB] rounded-md hover:border-[#0A66C2] hover:text-[#0A66C2] transition-colors font-sans text-[0.875rem]"
                      >
                        <Linkedin size={16} />
                        LinkedIn
                      </a>
                    )}
                    {record.instagram && (
                      <a
                        href={
                          record.instagram.startsWith("http")
                            ? record.instagram
                            : `https://instagram.com/${record.instagram.replace("@", "")}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#E9EAEB] rounded-md hover:border-[#E4405F] hover:text-[#E4405F] transition-colors font-sans text-[0.875rem]"
                      >
                        <Instagram size={16} />
                        Instagram
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Specializations */}
              {record.specialisations && (
                <div>
                  <h2 className="text-[1.25rem] font-serif font-semibold text-[#3c2e24] mb-4">
                    Specializations
                  </h2>
                  <TagList items={record.specialisations} />
                </div>
              )}

              {/* Category */}
              {record.category && (
                <div>
                  <h2 className="text-[1.25rem] font-serif font-semibold text-[#3c2e24] mb-4">
                    Category
                  </h2>
                  <TagList items={record.category} color="gray" />
                </div>
              )}

              {/* Languages */}
              {record.languages && (
                <div>
                  <h2 className="text-[1.25rem] font-serif font-semibold text-[#3c2e24] mb-4">
                    Languages
                  </h2>
                  <TagList items={record.languages} color="blue" />
                </div>
              )}
            </div>
          </div>
        </main>
      </Content>
    </div>
  )
}
