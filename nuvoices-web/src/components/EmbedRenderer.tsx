interface EmbedValue {
  url?: string;
  platform?: string;
  embedId?: string;
  caption?: string;
}

export function EmbedRenderer({ value }: { value: EmbedValue }) {
  if (!value?.url) {
    return null;
  }

  const { url, platform, embedId, caption } = value;

  // Render based on platform
  const renderEmbed = () => {
    switch (platform) {
      case 'youtube':
        if (!embedId) return null;
        return (
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={`https://www.youtube.com/embed/${embedId}`}
              className="absolute top-0 left-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={caption || 'YouTube video'}
            />
          </div>
        );

      case 'vimeo':
        if (!embedId) return null;
        return (
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={`https://player.vimeo.com/video/${embedId}`}
              className="absolute top-0 left-0 w-full h-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title={caption || 'Vimeo video'}
            />
          </div>
        );

      case 'instagram':
        if (!embedId) return null;
        return (
          <div className="max-w-[540px] mx-auto">
            <blockquote
              className="instagram-media"
              data-instgrm-permalink={`https://www.instagram.com/p/${embedId}/`}
              data-instgrm-version="14"
            >
              <a href={`https://www.instagram.com/p/${embedId}/`} target="_blank" rel="noopener noreferrer">
                View this post on Instagram
              </a>
            </blockquote>
            <script async src="//www.instagram.com/embed.js" />
          </div>
        );

      case 'tiktok':
        if (!embedId) return null;
        return (
          <div className="max-w-[605px] mx-auto">
            <blockquote
              className="tiktok-embed"
              cite={url}
              data-video-id={embedId}
            >
              <a href={url} target="_blank" rel="noopener noreferrer">
                View this video on TikTok
              </a>
            </blockquote>
            <script async src="https://www.tiktok.com/embed.js" />
          </div>
        );

      case 'twitter':
        if (!embedId) return null;
        return (
          <div className="max-w-[550px] mx-auto">
            <blockquote className="twitter-tweet">
              <a href={url} target="_blank" rel="noopener noreferrer">
                View this tweet
              </a>
            </blockquote>
            <script async src="https://platform.twitter.com/widgets.js" />
          </div>
        );

      case 'art19':
        return (
          <div className="w-full">
            <iframe
              src={url}
              className="w-full border-0"
              height="200"
              style={{ overflow: 'hidden' }}
              title={caption || 'Art19 Podcast'}
            />
          </div>
        );

      case 'acast':
        return (
          <div className="w-full">
            <iframe
              src={url}
              className="w-full border-0"
              height="200"
              style={{ overflow: 'hidden' }}
              title={caption || 'Acast Podcast'}
            />
          </div>
        );

      case 'buzzsprout':
        return (
          <div className="w-full">
            <iframe
              src={url}
              className="w-full border-0"
              height="200"
              style={{ overflow: 'hidden' }}
              title={caption || 'Buzzsprout Podcast'}
            />
          </div>
        );

      case 'amazon':
        return (
          <div className="w-full max-w-[800px] mx-auto">
            <iframe
              src={url}
              className="w-full border-0"
              height="500"
              title={caption || 'Amazon Kindle Preview'}
            />
          </div>
        );

      default:
        // Fallback for unknown platforms - just show a link
        return (
          <div className="my-[1.5rem] p-4 border border-gray-300 rounded">
            <p className="text-sm text-gray-600">Embedded content:</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#3c2e24] underline hover:text-amber-700"
            >
              {url}
            </a>
          </div>
        );
    }
  };

  return (
    <div className="my-[1.5rem]">
      {renderEmbed()}
      {caption && (
        <p className="text-[0.875rem] text-[#3c2e24] mt-2 text-center italic font-serif">
          {caption}
        </p>
      )}
    </div>
  );
}
