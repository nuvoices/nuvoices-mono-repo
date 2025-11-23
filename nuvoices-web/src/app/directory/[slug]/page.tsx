import { Metadata } from "next"
import ProfilePageClient from "./ProfilePageClient"

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
      `https://nuvoices-worker.storywithoutend.workers.dev/record/by-slug/${slug}`,
      { cache: "no-store" }
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

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const record = await fetchRecordBySlug(params.slug)

  if (!record) {
    return {
      title: "Profile Not Found - Nu Voices",
      description: "The expert profile you're looking for could not be found.",
    }
  }

  const title = `${record.name} - Nu Voices Expert Directory`
  const description = record.title
    ? `${record.name}, ${record.title}. ${record.location || ""}`
    : `${record.name} - Expert on China. ${record.location || ""}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      url: `https://nuvoices.com/directory/${params.slug}`,
      siteName: "Nu Voices",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  }
}

export default function ProfilePage({ params }: { params: { slug: string } }) {
  return <ProfilePageClient slug={params.slug} />
}
