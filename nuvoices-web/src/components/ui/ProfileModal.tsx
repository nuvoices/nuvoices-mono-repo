"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { X, MapPin } from "lucide-react"
import { TagList } from "./Tag"
import TwitterIcon from '../../../public/icons/twitter.svg'
import InstagramIcon from '../../../public/icons/instagram.svg'
import LinkedInIcon from '../../../public/icons/linkedin.svg'
import EmailIcon from '../../../public/icons/email.svg'

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

interface ProfileModalProps {
  record: Record
  isOpen: boolean
  onClose: () => void
}

export function ProfileModal({ record, isOpen, onClose }: ProfileModalProps) {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 5000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Set up portal root and handle escape key
  useEffect(() => {
    // Ensure portal root exists
    let root = document.getElementById('modal-portal-root')
    if (!root) {
      root = document.createElement('div')
      root.id = 'modal-portal-root'
      document.body.appendChild(root)
    }
    setPortalRoot(root)

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  if (!isOpen || !portalRoot) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        pointerEvents: 'auto'
      }}
      onClick={onClose}
    >
      <div
        className="fixed inset-0 md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:inset-auto bg-[#3c2e24] md:rounded-xl shadow-2xl md:max-w-[45rem] w-full md:max-h-[90vh] h-full md:h-auto overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-[1rem] right-[1rem] p-2 bg-transparent border-none flex items-center justify-center hover:opacity-80 transition z-10"
          aria-label="Close modal"
        >
          <X size={24} className="text-[#f4ecea]" strokeWidth={2.5} />
        </button>

        {/* Content */}
        <div className="flex flex-col gap-[0.75rem] pt-[4rem] px-[1.5rem] pb-[4rem]">
          {/* Name */}
          <div className="mb-6">
            <h1 className="font-serif text-[1.375rem] md:text-2xl font-semibold text-[#f4ecea]">
              {record.name}
            </h1>
          </div>

          {/* Title */}
          {record.title && (
            <p className="text-lg text-[#f4ecea]/90 mb-6 font-medium">
              {record.title}
            </p>
          )}

          {/* Specializations */}
          {record.specialisations && (
            <div className="mb-6">
              <TagList items={record.specialisations} />
            </div>
          )}

          {/* Category */}
          {record.category && (
            <div className="mb-6">
              <TagList items={record.category} color="gray" />
            </div>
          )}

          {/* Languages */}
          {record.languages && (
            <div className="mb-6">
              <TagList items={record.languages} color="blue" />
            </div>
          )}

          {/* Location */}
          {record.location && (
            <div className="flex items-center gap-[0.5rem] text-[#f4ecea]/80 mb-8">
              <MapPin size={18} className="text-[#f4ecea]/60" />
              <span className="text-sm">{record.location}</span>
            </div>
          )}

          {/* Contact & Social */}
          {(record.email || record.twitter || record.linkedin || record.instagram) && (
            <div className="mb-8">
              <div className="flex flex-col gap-[0.781rem]">
                {record.email && (
                  <div className="flex flex-row items-center gap-[0.5rem]">
                    <a
                      href={`mailto:${record.email}`}
                      aria-label="Email"
                      className="hover:opacity-80 transition flex items-center"
                    >
                      <EmailIcon className="w-[1rem] h-[1rem] text-[#f4ecea]" />
                    </a>
                    <button
                      onClick={() => handleCopy(record.email!, 'email')}
                      className="bg-transparent border-none p-0 text-[#f4ecea] text-xs leading-none"
                    >
                      {copiedField === 'email' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                )}
                {record.twitter && (
                  <div className="flex flex-row items-center gap-[0.5rem]">
                    <a
                      href={
                        record.twitter.startsWith("http")
                          ? record.twitter
                          : `https://twitter.com/${record.twitter.replace("@", "")}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Twitter"
                      className="hover:opacity-80 transition flex items-center"
                    >
                      <TwitterIcon className="w-[1rem] h-[1rem] text-[#f4ecea]" />
                    </a>
                    <button
                      onClick={() => handleCopy(record.twitter!.replace("@", ""), 'twitter')}
                      className="bg-transparent border-none p-0 text-[#f4ecea] text-xs leading-none"
                    >
                      {copiedField === 'twitter' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                )}
                {record.instagram && (
                  <div className="flex flex-row items-center gap-[0.5rem]">
                    <a
                      href={
                        record.instagram.startsWith("http")
                          ? record.instagram
                          : `https://instagram.com/${record.instagram.replace("@", "")}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram"
                      className="hover:opacity-80 transition flex items-center"
                    >
                      <InstagramIcon className="w-[1rem] h-[1rem] text-[#f4ecea]" />
                    </a>
                    <button
                      onClick={() => handleCopy(record.instagram!.replace("@", ""), 'instagram')}
                      className="bg-transparent border-none p-0 text-[#f4ecea] text-xs leading-none"
                    >
                      {copiedField === 'instagram' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                )}
                {record.linkedin && (
                  <div className="flex flex-row items-center gap-[0.5rem]">
                    <a
                      href={
                        record.linkedin.startsWith("http")
                          ? record.linkedin
                          : `https://linkedin.com/in/${record.linkedin}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="LinkedIn"
                      className="hover:opacity-80 transition flex items-center"
                    >
                      <LinkedInIcon className="w-[1rem] h-[1rem] text-[#f4ecea]" />
                    </a>
                    <button
                      onClick={() => handleCopy(record.linkedin!, 'linkedin')}
                      className="bg-transparent border-none p-0 text-[#f4ecea] text-xs leading-none"
                    >
                      {copiedField === 'linkedin' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    portalRoot
  )
}
