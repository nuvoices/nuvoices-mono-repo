"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Content } from "@/components/ui/Content"
import { TagList } from "@/components/ui/Tag"
import { ArrowLeft, Share2, Mail, Globe, Twitter, Linkedin, Instagram, Check, MapPin } from "lucide-react"

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
    <div className="min-h-screen bg-white">
      <Content>
        <main className="py-8 max-w-4xl mx-auto">
          {/* Back Button */}
          <Link
            href="/directory"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-sans text-sm transition-colors"
          >
            <ArrowLeft size={18} />
            Back to Directory
          </Link>

          {/* Profile Card */}
          <div className="bg-white">
            {/* Header Section */}
            <div className="pb-8 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h1 className="text-3xl md:text-4xl font-semibold text-gray-900">
                      {record.name}
                    </h1>
                    {record.category && (
                      <TagList items={record.category} color="gray" />
                    )}
                  </div>
                  {record.title && (
                    <p className="text-lg text-gray-700 mb-4 font-medium">
                      {record.title}
                    </p>
                  )}
                  {record.specialisations && (
                    <div className="mb-4">
                      <TagList items={record.specialisations} />
                    </div>
                  )}
                  {record.location && (
                    <div className="flex items-center gap-2 text-gray-600 mb-6">
                      <MapPin size={18} className="text-gray-400" />
                      <span className="text-sm">{record.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact & Social */}
              {(record.email || record.website || record.twitter || record.linkedin || record.instagram) && (
                <div className="flex flex-wrap gap-3">
                  {record.email && (
                    <a
                      href={`mailto:${record.email}`}
                      className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all text-sm font-medium text-gray-700"
                    >
                      <Mail size={18} />
                      <span>Email</span>
                    </a>
                  )}
                  {record.website && (
                    <a
                      href={record.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all text-sm font-medium text-gray-700"
                    >
                      <Globe size={18} />
                      <span>Website</span>
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
                      className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-gray-50 hover:bg-[#0A66C2] hover:text-white rounded-lg transition-all text-sm font-medium text-gray-700"
                    >
                      <Linkedin size={18} />
                      <span>LinkedIn</span>
                    </a>
                  )}
                  {record.twitter && (
                    <a
                      href={
                        record.twitter.startsWith("http")
                          ? record.twitter
                          : `https://twitter.com/${record.twitter.replace("@", "")}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-gray-50 hover:bg-[#1DA1F2] hover:text-white rounded-lg transition-all text-sm font-medium text-gray-700"
                    >
                      <Twitter size={18} />
                      <span>Twitter</span>
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
                      className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-gray-50 hover:bg-[#E4405F] hover:text-white rounded-lg transition-all text-sm font-medium text-gray-700"
                    >
                      <Instagram size={18} />
                      <span>Instagram</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Content Section */}
            {record.languages && (
              <div className="py-8">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  Languages
                </h2>
                <TagList items={record.languages} color="blue" />
              </div>
            )}
          </div>
        </main>
      </Content>
    </div>
  )
}
