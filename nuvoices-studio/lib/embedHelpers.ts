export type EmbedPlatform =
  | 'youtube'
  | 'vimeo'
  | 'instagram'
  | 'tiktok'
  | 'twitter'
  | 'art19'
  | 'acast'
  | 'buzzsprout'
  | 'amazon'
  | 'unknown'

export interface EmbedData {
  platform: EmbedPlatform
  embedId: string | null
  embedUrl: string | null
  originalUrl: string
}

/**
 * Detect the platform from a URL
 */
export function detectPlatform(url: string): EmbedPlatform {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase().replace('www.', '')

    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return 'youtube'
    }
    if (hostname.includes('vimeo.com')) {
      return 'vimeo'
    }
    if (hostname.includes('instagram.com')) {
      return 'instagram'
    }
    if (hostname.includes('tiktok.com')) {
      return 'tiktok'
    }
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      return 'twitter'
    }
    if (hostname.includes('art19.com')) {
      return 'art19'
    }
    if (hostname.includes('acast.com')) {
      return 'acast'
    }
    if (hostname.includes('buzzsprout.com')) {
      return 'buzzsprout'
    }
    if (hostname.includes('amazon.com') && urlObj.pathname.includes('/read/')) {
      return 'amazon'
    }

    return 'unknown'
  } catch {
    return 'unknown'
  }
}

/**
 * Extract YouTube video ID from various YouTube URL formats
 */
function extractYouTubeId(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase().replace('www.', '')

    // youtu.be/VIDEO_ID
    if (hostname === 'youtu.be') {
      return urlObj.pathname.slice(1)
    }

    // youtube.com/watch?v=VIDEO_ID
    if (hostname.includes('youtube.com')) {
      const videoId = urlObj.searchParams.get('v')
      if (videoId) return videoId

      // youtube.com/embed/VIDEO_ID
      const embedMatch = urlObj.pathname.match(/\/embed\/([^/?]+)/)
      if (embedMatch) return embedMatch[1]

      // youtube.com/v/VIDEO_ID
      const vMatch = urlObj.pathname.match(/\/v\/([^/?]+)/)
      if (vMatch) return vMatch[1]
    }

    return null
  } catch {
    return null
  }
}

/**
 * Extract Vimeo video ID from URL
 */
function extractVimeoId(url: string): string | null {
  try {
    const urlObj = new URL(url)
    // vimeo.com/VIDEO_ID or vimeo.com/channels/*/VIDEO_ID
    const match = urlObj.pathname.match(/\/(\d+)/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

/**
 * Extract Instagram post ID from URL
 */
function extractInstagramId(url: string): string | null {
  try {
    const urlObj = new URL(url)
    // instagram.com/p/POST_ID/ or instagram.com/reel/REEL_ID/
    const match = urlObj.pathname.match(/\/(p|reel)\/([^/?]+)/)
    return match ? match[2] : null
  } catch {
    return null
  }
}

/**
 * Extract TikTok video ID from URL
 */
function extractTikTokId(url: string): string | null {
  try {
    const urlObj = new URL(url)
    // tiktok.com/@username/video/VIDEO_ID
    const match = urlObj.pathname.match(/\/video\/(\d+)/)
    if (match) return match[1]

    // tiktok.com/t/SHORT_CODE
    const shortMatch = urlObj.pathname.match(/\/t\/([^/?]+)/)
    if (shortMatch) return shortMatch[1]

    return null
  } catch {
    return null
  }
}

/**
 * Extract Twitter/X post ID from URL
 */
function extractTwitterId(url: string): string | null {
  try {
    const urlObj = new URL(url)
    // twitter.com/username/status/TWEET_ID or x.com/username/status/TWEET_ID
    const match = urlObj.pathname.match(/\/status\/(\d+)/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

/**
 * Extract Art19 episode ID from URL
 * art19.com/shows/SHOW_NAME/episodes/EPISODE_ID/embed
 */
function extractArt19Id(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const match = urlObj.pathname.match(/\/episodes\/([^/?]+)/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

/**
 * Extract Acast episode ID from URL
 * embed.acast.com/SHOW_ID/EPISODE_ID
 */
function extractAcastId(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const parts = urlObj.pathname.split('/').filter(Boolean)
    // Return the full path after the domain as the ID
    return parts.join('/') || null
  } catch {
    return null
  }
}

/**
 * Extract Buzzsprout episode ID from URL
 * buzzsprout.com/SHOW_ID/EPISODE_ID
 */
function extractBuzzsproutId(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const match = urlObj.pathname.match(/\/(\d+)\/(\d+)/)
    return match ? `${match[1]}/${match[2]}` : null
  } catch {
    return null
  }
}

/**
 * Extract Amazon Kindle ASIN from URL
 * read.amazon.com/kp/embed?asin=ASIN&...
 */
function extractAmazonId(url: string): string | null {
  try {
    const urlObj = new URL(url)
    return urlObj.searchParams.get('asin')
  } catch {
    return null
  }
}

/**
 * Generate embed URL for a platform
 */
function generateEmbedUrl(platform: EmbedPlatform, embedId: string): string | null {
  switch (platform) {
    case 'youtube':
      return `https://www.youtube.com/embed/${embedId}`
    case 'vimeo':
      return `https://player.vimeo.com/video/${embedId}`
    case 'instagram':
      return `https://www.instagram.com/p/${embedId}/embed`
    case 'tiktok':
      // TikTok embeds require the full URL in most cases
      return null // Will use original URL
    case 'twitter':
      return null // Twitter embeds use oEmbed API
    case 'art19':
      // Art19 embeds - already includes show name in the episode ID path
      return null // Will use original URL
    case 'acast':
      return `https://embed.acast.com/${embedId}`
    case 'buzzsprout':
      return null // Will use original URL (already has all params)
    case 'amazon':
      return null // Will use original URL
    default:
      return null
  }
}

/**
 * Parse a URL and extract embed data
 */
export function parseEmbedUrl(url: string): EmbedData {
  const platform = detectPlatform(url)
  let embedId: string | null = null

  switch (platform) {
    case 'youtube':
      embedId = extractYouTubeId(url)
      break
    case 'vimeo':
      embedId = extractVimeoId(url)
      break
    case 'instagram':
      embedId = extractInstagramId(url)
      break
    case 'tiktok':
      embedId = extractTikTokId(url)
      break
    case 'twitter':
      embedId = extractTwitterId(url)
      break
    case 'art19':
      embedId = extractArt19Id(url)
      break
    case 'acast':
      embedId = extractAcastId(url)
      break
    case 'buzzsprout':
      embedId = extractBuzzsproutId(url)
      break
    case 'amazon':
      embedId = extractAmazonId(url)
      break
  }

  const embedUrl = embedId ? generateEmbedUrl(platform, embedId) : null

  return {
    platform,
    embedId,
    embedUrl,
    originalUrl: url,
  }
}

/**
 * Get platform display name
 */
export function getPlatformName(platform: EmbedPlatform): string {
  const names: Record<EmbedPlatform, string> = {
    youtube: 'YouTube',
    vimeo: 'Vimeo',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    twitter: 'Twitter/X',
    art19: 'Art19 Podcast',
    acast: 'Acast Podcast',
    buzzsprout: 'Buzzsprout Podcast',
    amazon: 'Amazon Kindle',
    unknown: 'Unknown',
  }
  return names[platform]
}
